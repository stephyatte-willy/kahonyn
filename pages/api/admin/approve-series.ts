import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) return res.status(401).json({ error: 'Non authentifié' })

  const userRole = (session.user as any)?.role
  if (userRole !== 'admin') return res.status(403).json({ error: 'Non autorisé' })

  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  try {
    const { videoId, episodeDuration, pricePerEpisode } = req.body

    const video = await (prisma as any).video.findUnique({ where: { id: videoId } })
    if (!video) return res.status(404).json({ error: 'Vidéo non trouvée' })

    const masterDuration = video.duration || 60
    const totalEpisodes = Math.ceil(masterDuration / (episodeDuration || 30))

    // Créer les épisodes
    for (let i = 0; i < totalEpisodes; i++) {
      await (prisma as any).video.create({
        data: {
          title: `${video.title} - Épisode ${i + 1}`,
          description: video.description,
          url: video.url,
          thumbnail: video.thumbnail,
          duration: episodeDuration || 30,
          price: pricePerEpisode || 100,
          status: 'approved',
          category: video.category || 'popular',
          seriesId: video.id,
          episodeNumber: i + 1,
          creatorId: video.creatorId
        }
      })
    }

    // Mettre à jour la vidéo master
    await (prisma as any).video.update({
      where: { id: videoId },
      data: { status: 'approved' }
    })

    return res.status(200).json({ success: true, totalEpisodes })
  } catch (error) {
    console.error('Erreur approve-series:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}