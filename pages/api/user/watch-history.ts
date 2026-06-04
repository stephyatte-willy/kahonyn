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

  // GET - Récupérer tout l'historique
  if (req.method === 'GET') {
    try {
      const { videoId, seriesId } = req.query

      let where: any = { userId }

      // Si on cherche une vidéo spécifique
      if (videoId) {
        where.videoId = videoId as string
      }

      // Si on cherche les épisodes d'une série
      if (seriesId) {
        where.seriesId = seriesId as string
      }

      const history = await (prisma as any).watchHistory.findMany({
        where,
        orderBy: { watchedAt: 'desc' },
        include: {
          video: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              duration: true,
              seriesId: true,
            }
          }
        }
      })

      return res.status(200).json(history)
    } catch (error) {
      console.error('Erreur watch-history:', error)
      return res.status(200).json([])
    }
  }

  // DELETE - Supprimer un élément de l'historique
  if (req.method === 'DELETE') {
    try {
      const { videoId } = req.body

      if (!videoId) {
        return res.status(400).json({ error: 'ID vidéo requis' })
      }

      await (prisma as any).watchHistory.deleteMany({
        where: { userId, videoId }
      })

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Erreur suppression historique:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}