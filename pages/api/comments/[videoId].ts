import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { videoId } = req.query

  if (!videoId || typeof videoId !== 'string') {
    return res.status(400).json({ error: 'ID vidéo requis' })
  }

  // GET - Récupérer les commentaires
  if (req.method === 'GET') {
    try {
      const comments = await (prisma as any).comment.findMany({
        where: { videoId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          user: {
            select: { id: true, name: true, phone: true, avatar: true }
          }
        }
      })

      return res.status(200).json(comments)
    } catch (error) {
      console.error('Erreur GET comments:', error)
      return res.status(200).json([])
    }
  }

  // POST - Ajouter un commentaire
  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    try {
      const { content } = req.body

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Commentaire vide' })
      }

      if (content.length > 500) {
        return res.status(400).json({ error: 'Maximum 500 caractères' })
      }

      const userId = (session.user as any).id

      const comment = await (prisma as any).comment.create({
        data: {
          content: content.trim(),
          userId,
          videoId
        },
        include: {
          user: {
            select: { id: true, name: true, phone: true, avatar: true }
          }
        }
      })

      return res.status(201).json(comment)
    } catch (error) {
      console.error('Erreur POST comment:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}