import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  const userRole = (session.user as any)?.role
  if (userRole !== 'creator' && userRole !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { videoId } = req.body
    const userId = (session.user as any).id

    if (!videoId) {
      return res.status(400).json({ error: 'ID vidéo requis' })
    }

    // CORRECTION : prisma.video (singulier)
    const video = await (prisma as any).video.findFirst({
      where: {
        id: videoId,
        creatorId: userId
      }
    })

    if (!video) {
      return res.status(404).json({ error: 'Vidéo non trouvée ou non autorisée' })
    }

    // CORRECTION : prisma.video (singulier)
    const updatedVideo = await (prisma as any).video.update({
      where: { id: videoId },
      data: {
        status: 'deletion_requested',
        deletionRequested: true,
        willDisappearAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
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