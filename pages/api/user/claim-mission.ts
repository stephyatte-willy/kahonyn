// /api/user/claim-mission.ts
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

  const { missionId, reward } = req.body
  const userId = (session.user as any).id

  try {
    const mission = await (prisma as any).userMission.findFirst({
      where: { userId, missionId }
    })

    if (!mission) {
      return res.status(400).json({ error: 'Mission introuvable' })
    }

    if (!mission.completed || mission.claimedAt) {
      return res.status(400).json({ error: 'Mission non disponible' })
    }

    // Marquer comme réclamée
    await (prisma as any).userMission.update({
      where: { id: mission.id },
      data: { claimedAt: new Date() }
    })

    // Ajouter les coins
    await (prisma as any).user.update({
      where: { id: userId },
      data: { coins: { increment: reward } }
    })

    // Enregistrer dans l'historique
    await (prisma as any).rewardHistory.create({
      data: {
        userId,
        type: 'mission',
        amount: reward,
        source: missionId
      }
    })

    return res.status(200).json({ success: true, reward })
  } catch (error) {
    console.error('Erreur claim-mission:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}