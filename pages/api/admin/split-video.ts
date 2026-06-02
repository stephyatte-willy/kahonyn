import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  // CORRECTION : Utiliser la session directement
  const userRole = (session.user as any)?.role
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { videoId, episodeDuration, pricePerEpisode } = req.body

    if (!videoId) {
      return res.status(400).json({ error: 'ID vidéo requis' })
    }

    // CORRECTION : prisma.video (singulier)
    const masterVideo = await (prisma as any).video.findUnique({
      where: { id: videoId }
    })

    if (!masterVideo) {
      return res.status(404).json({ error: 'Vidéo non trouvée' })
    }

    // Marquer la vidéo master comme approuvée
    await (prisma as any).video.update({
      where: { id: videoId },
      data: {
        status: 'approved',
        updatedAt: new Date()
      }
    })

    const totalDuration = masterVideo.duration || 60
    const epDuration = parseInt(episodeDuration) || 30
    const epPrice = parseInt(pricePerEpisode) || 100
    const totalEpisodes = Math.ceil(totalDuration / epDuration)
    const episodesCreated = []

    for (let i = 0; i < totalEpisodes; i++) {
      const startTime = i * epDuration
      const duration = Math.min(epDuration, totalDuration - startTime)
      
      // Construction de l'URL Cloudinary avec découpage
      let cutUrl = masterVideo.url
      if (cutUrl.includes('/upload/')) {
        cutUrl = cutUrl.replace('/upload/', `/upload/so_${startTime},du_${duration}/`)
      }

      // CORRECTION : prisma.video.create
      const episode = await (prisma as any).video.create({
        data: {
          title: `${masterVideo.title} - Épisode ${i + 1}`,
          description: masterVideo.description || '',
          url: cutUrl,
          thumbnail: masterVideo.thumbnail || null,
          duration: duration,
          price: epPrice,
          status: 'approved',
          category: masterVideo.category || 'popular',
          seriesId: masterVideo.id,
          episodeNumber: i + 1,
          creatorId: masterVideo.creatorId,
        }
      })
      episodesCreated.push(episode)
    }

    return res.status(200).json({
      success: true,
      message: `Film découpé en ${totalEpisodes} épisodes de ${epDuration}s`,
      totalEpisodes,
      episodes: episodesCreated
    })
  } catch (error) {
    console.error('Erreur split-video:', error)
    return res.status(500).json({ 
      error: 'Erreur lors du découpage',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    })
  }
}