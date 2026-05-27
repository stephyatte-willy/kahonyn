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

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { videoId, status } = req.body

    if (!videoId) {
      return res.status(400).json({ error: 'ID vidéo requis' })
    }

    // Vérifier les statuts valides
    const validStatuses = ['pending', 'approved', 'rejected', 'archived']
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' })
    }

    const video = await prisma.videos.update({
      where: { id: videoId },
      data: { 
        status: status || 'archived', 
        updatedAt: new Date() 
      }
    })

    return res.status(200).json({ success: true, video })
  } catch (error) {
    console.error('Erreur update-video-status:', error)
    return res.status(500).json({ error: 'Erreur serveur: ' + (error as Error).message })
  }
}