import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '../../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const video = await (prisma as any).video.findUnique({
      where: { id: id as string },
      include: {
        creator: { select: { name: true, phone: true } }
      }
    })

    if (!video) {
      return res.status(404).json({ error: 'Vidéo non trouvée' })
    }

    const session = await getServerSession(req, res, authOptions)
    const userId = session ? (session.user as any).id : null
    const userRole = session ? (session.user as any).role : null

    // Admin et créateur : accès illimité
    if (userRole === 'admin' || (userId && video.creatorId === userId)) {
      await (prisma as any).video.update({
        where: { id: id as string },
        data: { views: { increment: 1 } }
      })
      return res.status(200).json({ ...video, views: video.views + 1, canWatch: true, isOwner: true })
    }

    // Vidéo déjà achetée
    if (userId) {
      const existingPurchase = await (prisma as any).purchase.findFirst({
        where: { userId, videoId: id as string, status: 'completed' }
      })
      if (existingPurchase) {
        await (prisma as any).video.update({
          where: { id: id as string },
          data: { views: { increment: 1 } }
        })
        return res.status(200).json({ ...video, views: video.views + 1, canWatch: true, isPurchased: true })
      }
    }

    // === FILM : 20% GRATUIT ===
    const freeDuration = Math.floor((video.duration || 0) * 0.2) // 20% de la durée totale
    const isFree = video.price === 0 || freeDuration > 0

    await (prisma as any).video.update({
      where: { id: id as string },
      data: { views: { increment: 1 } }
    })

    return res.status(200).json({
      ...video,
      views: video.views + 1,
      canWatch: true,
      isFreePreview: true,
      freeDuration: freeDuration, // secondes gratuites
      totalDuration: video.duration,
      requirePurchase: video.price > 0,
      userCoins: userId ? (await (prisma as any).user.findUnique({ where: { id: userId }, select: { coins: true } }))?.coins || 0 : 0,
      requiredCoins: video.price || 0,
      message: video.price > 0 
        ? `🎬 Aperçu gratuit de ${Math.floor(freeDuration / 60)}min. Achetez pour voir en entier (${video.price} coins).`
        : 'Vidéo gratuite'
    })

  } catch (error) {
    console.error('Erreur:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}