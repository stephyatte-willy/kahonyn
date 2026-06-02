// pages/api/creator/videos.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  const userRole = (session.user as any)?.role
  const userId = (session.user as any)?.id

  if (userRole !== 'creator' && userRole !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (req.method === 'GET') {
    try {
      // Récupérer les vidéos du créateur
      const videos = await (prisma as any).video.findMany({
        where: {
          creatorId: userId,
          seriesId: null // Seulement les films simples, pas les épisodes de série
        },
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              phone: true,
              avatar: true
            }
          }
        }
      })

      // Toujours retourner un tableau, même vide
      return res.status(200).json(Array.isArray(videos) ? videos : [])
    } catch (error) {
      console.error('Erreur GET creator videos:', error)
      // En cas d'erreur, retourner un tableau vide
      return res.status(200).json([])
    }
  }

  // POST - Demander la suppression d'une vidéo
  if (req.method === 'POST') {
    try {
      const { videoId } = req.body

      if (!videoId) {
        return res.status(400).json({ error: 'ID de la vidéo requis' })
      }

      // Vérifier que la vidéo appartient au créateur
      const video = await (prisma as any).video.findFirst({
        where: {
          id: videoId,
          creatorId: userId
        }
      })

      if (!video) {
        return res.status(404).json({ error: 'Vidéo non trouvée ou non autorisée' })
      }

      // Marquer la vidéo pour suppression
      await (prisma as any).video.update({
        where: { id: videoId },
        data: {
          deletionRequested: true,
          willDisappearAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
        }
      })

      return res.status(200).json({
        success: true,
        message: 'Demande de suppression envoyée à l\'administration'
      })
    } catch (error) {
      console.error('Erreur demande suppression:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}