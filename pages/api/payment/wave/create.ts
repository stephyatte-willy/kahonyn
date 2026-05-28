import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

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

    // Récupérer l'URL de base (fonctionne localhost et Vercel)
    const baseUrl = process.env.NEXTAUTH_URL || 'https://kahonyn.vercel.app'
    
    // Simuler un paiement réussi
    await prisma.coinTransactions.update({
      where: { id: transaction.id },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    })

    // Ajouter les coins à l'utilisateur
    await prisma.users.update({
      where: { id: session.user.id },
      data: { coins: { increment: coins } }
    })

    // Utiliser l'URL dynamique
    const successUrl = `${baseUrl}/payment/success?transactionId=${transaction.id}`

    return res.status(200).json({
      success: true,
      paymentUrl: successUrl,
      transactionId: transaction.id,
      isSimulation: true
    })
  } catch (error) {
    console.error('Erreur création paiement:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}