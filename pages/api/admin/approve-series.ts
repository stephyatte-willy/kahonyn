import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
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

    const masterDuration = video.duration
    const totalEpisodes = Math.ceil(masterDuration / episodeDuration)

    // Créer les épisodes (série)
    for (let i = 0; i < totalEpisodes; i++) {
      await prisma.videos.create({
        data: {
          title: `${video.title} - Épisode ${i + 1}`,
          description: video.description,
          url: video.url, // À adapter avec vrai découpage
          duration: episodeDuration,
          price: pricePerEpisode,
          status: 'approved',
          isSeries: false,
          seriesId: video.id,
          episodeNumber: i + 1,
          creatorId: video.creatorId
        }
      })
    }

    // Marquer la vidéo originale comme traitée
    await prisma.videos.update({
      where: { id: videoId },
      data: { status: 'approved', isSeries: true }
    })

    return res.status(200).json({ success: true, totalEpisodes })
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}