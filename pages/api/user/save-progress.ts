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
    const { episodeId, currentTime } = req.body

    if (!episodeId) {
      return res.status(400).json({ error: 'ID épisode requis' })
    }

    await prisma.userProgress.upsert({
      where: {
        userId_episodeId: {
          userId: session.user.id,
          episodeId: episodeId
        }
      },
      update: { currentTime: currentTime || 0 },
      create: {
        userId: session.user.id,
        episodeId: episodeId,
        currentTime: currentTime || 0
      }
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Erreur save-progress:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}