// /api/public/series/[id]/episodes.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // ✅ Récupérer uniquement les épisodes APPROUVÉS et NON ARCHIVÉS
    // Le master archivé a status='archived' donc il sera exclu
    const episodes = await (prisma as any).video.findMany({
      where: {
        seriesId: id as string,
        status: 'approved',        // ← Exclut les masters archivés (status='archived')
        // Optionnel : exclure aussi les vidéos avec un titre contenant "master"
        // title: { not: { contains: 'master' } }
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        thumbnail: true,
        duration: true,
        price: true,
        views: true,
        purchasesCount: true,
        createdAt: true,
      }
    })

    // Ajouter un numéro d'épisode calculé (basé sur l'ordre)
    const episodesWithNumber = episodes.map((ep: any, index: number) => ({
      ...ep,
      episodeNumber: index + 1,
      // ✅ Marquer comme gratuit si c'est un des premiers épisodes
      isFree: index < (ep.freeEpisodes || 1), // Sera fusionné avec les données de la série
    }))

    return res.status(200).json(episodesWithNumber)
  } catch (error) {
    console.error('Erreur episodes:', error)
    return res.status(200).json([])
  }
}