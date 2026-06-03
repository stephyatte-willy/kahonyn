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
    const { episodeId } = req.body
    const userId = (session.user as any).id

    if (!episodeId) {
      return res.status(400).json({ error: 'ID épisode requis' })
    }

    // CORRECTION : prisma.video (singulier)
    const episode = await (prisma as any).video.findUnique({
      where: { id: episodeId }
    })

    if (!episode) {
      return res.status(404).json({ error: 'Épisode non trouvé' })
    }

    // CORRECTION : prisma.purchase (singulier)
    const existingPurchase = await (prisma as any).purchase.findFirst({
      where: {
        userId,
        videoId: episodeId,
        status: 'completed'
      }
    })

    if (existingPurchase) {
      return res.status(400).json({ error: 'Déjà acheté' })
    }

    // CORRECTION : prisma.user (singulier)
    const user = await (prisma as any).user.findUnique({
      where: { id: userId }
    })

    if (!user || (user.coins || 0) < (episode.price || 0)) {
      return res.status(400).json({ error: 'Solde insuffisant' })
    }

    // Déduire les coins
    // CORRECTION : prisma.user (singulier)
    await (prisma as any).user.update({
      where: { id: userId },
      data: { coins: { decrement: episode.price || 0 } }
    })

    // Créer l'achat
    // CORRECTION : prisma.purchase (singulier)
    const purchase = await (prisma as any).purchase.create({
      data: {
        userId,
        videoId: episodeId,
        amount: episode.price || 0,
        coinsUsed: episode.price || 0,
        status: 'completed',
        paymentMethod: 'coins'
      }
    })

    // Incrémenter les achats de l'épisode
    // CORRECTION : prisma.video (singulier)
    await (prisma as any).video.update({
      where: { id: episodeId },
      data: { purchasesCount: { increment: 1 } }
    })

    return res.status(200).json({ success: true, purchase })
  } catch (error) {
    console.error('Erreur purchase-episode:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}