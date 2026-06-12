import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { videoId, episodeDuration, pricePerEpisode, category, categories } = req.body

    if (!videoId) {
      return res.status(400).json({ error: 'ID vidéo requis' })
    }

    const masterVideo = await (prisma as any).video.findUnique({
      where: { id: videoId }
    })

    if (!masterVideo) {
      return res.status(404).json({ error: 'Vidéo non trouvée' })
    }

    const epDuration = parseInt(episodeDuration) || 30
    const epPrice = parseInt(pricePerEpisode) || 100
    const totalDuration = masterVideo.duration || 60
    const totalEpisodes = Math.ceil(totalDuration / epDuration)

    // Gérer les catégories multiples
    const categoryString = Array.isArray(categories) 
      ? categories.join(',') 
      : category || 'popular'

    console.log('🎬 Découpage:', { videoId, totalDuration, epDuration, totalEpisodes, epPrice, category: categoryString })

    // Créer la série
    const series = await (prisma as any).series.create({
      data: {
        title: masterVideo.title,
        description: masterVideo.description || '',
        coverImage: masterVideo.thumbnail || null,
        price: epPrice,
        freeEpisodes: 1,
        totalEpisodes: totalEpisodes,
        totalViews: 0,
        status: 'approved',
        category: categoryString,
        creatorId: masterVideo.creatorId,
      }
    })

    // Créer les épisodes
    const episodesCreated = []
    for (let i = 0; i < totalEpisodes; i++) {
      const startTime = i * epDuration
      const duration = Math.min(epDuration, totalDuration - startTime)
      
      let cutUrl = masterVideo.url
      if (cutUrl.includes('/upload/')) {
        cutUrl = cutUrl.replace('/upload/', `/upload/so_${startTime},du_${duration}/`)
      }

      const episode = await (prisma as any).video.create({
        data: {
          title: `${masterVideo.title} - Épisode ${i + 1}`,
          description: masterVideo.description || '',
          url: cutUrl,
          thumbnail: masterVideo.thumbnail || null,
          duration: duration,
          price: epPrice,
          status: 'approved',
          category: categoryString,
          tags: categoryString,
          seriesId: series.id,
          creatorId: masterVideo.creatorId,
        }
      })
      episodesCreated.push(episode)
    }

    // Archiver le master
    await (prisma as any).video.update({
  where: { id: videoId },
  data: {
    status: 'archived',
    seriesId: series.id,
    title: `[MASTER] ${masterVideo.title}`,  // ← Ajouter un préfixe pour l'identifier
    updatedAt: new Date()
  }
})

    return res.status(200).json({
      success: true,
      message: `Film découpé en ${totalEpisodes} épisodes`,
      seriesId: series.id,
      totalEpisodes,
      episodes: episodesCreated
    })

  } catch (error) {
    console.error('❌ Erreur split-video:', error)
    return res.status(500).json({ 
      error: 'Erreur lors du découpage',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    })
  }
}