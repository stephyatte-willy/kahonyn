import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
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
    const { packId } = req.body

    if (!packId) {
      return res.status(400).json({ error: 'Pack ID requis' })
    }

    const userId = (session.user as any).id

    // CORRECTION : prisma.coinPack (singulier, nom exact du modèle)
    const pack = await (prisma as any).coinPack.findUnique({
      where: { id: packId }
    })

    if (!pack) {
      return res.status(404).json({ error: 'Pack non trouvé' })
    }

    const totalCoins = pack.coins + (pack.bonus || 0)

    // CORRECTION : prisma.purchase pour la transaction (pas de table coinTransactions)
    const transaction = await (prisma as any).purchase.create({
      data: {
        userId,
        amount: pack.price,
        coinsUsed: totalCoins,
        status: 'completed', // Directement complété (simulation)
        paymentMethod: 'orange_money'
      }
    })

    // CORRECTION : prisma.user (singulier)
    await (prisma as any).user.update({
      where: { id: userId },
      data: { coins: { increment: totalCoins } }
    })

    return res.status(200).json({
      success: true,
      coins: totalCoins,
      message: `${totalCoins} coins ajoutés à votre compte`,
      transactionId: transaction.id
    })
  } catch (error) {
    console.error('Erreur buy-coins:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}