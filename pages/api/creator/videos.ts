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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const videos = await prisma.videos.findMany({
      where: { creatorId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { name: true, phone: true }
        }
      }
    })

    const formattedVideos = videos.map(video => ({
      ...video,
      deletionRequested: video.status === 'deletion_requested',
      isDeleted: video.status === 'deleted',
      // Utiliser le bon nom de champ selon ton schéma
      willDisappearAt: (video as any).deletedAt || null
    }))

    return res.status(200).json(formattedVideos)
  } catch (error) {
    console.error('Erreur:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}