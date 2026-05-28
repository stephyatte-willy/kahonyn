import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  try {
    const { packId, amount, coins } = req.body

    if (!packId || !amount || !coins) {
      return res.status(400).json({ error: 'Données incomplètes' })
    }

    // Créer la transaction en base
    const transaction = await prisma.coinTransactions.create({
      data: {
        userId: session.user.id,
        packId,
        amount: coins,
        price: amount,
        status: 'pending',
        paymentMethod: 'wave'
      }
    })

    // Générer l'URL de paiement Wave (simulation pour test)
    // En production, remplacer par l'API réelle Wave
    const paymentUrl = `https://wave.com/pay?amount=${amount}&currency=XOF&reference=${transaction.id}`

    await prisma.coinTransactions.update({
      where: { id: transaction.id },
      data: { paymentUrl }
    })

    return res.status(200).json({
      success: true,
      paymentUrl,
      transactionId: transaction.id
    })
  } catch (error) {
    console.error('Erreur création paiement:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}