import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const userId = (session.user as any).id

    // 1. Récupérer les LIKES (seriesId = null)
    const likes = await (prisma as any).like.findMany({
      where: { 
        userId,
        seriesId: null // ← Uniquement les likes
      },
      include: {
        video: {
          include: {
            creator: { select: { name: true, phone: true } },
            series: { select: { id: true, title: true, coverImage: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // 2. Récupérer les SAVES (seriesId != null)
const saves = await (prisma as any).like.findMany({
  where: { 
    userId,
    seriesId: { not: null } // ← Tous les saves ont un seriesId non null
  },
  include: {
    video: {
      include: {
        creator: { select: { name: true, phone: true } },
        series: { select: { id: true, title: true, coverImage: true } }
      }
    }
  },
  orderBy: { createdAt: 'desc' }
})

    // 3. Récupérer les achats
    const purchases = await (prisma as any).purchase.findMany({
      where: { userId, status: 'completed' },
      include: {
        video: {
          include: {
            creator: { select: { name: true, phone: true } },
            series: { select: { id: true, title: true, coverImage: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Formater les LIKES
    const processedLikeSeriesIds = new Set<string>()
    const likedItems: any[] = []

    for (const like of likes) {
      if (!like.video) continue

      if (like.video.seriesId && !processedLikeSeriesIds.has(like.video.seriesId)) {
        processedLikeSeriesIds.add(like.video.seriesId)
        likedItems.push({
          id: like.video.seriesId,
          title: like.video.series?.title || like.video.title,
          description: '',
          coverImage: like.video.series?.coverImage || like.video.thumbnail,
          price: 0, duration: 0, views: 0,
          creator: like.video.creator || { name: 'Inconnu', phone: '' },
          type: 'series',
          addedAt: like.createdAt,
          addedVia: 'like' as const
        })
      } else if (!like.video.seriesId) {
        likedItems.push({
          id: like.video.id,
          title: like.video.title,
          description: like.video.description || '',
          coverImage: like.video.thumbnail,
          price: like.video.price || 0,
          duration: like.video.duration || 0,
          views: like.video.views || 0,
          creator: like.video.creator || { name: 'Inconnu', phone: '' },
          type: 'movie',
          addedAt: like.createdAt,
          addedVia: 'like' as const
        })
      }
    }

    // Formater les SAVES
    const processedSaveSeriesIds = new Set<string>()
    const savedItems: any[] = []

    for (const save of saves) {
      if (!save.video) continue

      if (save.video.seriesId && !processedSaveSeriesIds.has(save.video.seriesId)) {
        processedSaveSeriesIds.add(save.video.seriesId)
        savedItems.push({
          id: save.video.seriesId,
          title: save.video.series?.title || save.video.title,
          description: '',
          coverImage: save.video.series?.coverImage || save.video.thumbnail,
          price: 0, duration: 0, views: 0,
          creator: save.video.creator || { name: 'Inconnu', phone: '' },
          type: 'series',
          addedAt: save.createdAt,
          addedVia: 'save' as const
        })
      } else if (!save.video.seriesId) {
        savedItems.push({
          id: save.video.id,
          title: save.video.title,
          description: save.video.description || '',
          coverImage: save.video.thumbnail,
          price: save.video.price || 0,
          duration: save.video.duration || 0,
          views: save.video.views || 0,
          creator: save.video.creator || { name: 'Inconnu', phone: '' },
          type: 'movie',
          addedAt: save.createdAt,
          addedVia: 'save' as const
        })
      }
    }

    // Formater les ACHATS
    const purchasedItems = purchases
      .filter((p: any) => p.video)
      .map((purchase: any) => ({
        id: purchase.video.seriesId || purchase.video.id,
        title: purchase.video.series?.title || purchase.video.title,
        description: purchase.video.description || '',
        coverImage: purchase.video.series?.coverImage || purchase.video.thumbnail,
        price: purchase.amount || 0,
        duration: purchase.video.duration || 0,
        views: purchase.video.views || 0,
        creator: purchase.video.creator || { name: 'Inconnu', phone: '' },
        type: purchase.video.seriesId ? 'series' : 'movie',
        addedAt: purchase.createdAt,
        addedVia: 'purchase' as const
      }))

    // Fusionner
    const allItems = [...likedItems, ...savedItems, ...purchasedItems]
    const uniqueItems = Array.from(
      new Map(allItems.map(item => [`${item.id}-${item.type}-${item.addedVia}`, item])).values()
    )
    uniqueItems.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())

    return res.status(200).json({
      items: uniqueItems,
      stats: {
        likes: likedItems.length,
        saves: savedItems.length,
        purchases: purchasedItems.length,
        total: uniqueItems.length
      }
    })
  } catch (error) {
    console.error('Erreur my-list:', error)
    return res.status(200).json({
      items: [],
      stats: { likes: 0, saves: 0, purchases: 0, total: 0 }
    })
  }
}