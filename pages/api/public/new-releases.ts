import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // CORRECTION : Utiliser la table Series (pas Video) pour les séries
    const newReleases = await (prisma as any).series.findMany({
      where: { 
        status: 'approved'
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        creator: { select: { name: true, phone: true } },
        episodes: {
          where: { status: 'approved' },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    const formattedNewReleases = newReleases.map((series: any) => ({
      id: series.id,
      title: series.title,
      description: series.description,
      coverImage: series.coverImage,
      totalEpisodes: series.totalEpisodes || series.episodes?.length || 0,
      totalViews: series.totalViews || 0,
      creator: series.creator,
      createdAt: series.createdAt
    }))

    return res.status(200).json(formattedNewReleases)
  } catch (error) {
    console.error('Erreur new-releases:', error)
    return res.status(200).json([])
  }
}