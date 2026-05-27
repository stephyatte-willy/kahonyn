import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) return res.status(401).json({ error: 'Non authentifié' })

  const admin = await prisma.users.findUnique({ where: { id: session.user.id } })
  if (admin?.role !== 'admin') return res.status(403).json({ error: 'Non autorisé' })

  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  try {
    const { videoId, episodeDuration, pricePerEpisode } = req.body

    const video = await prisma.videos.findUnique({ where: { id: videoId } })
    if (!video) return res.status(404).json({ error: 'Vidéo non trouvée' })

    // Marquer la vidéo comme une série
    await prisma.videos.update({
      where: { id: videoId },
      data: { isSeries: true, price: 0, status: 'approved' }  // Prix 0 car c'est un master
    })

    const totalDuration = video.duration || 0
    const totalEpisodes = Math.ceil(totalDuration / episodeDuration)

    // Créer les épisodes
    for (let i = 0; i < totalEpisodes; i++) {
      const startTime = i * episodeDuration
      const endTime = Math.min(startTime + episodeDuration, totalDuration)

      await prisma.videos.create({
        data: {
          title: `${video.title} - Épisode ${i + 1}`,
          description: video.description,
          url: video.url,  // À remplacer par vrai découpage Cloudinary
          thumbnail: video.thumbnail,
          duration: endTime - startTime,
          price: pricePerEpisode,
          status: 'approved',
          isSeries: false,
          parentId: video.id,
          episodeNumber: i + 1,
          creatorId: video.creatorId
        }
      })
    }

    return res.status(200).json({ success: true, totalEpisodes })
  } catch (error) {
    console.error('Erreur split:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}