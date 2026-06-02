// pages/api/public/recommendations.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session) {
      // Utilisateur non connecté : retourner les tendances
      const trending = await getTrendingContent()
      return res.status(200).json(trending)
    }

    // 1. Récupérer l'historique des achats de l'utilisateur
    const purchases = await (prisma as any).purchase.findMany({
      where: { userId: (session.user as any).id },
      include: { 
        video: { 
          select: { 
            category: true,
            seriesId: true
          } 
        } 
      }
    })

    // 2. Analyser les catégories préférées
    const categoryCount: Record<string, number> = {}
    for (const p of purchases) {
      if (p.video?.category) {
        const cat = p.video.category
        categoryCount[cat] = (categoryCount[cat] || 0) + 1
      }
    }

    // 3. Déterminer la catégorie préférée
    let preferredCategory = 'popular'
    let maxCount = 0
    for (const [cat, count] of Object.entries(categoryCount)) {
      if (count > maxCount) {
        maxCount = count
        preferredCategory = cat
      }
    }

    // 4. Récupérer les IDs des vidéos déjà achetées
    const purchasedIds = purchases
      .filter((p: any) => p.videoId)
      .map((p: any) => p.videoId)

    // 5. Récupérer les recommandations
    let recommendations = await (prisma as any).video.findMany({
      where: {
        status: 'approved',
        seriesId: null, // Films simples uniquement
        id: { notIn: purchasedIds.length > 0 ? purchasedIds : [''] },
        ...(preferredCategory !== 'popular' ? { category: preferredCategory } : {})
      },
      orderBy: { views: 'desc' },
      take: 20,
      include: {
        creator: { select: { name: true, phone: true } }
      }
    })

    // 6. Si pas assez, compléter avec les tendances
    if (recommendations.length < 10) {
      const trending = await getTrendingContent()
      const existingIds = recommendations.map((r: any) => r.id)
      const additional = (trending.movies || []).filter(
        (movie: any) => !existingIds.includes(movie.id)
      )
      recommendations = [...recommendations, ...additional].slice(0, 20)
    }

    // 7. Séries recommandées
    const seriesRecommendations = await getSeriesRecommendations(
      preferredCategory, 
      purchasedIds
    )

    return res.status(200).json({
      movies: recommendations,
      series: seriesRecommendations,
      preferredCategory
    })
  } catch (error) {
    console.error('Erreur recommendations:', error)
    // En cas d'erreur, retourner les tendances
    try {
      const trending = await getTrendingContent()
      return res.status(200).json(trending)
    } catch (e) {
      return res.status(200).json({ 
        movies: [], 
        series: [], 
        preferredCategory: 'popular' 
      })
    }
  }
}

// Fonction pour récupérer les contenus tendances
async function getTrendingContent() {
  try {
    const movies = await (prisma as any).video.findMany({
      where: { 
        status: 'approved', 
        seriesId: null 
      },
      orderBy: { views: 'desc' },
      take: 20,
      include: { 
        creator: { select: { name: true, phone: true } } 
      }
    })

    const seriesList = await (prisma as any).series.findMany({
      where: { status: 'approved' },
      orderBy: { totalViews: 'desc' },
      take: 10,
      include: {
        creator: { select: { name: true, phone: true } },
        episodes: {
          where: { status: 'approved' },
          take: 1,
          orderBy: { createdAt: 'asc' }
        }
      }
    })

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

    return { movies, series: formattedSeries }
  } catch (error) {
    console.error('Erreur getTrendingContent:', error)
    return { movies: [], series: [] }
  }
}

async function getSeriesRecommendations(category: string, purchasedIds: string[]) {
  try {
    const seriesList = await (prisma as any).series.findMany({
      where: {
        status: 'approved',
        id: { notIn: purchasedIds.length > 0 ? purchasedIds : [''] },
        ...(category !== 'popular' ? { category } : {})
      },
      orderBy: { totalViews: 'desc' },
      take: 10,
      include: {
        creator: { select: { name: true, phone: true } },
        episodes: {
          where: { status: 'approved' },
          take: 1,
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    return seriesList.map((s: any) => ({
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
  } catch (error) {
    console.error('Erreur getSeriesRecommendations:', error)
    return []
  }
}