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
    const { episodeId, type } = req.body

    if (!episodeId || !type) {
      return res.status(400).json({ error: 'Paramètres manquants' })
    }

    if (type === 'like') {
      await prisma.userLikes.delete({
        where: {
          userId_episodeId: {
            userId: session.user.id,
            episodeId: episodeId
          }
        }
      })
    } else if (type === 'save') {
      await prisma.userSaves.delete({
        where: {
          userId_episodeId: {
            userId: session.user.id,
            episodeId: episodeId
          }
        }
      })
    } else {
      return res.status(400).json({ error: 'Type non supporté' })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Erreur remove-from-list:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}