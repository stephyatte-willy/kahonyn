import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  if (session.user?.role !== 'creator' && session.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { videoId } = req.body

    if (!videoId) {
      return res.status(400).json({ error: 'ID vidéo requis' })
    }

    const video = await prisma.videos.findFirst({
      where: {
        id: videoId,
        creatorId: session.user.id
      }
    })

    if (!video) {
      return res.status(404).json({ error: 'Vidéo non trouvée' })
    }

    const updatedVideo = await prisma.videos.update({
      where: { id: videoId },
      data: {
        status: 'deletion_requested',
        deletionRequested: true,
        deletionRequestedAt: new Date(),
        updatedAt: new Date()
      }
    })

    return res.status(200).json({ 
      success: true, 
      message: 'Demande de suppression envoyée à l\'administration.',
      video: updatedVideo
    })
  } catch (error) {
    console.error('Erreur request-delete:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}