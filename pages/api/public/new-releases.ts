import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const newReleases = await prisma.videos.findMany({
      where: { 
        isSeries: true,
        parentId: null,
        status: 'approved'
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        creator: { select: { name: true, phone: true } },
        episodes: {
          where: { parentId: { not: null }, status: 'approved' },
          orderBy: { episodeNumber: 'asc' }
        }
      }
    })

    const formattedNewReleases = newReleases.map(series => ({
      id: series.id,
      title: series.title,
      description: series.description,
      coverImage: series.thumbnail,
      totalEpisodes: series.episodes.length,
      totalViews: series.views,
      creator: series.creator,
      createdAt: series.createdAt
    }))

    return res.status(200).json(formattedNewReleases)
  } catch (error) {
    console.error('Erreur new-releases:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}