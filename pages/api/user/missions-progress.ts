// /api/user/missions-progress.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

// Configuration des missions
const MISSIONS_CONFIG = [
  { id: 'watch_ad', target: 1, reward: 10, resetType: 'daily' },
  { id: 'watch_3_ads', target: 3, reward: 50, resetType: 'daily' },
  { id: 'share_app', target: 1, reward: 20, resetType: 'daily' },
  { id: 'watch_episode', target: 5, reward: 100, resetType: 'weekly' }
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  const userId = (session.user as any).id

  if (req.method === 'GET') {
    try {
      // Récupérer les missions de l'utilisateur
      let userMissions = await (prisma as any).userMission.findMany({
        where: { userId }
      })

      const missionsData: Record<string, { progress: number; completed: boolean }> = {}

      // Si pas de missions, créer les missions par défaut
      if (!userMissions || userMissions.length === 0) {
        for (const config of MISSIONS_CONFIG) {
          const resetAt = new Date()
          if (config.resetType === 'daily') {
            resetAt.setDate(resetAt.getDate() + 1)
            resetAt.setHours(0, 0, 0, 0)
          } else {
            resetAt.setDate(resetAt.getDate() + 7)
          }

          const mission = await (prisma as any).userMission.create({
            data: {
              userId,
              missionId: config.id,
              target: config.target,
              progress: 0,
              completed: false,
              resetAt
            }
          })
          missionsData[config.id] = { progress: 0, completed: false }
        }
      } else {
        // Vérifier les reset
        const now = new Date()
        for (const mission of userMissions) {
          if (mission.resetAt && new Date(mission.resetAt) <= now) {
            // Reset la mission
            await (prisma as any).userMission.update({
              where: { id: mission.id },
              data: {
                progress: 0,
                completed: false,
                claimedAt: null,
                resetAt: getNextResetDate(mission.missionId)
              }
            })
            missionsData[mission.missionId] = { progress: 0, completed: false }
          } else {
            missionsData[mission.missionId] = {
              progress: mission.progress || 0,
              completed: mission.completed || false
            }
          }
        }
      }

      return res.status(200).json(missionsData)
    } catch (error) {
      console.error('Erreur missions-progress:', error)
      return res.status(200).json({})
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}

function getNextResetDate(missionId: string): Date {
  const resetAt = new Date()
  const config = MISSIONS_CONFIG.find(m => m.id === missionId)
  if (config?.resetType === 'daily') {
    resetAt.setDate(resetAt.getDate() + 1)
    resetAt.setHours(0, 0, 0, 0)
  } else {
    resetAt.setDate(resetAt.getDate() + 7)
  }
  return resetAt
}