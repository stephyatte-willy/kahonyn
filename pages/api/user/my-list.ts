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
    // 1. Récupérer les vidéos likées par l'utilisateur
    const likes = await prisma.userLikes.findMany({
      where: { userId: session.user.id },
      include: {
        episode: {
          include: {
            creator: { select: { name: true, phone: true } }
          }
        }
      }
    })

    // 2. Récupérer les vidéos sauvegardées par l'utilisateur
    const saves = await prisma.userSaves.findMany({
      where: { userId: session.user.id },
      include: {
        episode: {
          include: {
            creator: { select: { name: true, phone: true } }
          }
        }
      }
    })

    // 3. Récupérer les vidéos achetées par l'utilisateur
    const purchases = await prisma.purchases.findMany({
      where: { userId: session.user.id },
      include: {
        video: {
          include: {
            creator: { select: { name: true, phone: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Formater les données
    const likedVideos = likes.map(like => ({
      id: like.episode.id,
      title: like.episode.title,
      description: like.episode.description,
      coverImage: like.episode.thumbnail,
      price: like.episode.price,
      duration: like.episode.duration,
      views: like.episode.views,
      creator: like.episode.creator,
      type: like.episode.isSeries ? 'series' : 'movie',
      addedAt: like.createdAt,
      addedVia: 'like'
    }))

    const savedVideos = saves.map(save => ({
      id: save.episode.id,
      title: save.episode.title,
      description: save.episode.description,
      coverImage: save.episode.thumbnail,
      price: save.episode.price,
      duration: save.episode.duration,
      views: save.episode.views,
      creator: save.episode.creator,
      type: save.episode.isSeries ? 'series' : 'movie',
      addedAt: save.createdAt,
      addedVia: 'save'
    }))

    const purchasedVideos = purchases.map(purchase => ({
      id: purchase.video.id,
      title: purchase.video.title,
      description: purchase.video.description,
      coverImage: purchase.video.thumbnail,
      price: purchase.video.price,
      duration: purchase.video.duration,
      views: purchase.video.views,
      creator: purchase.video.creator,
      type: purchase.video.isSeries ? 'series' : 'movie',
      addedAt: purchase.createdAt,
      addedVia: 'purchase'
    }))

    // Fusionner et dédoublonner par ID
    const allItems = [...likedVideos, ...savedVideos, ...purchasedVideos]
    const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values())
    
    // Trier par date d'ajout (plus récent en premier)
    uniqueItems.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())

    return res.status(200).json({
      items: uniqueItems,
      stats: {
        likes: likes.length,
        saves: saves.length,
        purchases: purchases.length,
        total: uniqueItems.length
      }
    })
  } catch (error) {
    console.error('Erreur my-list:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}