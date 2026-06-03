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
    const userId = (session.user as any).id

    if (!videoId) {
      return res.status(400).json({ error: 'Video ID requis' })
    }

    // CORRECTION : prisma.purchase (singulier)
    const existingPurchase = await (prisma as any).purchase.findFirst({
      where: {
        userId,
        videoId,
        status: 'completed'
      }
    })

    if (existingPurchase) {
      return res.status(400).json({ error: 'Déjà acheté' })
    }

    // CORRECTION : prisma.video (singulier)
    const video = await (prisma as any).video.findUnique({
      where: { id: videoId }
    })

    if (!video) {
      return res.status(404).json({ error: 'Vidéo non trouvée' })
    }

    // CORRECTION : prisma.user (singulier)
    const user = await (prisma as any).user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    if ((user.coins || 0) < (video.price || 0)) {
      return res.status(400).json({ error: 'Solde insuffisant' })
    }

    // Débiter les coins
    // CORRECTION : prisma.user (singulier)
    await (prisma as any).user.update({
      where: { id: userId },
      data: { coins: { decrement: video.price || 0 } }
    })

    // Créer l'achat
    // CORRECTION : prisma.purchase (singulier)
    const purchase = await (prisma as any).purchase.create({
      data: {
        userId,
        videoId,
        amount: video.price || 0,
        coinsUsed: video.price || 0,
        status: 'completed',
        paymentMethod: 'coins'
      }
    })

    // Incrémenter le compteur d'achats de la vidéo
    // CORRECTION : prisma.video (singulier)
    await (prisma as any).video.update({
      where: { id: videoId },
      data: { purchasesCount: { increment: 1 } }
    })

    return res.status(200).json({ success: true, purchase })
  } catch (error) {
    console.error('Erreur achat:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}