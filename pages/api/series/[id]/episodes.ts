// pages/api/series/[id]/episodes.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const episodes = await (prisma as any).video.findMany({
      where: {
        seriesId: id as string,  // ← Correction : seriesId au lieu de parentId
        status: 'approved'
      },
      orderBy: {
        createdAt: 'asc'  // ← Correction : createdAt au lieu de episodeNumber
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

    // Ajouter un numéro d'épisode calculé
    const episodesWithNumber = episodes.map((ep: any, index: number) => ({
      ...ep,
      episodeNumber: index + 1,
    }))

    return res.status(200).json(episodesWithNumber)
  } catch (error) {
    console.error('Erreur episodes:', error)
    return res.status(200).json([])
  }
}