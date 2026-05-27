import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  const admin = await prisma.users.findUnique({
    where: { id: session.user.id }
  })

  if (admin?.role !== 'admin') {
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

    const masterVideo = await prisma.videos.findUnique({
      where: { id: videoId }
    })

    if (!masterVideo) {
      return res.status(404).json({ error: 'Vidéo non trouvée' })
    }

    // Marquer la vidéo master comme série (garder approved)
await prisma.videos.update({
  where: { id: videoId },
  data: {
    isSeries: true,
    status: 'approved',  // ← approved, pas archived
    updatedAt: new Date()
  }
})

    const totalDuration = masterVideo.duration || 0
    const totalEpisodes = Math.ceil(totalDuration / episodeDuration)
    const episodesCreated = []

    for (let i = 0; i < totalEpisodes; i++) {
      const startTime = i * episodeDuration
      const duration = Math.min(episodeDuration, totalDuration - startTime)
      
      // Construction de l'URL Cloudinary avec découpage réel
      // Format: https://res.cloudinary.com/.../upload/so_0,du_30/video.mp4
      let cutUrl = masterVideo.url
      if (cutUrl.includes('/upload/')) {
        cutUrl = cutUrl.replace('/upload/', `/upload/so_${startTime},du_${duration}/`)
      }

      const episode = await prisma.videos.create({
        data: {
          title: `${masterVideo.title} - Épisode ${i + 1}`,
          description: masterVideo.description,
          url: cutUrl,
          thumbnail: masterVideo.thumbnail,
          duration: duration,
          price: pricePerEpisode,
          status: 'approved',
          isSeries: false,
          parentId: masterVideo.id,
          episodeNumber: i + 1,
          startTime: startTime,
          endTime: startTime + duration,
          creatorId: masterVideo.creatorId,
          category: masterVideo.category,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      episodesCreated.push(episode)
    }

    return res.status(200).json({
      success: true,
      message: `Film découpé en ${totalEpisodes} épisodes de ${episodeDuration}s`,
      totalEpisodes,
      episodes: episodesCreated
    })
  } catch (error) {
    console.error('Erreur split-video:', error)
    return res.status(500).json({ error: 'Erreur lors du découpage' })
  }
}