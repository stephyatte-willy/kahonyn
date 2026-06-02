// pages/api/user/my-list.ts
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

    // 1. Récupérer les likes
    const likes = await (prisma as any).like.findMany({
      where: { userId },
      include: {
        video: {
          include: {
            creator: { select: { name: true, phone: true } }
          }
        },
        series: {
          include: {
            creator: { select: { name: true, phone: true } }
          }
        }
      }
    })

    // 2. Récupérer les achats
    const purchases = await (prisma as any).purchase.findMany({
      where: { userId, status: 'completed' },
      include: {
        video: {
          include: {
            creator: { select: { name: true, phone: true } }
          }
        },
        series: {
          include: {
            creator: { select: { name: true, phone: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Formater les likes
    const likedItems = likes
      .filter((l: any) => l.video || l.series)
      .map((like: any) => {
        const item = like.video || like.series
        return {
          id: item.id,
          title: item.title,
          description: item.description || '',
          coverImage: like.video ? item.thumbnail : item.coverImage,
          price: item.price || 0,
          duration: item.duration || 0,
          views: item.views || item.totalViews || 0,
          creator: item.creator || { name: 'Inconnu', phone: '' },
          type: like.video ? (like.video.seriesId ? 'series' : 'movie') : 'series',
          addedAt: like.createdAt,
          addedVia: 'like'
        }
      })

    // Formater les achats
    const purchasedItems = purchases
      .filter((p: any) => p.video || p.series)
      .map((purchase: any) => {
        const item = purchase.video || purchase.series
        return {
          id: item.id,
          title: item.title,
          description: item.description || '',
          coverImage: purchase.video ? item.thumbnail : item.coverImage,
          price: item.price || 0,
          duration: item.duration || 0,
          views: item.views || item.totalViews || 0,
          creator: item.creator || { name: 'Inconnu', phone: '' },
          type: purchase.video ? (purchase.video.seriesId ? 'series' : 'movie') : 'series',
          addedAt: purchase.createdAt,
          addedVia: 'purchase'
        }
      })

    // Fusionner
    const allItems = [...likedItems, ...purchasedItems]
    
    // Dédoublonner par ID
    const uniqueItems = Array.from(
      new Map(allItems.map(item => [item.id, item])).values()
    )
    
    // Trier par date (plus récent en premier)
    uniqueItems.sort(
      (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    )

    return res.status(200).json({
      items: uniqueItems,
      stats: {
        likes: likedItems.length,
        saves: 0,
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