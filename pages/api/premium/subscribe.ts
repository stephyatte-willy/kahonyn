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
    const { plan } = req.body

    const plans = {
      monthly: { price: 5000, days: 30, coinsBonus: 500 },
      quarterly: { price: 13500, days: 90, coinsBonus: 2000 },
      yearly: { price: 48000, days: 365, coinsBonus: 10000 }
    }

    const selectedPlan = plans[plan as keyof typeof plans]
    if (!selectedPlan) {
      return res.status(400).json({ error: 'Plan invalide' })
    }

    // Vérifier si déjà abonné
    const existingSubscription = await prisma.subscriptions.findFirst({
      where: {
        userId: session.user.id,
        status: 'active',
        endDate: { gt: new Date() }
      }
    })

    if (existingSubscription) {
      return res.status(400).json({ error: 'Vous avez déjà un abonnement actif' })
    }

    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + selectedPlan.days)

    // Créer l'abonnement
    const subscription = await prisma.subscriptions.create({
      data: {
        userId: session.user.id,
        plan: plan,
        startDate,
        endDate,
        autoRenew: true,
        status: 'active'
      }
    })

    // Ajouter les coins bonus
    await prisma.users.update({
      where: { id: session.user.id },
      data: { coins: { increment: selectedPlan.coinsBonus } }
    })

    // Créer une transaction pour les coins bonus
    await prisma.coinTransactions.create({
      data: {
        userId: session.user.id,
        amount: selectedPlan.coinsBonus,
        price: 0,
        status: 'completed',
        transactionId: `SUB_${subscription.id}`
      }
    })

    return res.status(200).json({
      success: true,
      subscription,
      coinsBonus: selectedPlan.coinsBonus,
      message: `Abonnement ${plan} activé avec succès ! ${selectedPlan.coinsBonus} coins offerts.`
    })
  } catch (error) {
    console.error('Erreur subscribe:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}