import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { episodeId, type, itemId } = req.body
    const targetId = itemId || episodeId

    if (!targetId || !type) {
      return res.status(400).json({ error: 'Paramètres manquants' })
    }

    const userId = (session.user as any).id

    // Trouver tous les IDs liés
    let targetIds: string[] = [targetId]
    
    // 1. Essayer de trouver comme vidéo
    const video = await (prisma as any).video.findUnique({
      where: { id: targetId },
      select: { id: true, seriesId: true }
    })

    if (video?.seriesId) {
      // C'est un épisode : récupérer tous les épisodes de la série
      const episodes = await (prisma as any).video.findMany({
        where: { seriesId: video.seriesId },
        select: { id: true }
      })
      targetIds = episodes.map((ep: any) => ep.id)
    } else if (!video) {
      // 2. Ce n'est pas une vidéo, c'est peut-être une série directement
      const series = await (prisma as any).series.findUnique({
        where: { id: targetId },
        select: { id: true }
      })

      if (series) {
        // C'est une série : récupérer tous ses épisodes
        const episodes = await (prisma as any).video.findMany({
          where: { seriesId: targetId },
          select: { id: true }
        })
        targetIds = episodes.map((ep: any) => ep.id)
      }
    }

    if (targetIds.length === 0) {
      return res.status(400).json({ error: 'Aucun contenu trouvé' })
    }

    // Supprimer selon le type
    if (type === 'like') {
      await (prisma as any).like.deleteMany({
        where: { 
          userId, 
          videoId: { in: targetIds },
          seriesId: null // Likes
        }
      })
    } else if (type === 'save') {
      await (prisma as any).like.deleteMany({
        where: { 
          userId, 
          videoId: { in: targetIds },
          seriesId: { not: null } // Saves
        }
      })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Erreur remove-from-list:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}