import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // Récupérer les masters (séries) qui ont des épisodes (parentId null)
    // Exclure les masters archivés car ils ne doivent pas apparaître
    const series = await prisma.videos.findMany({
      where: {
        isSeries: true,
        parentId: null,
        status: 'approved'  // ← Seulement les masters approuvés, pas archivés
      },
      orderBy: { createdAt: 'desc' },
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

    const formattedSeries = series.map(serie => ({
      id: serie.id,
      title: serie.title,
      description: serie.description,
      coverImage: serie.thumbnail,
      totalEpisodes: serie.episodes.length,
      totalViews: serie.views,
      category: serie.category,
      creator: serie.creator,
      createdAt: serie.createdAt
    }))

    return res.status(200).json(formattedSeries)
  } catch (error) {
    console.error('Erreur series:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}