import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const { category } = req.query

  try {
    // 1. Récupérer les SÉRIES (masters avec épisodes)
    const series = await prisma.videos.findMany({
      where: {
        isSeries: true,
        parentId: null,
        status: { in: ['approved', 'published'] },
        ...(category && category !== 'all' && category !== 'ranking' && category !== 'unpublished' ? { category: category as string } : {})
      },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        episodes: {
          where: {
            parentId: { not: null },
            status: { in: ['approved', 'published'] }
          },
          orderBy: { episodeNumber: 'asc' }
        }
      }
    })

    // 2. Récupérer les FILMS SIMPLES (vidéos seules)
    const movies = await prisma.videos.findMany({
      where: {
        isSeries: false,
        parentId: null,
        status: 'approved',
        ...(category && category !== 'all' && category !== 'ranking' && category !== 'unpublished' ? { category: category as string } : {})
      },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        }
      }
    })

    // 3. Formater les séries
    const formattedSeries = series.map((video) => ({
      id: video.id,
      title: video.title,
      description: video.description,
      coverImage: video.thumbnail,
      totalEpisodes: video.episodes?.length || 0,
      totalViews: video.views || 0,
      category: video.category,
      creator: video.creator,
      createdAt: video.createdAt,
      type: 'series' as const
    }))

    // 4. Formater les films simples
    const formattedMovies = movies.map((video) => ({
      id: video.id,
      title: video.title,
      description: video.description,
      coverImage: video.thumbnail,
      duration: video.duration || 0,
      price: video.price || 0,
      totalViews: video.views || 0,
      category: video.category,
      creator: video.creator,
      createdAt: video.createdAt,
      type: 'movie' as const
    }))

    // 5. Trier par vues pour "ranking"
    if (category === 'ranking') {
      formattedSeries.sort((a, b) => b.totalViews - a.totalViews)
      formattedMovies.sort((a, b) => b.totalViews - a.totalViews)
    }

    // 6. Trier par date pour "unpublished"
    if (category === 'unpublished') {
      formattedSeries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      formattedMovies.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return res.status(200).json({
      series: formattedSeries,
      movies: formattedMovies
    })
  } catch (error) {
    console.error('Erreur videos-by-category:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}