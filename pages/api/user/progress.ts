import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  const userId = (session.user as any).id

  // GET - Récupérer toutes les progressions
  if (req.method === 'GET') {
    try {
      const progress = await (prisma as any).watchHistory.findMany({
        where: { userId }
      })
      return res.status(200).json(progress)
    } catch (error) {
      console.error('Erreur GET progress:', error)
      return res.status(200).json([])
    }
  }

  // POST - Sauvegarder une progression
  if (req.method === 'POST') {
    try {
      const { episodeId, currentTime } = req.body

      if (!episodeId) {
        return res.status(400).json({ error: 'ID épisode requis' })
      }

      // Utiliser watchHistory au lieu de userProgress
      const existing = await (prisma as any).watchHistory.findFirst({
        where: { userId, videoId: episodeId }
      })

      if (existing) {
        await (prisma as any).watchHistory.update({
          where: { id: existing.id },
          data: { progress: currentTime || 0, watchedAt: new Date() }
        })
      } else {
        await (prisma as any).watchHistory.create({
          data: {
            userId,
            videoId: episodeId,
            progress: currentTime || 0,
          }
        })
      }

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Erreur POST progress:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}