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
    const { plan, amount } = req.body

    if (!plan || !amount) {
      return res.status(400).json({ error: 'Données incomplètes' })
    }

    const userId = (session.user as any).id

    // Déterminer la durée
    let days = 0
    let coinsBonus = 0
    switch (plan) {
      case 'monthly':
        days = 30
        coinsBonus = 500
        break
      case 'quarterly':
        days = 90
        coinsBonus = 2000
        break
      case 'yearly':
        days = 365
        coinsBonus = 10000
        break
      default:
        return res.status(400).json({ error: 'Plan invalide' })
    }

    // CORRECTION : prisma.purchase pour la transaction
    const transaction = await (prisma as any).purchase.create({
      data: {
        userId,
        amount: parseFloat(amount),
        coinsUsed: 0,
        status: 'completed',
        paymentMethod: 'wave'
      }
    })

    // CORRECTION : prisma.subscription (singulier)
    const existingSubscription = await (prisma as any).subscription.findFirst({
      where: {
        userId,
        status: 'active'
      }
    })

    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days)

    if (existingSubscription) {
      // Prolonger
      await (prisma as any).subscription.update({
        where: { id: existingSubscription.id },
        data: {
          endDate,
          plan,
          amount: parseFloat(amount)
        }
      })
    } else {
      // Créer
      await (prisma as any).subscription.create({
        data: {
          userId,
          plan,
          status: 'active',
          amount: parseFloat(amount),
          startDate,
          endDate,
          autoRenew: true
        }
      })
    }

    // Ajouter les coins bonus
    await (prisma as any).user.update({
      where: { id: userId },
      data: { coins: { increment: coinsBonus } }
    })

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const successUrl = `${baseUrl}/payment/success?transactionId=${transaction.id}&type=subscription`

    return res.status(200).json({
      success: true,
      paymentUrl: successUrl,
      transactionId: transaction.id,
      isSimulation: true
    })
  } catch (error) {
    console.error('Erreur création abonnement:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}