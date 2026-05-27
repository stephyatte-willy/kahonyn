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
    const { episodeId } = req.body

    if (!episodeId) {
      return res.status(400).json({ error: 'ID épisode requis' })
    }

    const existingLike = await prisma.userLikes.findUnique({
      where: {
        userId_episodeId: {
          userId: session.user.id,
          episodeId: episodeId
        }
      }
    })

    if (existingLike) {
      await prisma.userLikes.delete({
        where: {
          userId_episodeId: {
            userId: session.user.id,
            episodeId: episodeId
          }
        }
      })
    } else {
      await prisma.userLikes.create({
        data: {
          userId: session.user.id,
          episodeId: episodeId
        }
      })
    }

    const likesCount = await prisma.userLikes.count({
      where: { episodeId }
    })

    return res.status(200).json({
      liked: !existingLike,
      likesCount
    })
  } catch (error) {
    console.error('Erreur like:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}