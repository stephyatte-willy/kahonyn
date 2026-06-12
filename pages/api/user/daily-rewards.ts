// /api/user/daily-rewards.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

// Configuration des récompenses par jour
const REWARDS = [10, 20, 30, 50, 70, 100, 200]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  const userId = (session.user as any).id

  if (req.method === 'GET') {
    try {
      // 1. Récupérer le streak de l'utilisateur
      let streak = await (prisma as any).userStreak.findUnique({
        where: { userId }
      })

      if (!streak) {
        streak = await (prisma as any).userStreak.create({
          data: { userId, currentStreak: 0, longestStreak: 0 }
        })
      }

      // 2. Récupérer les récompenses déjà réclamées aujourd'hui
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const claimedRewards = await (prisma as any).dailyReward.findMany({
        where: {
          userId,
          claimedAt: { gte: today }
        }
      })

      const claimedDays = new Set(claimedRewards.map((r: any) => r.day))

      // ✅ 3. Vérifier si l'utilisateur a déjà réclamé aujourd'hui
      const hasClaimedToday = claimedDays.size > 0
      
      // ✅ 4. Calculer le streak réel (basé sur les jours consécutifs réclamés)
      let actualStreak = 0
      for (let i = 1; i <= 7; i++) {
        const dayClaimed = claimedDays.has(i)
        if (dayClaimed) {
          actualStreak = i
        } else {
          break
        }
      }
      
      // ✅ 5. Mettre à jour le streak si différent
      if (actualStreak !== streak.currentStreak) {
        await (prisma as any).userStreak.update({
          where: { userId },
          data: { 
            currentStreak: actualStreak,
            longestStreak: Math.max(streak.longestStreak, actualStreak),
            lastClaimDate: actualStreak > 0 ? new Date() : null
          }
        })
        streak.currentStreak = actualStreak
      }

      // 6. Construire la liste des récompenses
      const rewards = []
      for (let i = 0; i < 7; i++) {
        const day = i + 1
        const isClaimed = claimedDays.has(day)
        
        // ✅ UNIQUEMENT le prochain jour non réclamé est disponible, et seulement si pas déjà réclamé aujourd'hui
        const isAvailable = !hasClaimedToday && !isClaimed && day === streak.currentStreak + 1
        
        rewards.push({
          day,
          coins: REWARDS[i],
          claimed: isClaimed,
          available: isAvailable
        })
      }

      console.log('📊 Daily rewards:', { 
        userId, 
        streak: streak.currentStreak, 
        hasClaimedToday,
        claimedDays: Array.from(claimedDays),
        rewards 
      })

      return res.status(200).json({
        rewards,
        streak: streak.currentStreak,
        hasClaimedToday,
        nextAvailableIn: hasClaimedToday ? calculateNextAvailableTime() : null
      })
    } catch (error) {
      console.error('Erreur daily-rewards:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}

function calculateNextAvailableTime() {
  const now = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  
  const hoursLeft = Math.ceil((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60))
  return hoursLeft
}