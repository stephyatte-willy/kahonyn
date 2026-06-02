// pages/api/public/videos-by-category.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const { category } = req.query

  try {
    const categoryFilter = category as string

    // 1. Récupérer les SÉRIES
    const seriesList = await (prisma as any).series.findMany({
      where: {
        status: { in: ['approved', 'published'] },
        ...(categoryFilter && 
            categoryFilter !== 'all' && 
            categoryFilter !== 'ranking' && 
            categoryFilter !== 'unpublished' 
            ? { category: categoryFilter } 
            : {})
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
            status: { in: ['approved', 'published'] }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    // 2. Récupérer les FILMS SIMPLES
    const movies = await (prisma as any).video.findMany({
      where: {
        status: 'approved',
        seriesId: null,
        ...(categoryFilter && 
            categoryFilter !== 'all' && 
            categoryFilter !== 'ranking' && 
            categoryFilter !== 'unpublished' 
            ? { category: categoryFilter } 
            : {})
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
    const formattedSeries = seriesList.map((s: any) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      coverImage: s.coverImage,
      totalEpisodes: s.totalEpisodes || s.episodes?.length || 0,
      totalViews: s.totalViews || 0,
      category: s.category,
      creator: s.creator,
      createdAt: s.createdAt,
      type: 'series' as const
    }))

    // 4. Formater les films
    const formattedMovies = movies.map((v: any) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      coverImage: v.thumbnail,
      duration: v.duration || 0,
      price: v.price || 0,
      totalViews: v.views || 0,
      category: v.category,
      creator: v.creator,
      createdAt: v.createdAt,
      type: 'movie' as const
    }))

    // 5. Trier par vues pour "ranking"
    if (categoryFilter === 'ranking') {
      formattedSeries.sort((a: any, b: any) => b.totalViews - a.totalViews)
      formattedMovies.sort((a: any, b: any) => b.totalViews - a.totalViews)
    }

    // 6. Trier par date pour "unpublished" (plus récent d'abord)
    if (categoryFilter === 'unpublished') {
      formattedSeries.sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      formattedMovies.sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }

    return res.status(200).json({
      series: formattedSeries,
      movies: formattedMovies
    })
  } catch (error) {
    console.error('Erreur videos-by-category:', error)
    return res.status(200).json({
      series: [],
      movies: []
    })
  }
}