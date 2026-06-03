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

    // Si pas connecté, retourner les tendances
    if (!session) {
      const trending = await getTrendingContent()
      return res.status(200).json(trending)
    }

    const userId = (session.user as any).id

    // 1. Récupérer l'historique des achats de l'utilisateur
    const purchases = await (prisma as any).purchase.findMany({
      where: { userId },
      include: { 
        video: { select: { category: true, seriesId: true } },
        series: { select: { category: true } }
      }
    })

    // 2. Analyser les catégories préférées
    const categoryCount: Record<string, number> = {}
    for (const p of purchases) {
      const catString = p.video?.category || p.series?.category
      if (catString) {
        // Diviser les catégories multiples
        const cats = catString.split(',')
        for (const cat of cats) {
          const trimmedCat = cat.trim()
          if (trimmedCat) {
            categoryCount[trimmedCat] = (categoryCount[trimmedCat] || 0) + 1
          }
        }
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
    const purchasedVideoIds = purchases
      .filter((p: any) => p.videoId)
      .map((p: any) => p.videoId)

    const purchasedSeriesIds = purchases
      .filter((p: any) => p.seriesId)
      .map((p: any) => p.seriesId)

    // Récupérer les IDs des masters archivés à exclure
    let archivedMasterIds: string[] = []
    try {
      const archivedMasters = await (prisma as any).video.findMany({
        where: { status: 'archived', seriesId: { not: null } },
        select: { id: true }
      })
      archivedMasterIds = archivedMasters.map((v: any) => v.id)
    } catch (err) {
      archivedMasterIds = []
    }

    // Combiner tous les IDs à exclure
    const excludeVideoIds = [...purchasedVideoIds, ...archivedMasterIds]
    const excludeSeriesIds = purchasedSeriesIds

    // 5. Récupérer les recommandations de films
    const videoWhere: any = {
      status: 'approved',
      seriesId: null,
    }

    if (excludeVideoIds.length > 0) {
      videoWhere.id = { notIn: excludeVideoIds }
    }

    if (preferredCategory !== 'popular') {
      videoWhere.category = { contains: preferredCategory }
    }

    let recommendations = await (prisma as any).video.findMany({
      where: videoWhere,
      orderBy: { views: 'desc' },
      take: 20,
      include: {
        creator: { select: { name: true, phone: true } }
      }
    })

    // 6. Si pas assez de recommandations, compléter avec les tendances
    if (recommendations.length < 10) {
      const trending = await getTrendingContent()
      const existingIds = recommendations.map((r: any) => r.id)
      const additional = (trending.movies || []).filter(
        (movie: any) => !existingIds.includes(movie.id) && !excludeVideoIds.includes(movie.id)
      )
      recommendations = [...recommendations, ...additional].slice(0, 20)
    }

    // 7. Récupérer les recommandations de séries
    const seriesWhere: any = {
      status: { in: ['approved', 'published'] },
    }

    if (excludeSeriesIds.length > 0) {
      seriesWhere.id = { notIn: excludeSeriesIds }
    }

    if (preferredCategory !== 'popular') {
      seriesWhere.category = { contains: preferredCategory }
    }

    let seriesRecommendations = await (prisma as any).series.findMany({
      where: seriesWhere,
      orderBy: { totalViews: 'desc' },
      take: 10,
      include: {
        creator: { select: { name: true, phone: true } },
        episodes: {
          where: { status: { in: ['approved', 'published'] } },
          take: 1,
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    // Si pas assez de séries, compléter
    if (seriesRecommendations.length < 5) {
      const trending = await getTrendingContent()
      const existingSeriesIds = seriesRecommendations.map((s: any) => s.id)
      const additionalSeries = (trending.series || []).filter(
        (s: any) => !existingSeriesIds.includes(s.id) && !excludeSeriesIds.includes(s.id)
      )
      seriesRecommendations = [...seriesRecommendations, ...additionalSeries].slice(0, 10)
    }

    const formattedSeries = seriesRecommendations.map((s: any) => ({
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

    return res.status(200).json({
      movies: recommendations,
      series: formattedSeries,
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
    // Récupérer les IDs des masters archivés à exclure
    let archivedMasterIds: string[] = []
    try {
      const archivedMasters = await (prisma as any).video.findMany({
        where: { status: 'archived', seriesId: { not: null } },
        select: { id: true }
      })
      archivedMasterIds = archivedMasters.map((v: any) => v.id)
    } catch (err) {
      archivedMasterIds = []
    }

    const videoWhere: any = {
      status: 'approved',
      seriesId: null,
    }

    if (archivedMasterIds.length > 0) {
      videoWhere.id = { notIn: archivedMasterIds }
    }

    const movies = await (prisma as any).video.findMany({
      where: videoWhere,
      orderBy: { views: 'desc' },
      take: 20,
      include: { 
        creator: { select: { name: true, phone: true } } 
      }
    })

    const seriesList = await (prisma as any).series.findMany({
      where: { 
        status: { in: ['approved', 'published'] } 
      },
      orderBy: { totalViews: 'desc' },
      take: 10,
      include: {
        creator: { select: { name: true, phone: true } },
        episodes: {
          where: { status: { in: ['approved', 'published'] } },
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