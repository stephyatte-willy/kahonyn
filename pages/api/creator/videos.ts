// pages/api/creator/videos.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Non authentifié' })

  const userId = (session.user as any).id
  const userRole = (session.user as any).role

  if (userRole !== 'creator' && userRole !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (req.method === 'GET') {
    try {
      // Récupérer les séries du créateur
      const seriesList = await (prisma as any).series.findMany({
        where: { creatorId: userId },
        orderBy: { createdAt: 'desc' },
        include: {
          episodes: {
            orderBy: { createdAt: 'asc' }
          }
        }
      })

      // Récupérer les vidéos simples (pas de seriesId)
      const videos = await (prisma as any).video.findMany({
        where: {
          creatorId: userId,
          seriesId: null,
          status: { not: 'archived' } // Exclure les masters archivés
        },
        orderBy: { createdAt: 'desc' },
      })

      // Formater les séries
      const formattedSeries = seriesList.map((s: any) => ({
        id: s.id,
        title: s.title,
        seriesTitle: s.title,
        description: s.description,
        thumbnail: s.coverImage,
        status: s.status,
        category: s.category,
        createdAt: s.createdAt,
        isSeriesMaster: true,
        totalEpisodes: s.totalEpisodes || s.episodes?.length || 0,
        episodes: (s.episodes || []).map((ep: any) => ({
          id: ep.id,
          title: ep.title,
          episodeNumber: ep.episodeNumber || 1,
          duration: ep.duration,
          price: ep.price,
          url: ep.url,
          thumbnail: ep.thumbnail,
          views: ep.views,
          purchases: ep.purchasesCount || 0,
          status: ep.status,
        }))
      }))

      // Fusionner
      const allContent = [...formattedSeries, ...videos]

      return res.status(200).json(Array.isArray(allContent) ? allContent : [])
    } catch (error) {
      console.error('Erreur creator videos:', error)
      return res.status(200).json([])
    }
  }

  // POST - Demande de suppression
  if (req.method === 'POST') {
    try {
      const { videoId } = req.body
      if (!videoId) return res.status(400).json({ error: 'ID requis' })

      await (prisma as any).video.update({
        where: { id: videoId },
        data: { deletionRequested: true }
      })

      return res.status(200).json({ success: true })
    } catch (error) {
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}