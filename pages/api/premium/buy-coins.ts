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

    const pack = await prisma.coinPacks.findUnique({
      where: { id: packId }
    })

    if (!pack) {
      return res.status(404).json({ error: 'Pack non trouvé' })
    }

    const totalCoins = pack.coins + pack.bonus

    // Créer la transaction
    const transaction = await prisma.coinTransactions.create({
      data: {
        userId: session.user.id,
        packId: pack.id,
        amount: totalCoins,
        price: pack.price,
        status: 'pending'
      }
    })

    // Simuler le paiement Orange Money (à remplacer par vraie intégration)
    // Ici on valide automatiquement pour le développement
    await prisma.coinTransactions.update({
      where: { id: transaction.id },
      data: { status: 'completed', transactionId: `TXN_${Date.now()}` }
    })

    // Ajouter les coins à l'utilisateur
    await prisma.users.update({
      where: { id: session.user.id },
      data: { coins: { increment: totalCoins } }
    })

    return res.status(200).json({
      success: true,
      coins: totalCoins,
      message: `${totalCoins} coins ajoutés à votre compte`
    })
  } catch (error) {
    console.error('Erreur buy-coins:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}