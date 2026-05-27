import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { videoId } = req.body

    if (!videoId) {
      return res.status(400).json({ error: 'Video ID requis' })
    }

    // Utiliser "purchases" (pluriel)
    const existingPurchase = await prisma.purchases.findUnique({
      where: {
        userId_videoId: {
          userId: session.user.id,
          videoId: videoId
        }
      }
    })

    if (existingPurchase) {
      return res.status(400).json({ error: 'Déjà acheté' })
    }

    // Utiliser "videos" (pluriel)
    const video = await prisma.videos.findUnique({
      where: { id: videoId }
    })

    if (!video) {
      return res.status(404).json({ error: 'Vidéo non trouvée' })
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    if (user.coins < video.price) {
      return res.status(400).json({ error: 'Solde insuffisant' })
    }

    await prisma.users.update({
      where: { id: session.user.id },
      data: { coins: { decrement: video.price } }
    })

    // Utiliser "purchases" (pluriel)
    const purchase = await prisma.purchases.create({
      data: {
        userId: session.user.id,
        videoId: videoId,
        amount: video.price,
        status: 'completed'
      }
    })

    // Utiliser "creator_earnings" (pluriel)
    await prisma.creator_earnings.create({
      data: {
        creatorId: video.creatorId,
        videoId: videoId,
        amount: Math.floor(video.price * 0.7)
      }
    })

    await prisma.videos.update({
      where: { id: videoId },
      data: { purchases: { increment: 1 } }
    })

    return res.status(200).json({ success: true, purchase })
  } catch (error) {
    console.error('Erreur achat:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}