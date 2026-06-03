import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  try {
    const { episodeId } = req.body
    if (!episodeId) return res.status(400).json({ error: 'ID requis' })

    const userId = (session.user as any).id

    // === ÉTAPE 1 : Trouver la vidéo ===
    const video = await (prisma as any).video.findUnique({
      where: { id: episodeId },
      select: { id: true, seriesId: true }
    })

    if (!video) {
      return res.status(404).json({ error: 'Vidéo non trouvée' })
    }

    // === ÉTAPE 2 : Déterminer tous les IDs ===
    let targetIds: string[] = [episodeId]
    
    if (video.seriesId) {
      const episodes = await (prisma as any).video.findMany({
        where: { seriesId: video.seriesId },
        select: { id: true }
      })
      targetIds = episodes.map((ep: any) => ep.id)
    }

    // === ÉTAPE 3 : Vérifier si déjà liké (seriesId = NULL) ===
    const firstId = targetIds[0]
    const existingLike = await (prisma as any).like.findFirst({
      where: {
        userId,
        videoId: firstId,
        seriesId: null // LIKE = seriesId NULL
      }
    })

    console.log('❤️ Like - existing:', !!existingLike, 'targetIds:', targetIds.length)

    if (existingLike) {
      // === SUPPRIMER tous les likes ===
      const deleteResult = await (prisma as any).like.deleteMany({
        where: {
          userId,
          videoId: { in: targetIds },
          seriesId: null // Seulement les likes
        }
      })
      console.log('🗑️ Likes supprimés:', deleteResult.count)
    } else {
      // === CRÉER les likes ===
      let createdCount = 0
      for (const id of targetIds) {
        try {
          await (prisma as any).like.create({
            data: {
              userId,
              videoId: id,
              seriesId: null // ← NULL = LIKE
            }
          })
          createdCount++
        } catch (e: any) {
          if (e.code !== 'P2002') console.error('Erreur création like:', e)
        }
      }
      console.log('❤️ Likes créés:', createdCount)
    }

    // === ÉTAPE 4 : Vérifier le résultat ===
    const finalCheck = await (prisma as any).like.findFirst({
      where: {
        userId,
        videoId: firstId,
        seriesId: null
      }
    })

    return res.status(200).json({
      liked: !!finalCheck,
      success: true
    })
  } catch (error) {
    console.error('❌ Erreur like:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}