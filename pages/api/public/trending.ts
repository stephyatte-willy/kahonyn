import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // CORRECTION : Utiliser la table Series directement
    const trending = await (prisma as any).series.findMany({
      where: { 
        status: 'approved'
      },
      orderBy: { totalViews: 'desc' },  // CORRECTION : totalViews
      take: 10,
      include: {
        creator: { select: { name: true, phone: true } },
        episodes: {
          where: { status: 'approved' },
          orderBy: { createdAt: 'asc' }  // CORRECTION : createdAt
        }
      }
    })

    // Transformer les données pour l'affichage
    const formattedTrending = trending.map((series: any) => ({
      id: series.id,
      title: series.title,
      description: series.description,
      coverImage: series.coverImage,  // CORRECTION : coverImage
      totalEpisodes: series.totalEpisodes || series.episodes?.length || 0,
      totalViews: series.totalViews || 0,  // CORRECTION : totalViews
      creator: series.creator,
      createdAt: series.createdAt
    }))

    return res.status(200).json(formattedTrending)
  } catch (error) {
    console.error('Erreur trending:', error)
    return res.status(200).json([])
  }
}