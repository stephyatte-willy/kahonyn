import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // CORRECTION : Utiliser la table Series directement
    const series = await (prisma as any).series.findMany({
      where: {
        status: 'approved'  // Seulement les séries approuvées
      },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { name: true, phone: true } },
        episodes: {
          where: { 
            status: 'approved'
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    const formattedSeries = series.map((serie: any) => ({
      id: serie.id,
      title: serie.title,
      description: serie.description,
      coverImage: serie.coverImage,  // CORRECTION : coverImage (champ Series)
      totalEpisodes: serie.totalEpisodes || serie.episodes?.length || 0,
      totalViews: serie.totalViews || 0,  // CORRECTION : totalViews
      category: serie.category,
      creator: serie.creator,
      createdAt: serie.createdAt
    }))

    return res.status(200).json(formattedSeries)
  } catch (error) {
    console.error('Erreur series:', error)
    return res.status(200).json([])
  }
}