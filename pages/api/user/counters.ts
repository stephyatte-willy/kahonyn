import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { episodeId } = req.query
    const session = await getServerSession(req, res, authOptions)

    if (!episodeId || typeof episodeId !== 'string') {
      return res.status(400).json({ error: 'ID épisode requis' })
    }

    // Compter les likes
    const likesCount = await prisma.userLikes.count({
      where: { episodeId }
    })

    // Compter les saves
    const savesCount = await prisma.userSaves.count({
      where: { episodeId }
    })

    let userLiked = false
    let userSaved = false

    if (session) {
      const like = await prisma.userLikes.findUnique({
        where: {
          userId_episodeId: {
            userId: session.user.id,
            episodeId: episodeId
          }
        }
      })
      userLiked = !!like

      const save = await prisma.userSaves.findUnique({
        where: {
          userId_episodeId: {
            userId: session.user.id,
            episodeId: episodeId
          }
        }
      })
      userSaved = !!save
    }

    return res.status(200).json({
      likesCount,
      savesCount,
      userLiked,
      userSaved
    })
  } catch (error) {
    console.error('Erreur counters:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}