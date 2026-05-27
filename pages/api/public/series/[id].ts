import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  // Vérifier la méthode HTTP
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  // Vérifier l'ID
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID de série requis' })
  }

  try {
    // Récupérer la série (master) avec ses épisodes
    const series = await prisma.videos.findFirst({
      where: {
        id: id,
        isSeries: true,
        parentId: null,
        status: 'approved'
      },
      include: {
        creator: { select: { name: true, phone: true } },
        episodes: {
          where: {
            parentId: { not: null },
            status: 'approved'
          },
          orderBy: { episodeNumber: 'asc' }
        }
      }
    })

    // Si la série n'existe pas
    if (!series) {
      return res.status(404).json({ error: 'Série non trouvée' })
    }

    // Formater la réponse
    const formattedSeries = {
      id: series.id,
      title: series.title,
      description: series.description,
      coverImage: series.thumbnail,
      creator: series.creator,
      totalEpisodes: series.episodes.length,
      totalViews: series.views,
      totalPurchases: series.purchases,
      episodes: series.episodes.map(ep => ({
        id: ep.id,
        episodeNumber: ep.episodeNumber,
        title: ep.title,
        description: ep.description,
        videoUrl: ep.url,
        thumbnail: ep.thumbnail,
        duration: ep.duration,
        price: ep.price,
        views: ep.views,
        purchases: ep.purchases
      })),
      createdAt: series.createdAt
    }

    return res.status(200).json(formattedSeries)
  } catch (error) {
    console.error('Erreur API series detail:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}