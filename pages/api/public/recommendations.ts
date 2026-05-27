import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    // Utilisateur non connecté : retourner les tendances
    const trending = await getTrendingContent()
    return res.status(200).json(trending)
  }

  try {
    // 1. Récupérer l'historique de l'utilisateur (achats)
    const purchases = await prisma.purchases.findMany({
      where: { userId: session.user.id },
      include: { video: { select: { category: true, isSeries: true, parentId: true } } }
    })

    // 2. Analyser les catégories préférées
    const categoryCount: Record<string, number> = {}
    for (const p of purchases) {
      const cat = p.video.category
      if (cat) {
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
    const purchasedIds = purchases.map((p) => p.videoId)

    // 5. Récupérer les recommandations (vidéos non achetées de la catégorie préférée)
    let recommendations = await prisma.videos.findMany({
      where: {
        status: 'approved',
        isSeries: false,
        parentId: null,
        id: { notIn: purchasedIds },
        ...(preferredCategory !== 'popular' ? { category: preferredCategory } : {})
      },
      orderBy: { views: 'desc' },
      take: 20,
      include: {
        creator: { select: { name: true, phone: true } }
      }
    })

    // 6. Si pas assez de recommandations, compléter avec les tendances
    if (recommendations.length < 10) {
      const trending = await getTrendingContent()
      const existingIds = recommendations.map((r) => r.id)
      const additional = trending.movies.filter((movie: any) => !existingIds.includes(movie.id))
      recommendations = [...recommendations, ...additional].slice(0, 20)
    }

    // 7. Ajouter des recommandations de séries
    const seriesRecommendations = await getSeriesRecommendations(preferredCategory, purchasedIds)

    return res.status(200).json({
      movies: recommendations,
      series: seriesRecommendations,
      preferredCategory
    })
  } catch (error) {
    console.error('Erreur recommendations:', error)
    const trending = await getTrendingContent()
    return res.status(200).json(trending)
  }
}

// Fonction pour récupérer les contenus tendances
async function getTrendingContent() {
  const movies = await prisma.videos.findMany({
    where: { status: 'approved', isSeries: false, parentId: null },
    orderBy: { views: 'desc' },
    take: 20,
    include: { creator: { select: { name: true, phone: true } } }
  })

  const series = await prisma.videos.findMany({
    where: { status: 'approved', isSeries: true, parentId: null },
    orderBy: { views: 'desc' },
    take: 10,
    include: {
      creator: { select: { name: true, phone: true } },
      episodes: { where: { parentId: { not: null } }, take: 1 }
    }
  })

  const formattedSeries = series.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    coverImage: s.thumbnail,
    totalEpisodes: s.episodes.length,
    totalViews: s.views,
    category: s.category,
    creator: s.creator,
    createdAt: s.createdAt,
    type: 'series' as const
  }))

  return { movies, series: formattedSeries }
}

async function getSeriesRecommendations(category: string, purchasedIds: string[]) {
  const series = await prisma.videos.findMany({
    where: {
      status: 'approved',
      isSeries: true,
      parentId: null,
      id: { notIn: purchasedIds },
      ...(category !== 'popular' ? { category } : {})
    },
    orderBy: { views: 'desc' },
    take: 10,
    include: {
      creator: { select: { name: true, phone: true } },
      episodes: { where: { parentId: { not: null } }, take: 1 }
    }
  })

  return series.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    coverImage: s.thumbnail,
    totalEpisodes: s.episodes.length,
    totalViews: s.views,
    category: s.category,
    creator: s.creator,
    createdAt: s.createdAt,
    type: 'series' as const
  }))
}