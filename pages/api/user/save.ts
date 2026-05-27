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

    const existingSave = await prisma.userSaves.findUnique({
      where: {
        userId_episodeId: {
          userId: session.user.id,
          episodeId: episodeId
        }
      }
    })

    if (existingSave) {
      await prisma.userSaves.delete({
        where: {
          userId_episodeId: {
            userId: session.user.id,
            episodeId: episodeId
          }
        }
      })
    } else {
      await prisma.userSaves.create({
        data: {
          userId: session.user.id,
          episodeId: episodeId
        }
      })
    }

    const savesCount = await prisma.userSaves.count({
      where: { episodeId }
    })

    return res.status(200).json({
      saved: !existingSave,
      savesCount
    })
  } catch (error) {
    console.error('Erreur save:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}