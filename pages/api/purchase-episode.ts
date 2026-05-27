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

    if (!episodeId) {
      return res.status(400).json({ error: 'ID épisode requis' })
    }

    // Récupérer l'épisode
    const episode = await prisma.videos.findUnique({
      where: { id: episodeId }
    })

    if (!episode) {
      return res.status(404).json({ error: 'Épisode non trouvé' })
    }

    // Vérifier si déjà acheté
    const existingPurchase = await prisma.purchases.findUnique({
      where: {
        userId_videoId: {
          userId: session.user.id,
          videoId: episodeId
        }
      }
    })

    if (existingPurchase) {
      return res.status(400).json({ error: 'Déjà acheté' })
    }

    // Vérifier les coins de l'utilisateur
    const user = await prisma.users.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.coins < episode.price) {
      return res.status(400).json({ error: 'Solde insuffisant' })
    }

    // Déduire les coins
    await prisma.users.update({
      where: { id: session.user.id },
      data: { coins: { decrement: episode.price } }
    })

    // Créer l'achat
    const purchase = await prisma.purchases.create({
      data: {
        userId: session.user.id,
        videoId: episodeId,
        amount: episode.price,
        status: 'completed'
      }
    })

    // Créer le gain du créateur (70%)
    await prisma.creator_earnings.create({
      data: {
        creatorId: episode.creatorId,
        videoId: episodeId,
        amount: Math.floor(episode.price * 0.7),
        status: 'pending'
      }
    })

    // Incrémenter les achats de l'épisode
    await prisma.videos.update({
      where: { id: episodeId },
      data: { purchases: { increment: 1 } }
    })

    return res.status(200).json({ success: true, purchase })
  } catch (error) {
    console.error('Erreur purchase-episode:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}