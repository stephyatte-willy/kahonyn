// /api/user/claim-daily-reward.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

const REWARDS = [10, 20, 30, 50, 70, 100, 200]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const { day, coins } = req.body
  const userId = (session.user as any).id

  try {
    // ✅ 1. Vérifier si déjà réclamé aujourd'hui
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const alreadyClaimedToday = await (prisma as any).dailyReward.findFirst({
      where: {
        userId,
        claimedAt: { gte: today }
      }
    })

    if (alreadyClaimedToday) {
      return res.status(400).json({ error: 'Vous avez déjà réclamé votre récompense aujourd\'hui. Revenez demain !' })
    }

    // ✅ 2. Vérifier que le jour demandé est bien le prochain
    const claimedDays = await (prisma as any).dailyReward.findMany({
      where: { userId },
      orderBy: { day: 'asc' }
    })

    const nextDay = claimedDays.length + 1
    
    if (day !== nextDay) {
      return res.status(400).json({ error: `Vous devez d'abord réclamer le jour ${nextDay}` })
    }

    // ✅ 3. Créer la récompense
    await (prisma as any).dailyReward.create({
      data: {
        userId,
        day,
        coins,
        claimedAt: new Date()
      }
    })

    // ✅ 4. Ajouter les coins à l'utilisateur
    await (prisma as any).user.update({
      where: { id: userId },
      data: { coins: { increment: coins } }
    })

    // ✅ 5. Mettre à jour le streak
    const newStreak = day
    const streak = await (prisma as any).userStreak.findUnique({ where: { userId } })
    
    await (prisma as any).userStreak.upsert({
      where: { userId },
      update: {
        currentStreak: newStreak,
        longestStreak: Math.max(streak?.longestStreak || 0, newStreak),
        lastClaimDate: new Date()
      },
      create: {
        userId,
        currentStreak: newStreak,
        longestStreak: newStreak,
        lastClaimDate: new Date()
      }
    })

    // ✅ 6. Enregistrer dans l'historique
    await (prisma as any).rewardHistory.create({
      data: {
        userId,
        type: 'daily',
        amount: coins,
        source: `day_${day}`
      }
    })

    return res.status(200).json({ 
      success: true, 
      coins, 
      newStreak,
      message: `Jour ${day} réclamé ! +${coins} coins`
    })
  } catch (error) {
    console.error('Erreur claim-daily-reward:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}