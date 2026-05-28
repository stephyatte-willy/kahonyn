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

    // Déterminer la durée en jours et le bonus
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

    // Créer la transaction d'abonnement
    const transaction = await prisma.subscriptionTransactions.create({
      data: {
        userId: session.user.id,
        plan,
        amount,
        status: 'pending',
        paymentMethod: 'wave'
      }
    })

    // SIMULATION : Marquer la transaction comme complétée directement
    // En production, remplacer par un appel réel à l'API Wave
    await prisma.subscriptionTransactions.update({
      where: { id: transaction.id },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    })

    // Vérifier si l'utilisateur a déjà un abonnement actif
    const existingSubscription = await prisma.subscriptions.findFirst({
      where: {
        userId: session.user.id,
        status: 'active'
      }
    })

    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days)

    if (existingSubscription) {
      // Prolonger l'abonnement existant
      await prisma.subscriptions.update({
        where: { id: existingSubscription.id },
        data: {
          endDate,
          updatedAt: new Date()
        }
      })
    } else {
      // Créer un nouvel abonnement
      await prisma.subscriptions.create({
        data: {
          userId: session.user.id,
          plan,
          status: 'active',
          startDate,
          endDate,
          autoRenew: true
        }
      })
    }

    // Ajouter les coins bonus
    await prisma.users.update({
      where: { id: session.user.id },
      data: { coins: { increment: coinsBonus } }
    })

    // Simuler une URL de redirection (page de succès)
    const successUrl = `${process.env.NEXTAUTH_URL}/payment/success?transactionId=${transaction.id}&type=subscription`

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