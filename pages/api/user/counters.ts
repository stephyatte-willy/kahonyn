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

    let userLiked = false
    let userSaved = false

    if (session) {
      const userId = (session.user as any).id
      
      const video = await (prisma as any).video.findUnique({
        where: { id: episodeId },
        select: { id: true, seriesId: true }
      })

      let targetIds: string[] = [episodeId]
      let saveMarker: string | null = episodeId // Pour les films, le marqueur est l'ID

      if (video?.seriesId) {
        // Série
        saveMarker = video.seriesId
        const episodes = await (prisma as any).video.findMany({
          where: { seriesId: video.seriesId },
          select: { id: true }
        })
        targetIds = episodes.map((ep: any) => ep.id)
      }

      // Vérifier LIKE (seriesId = null)
      const like = await (prisma as any).like.findFirst({
        where: { 
          userId, 
          videoId: { in: targetIds },
          seriesId: null
        },
        select: { id: true }
      })
      userLiked = !!like

      // Vérifier SAVE (seriesId = saveMarker, non null)
      const save = await (prisma as any).like.findFirst({
        where: { 
          userId, 
          videoId: { in: targetIds },
          seriesId: saveMarker
        },
        select: { id: true }
      })
      userSaved = !!save
    }

    return res.status(200).json({ userLiked, userSaved })
  } catch (error) {
    console.error('Erreur counters:', error)
    return res.status(200).json({ userLiked: false, userSaved: false })
  }
}