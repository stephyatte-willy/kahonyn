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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // Récupérer les masters (séries) avec leurs épisodes
    const masters = await prisma.videos.findMany({
      where: {
        isSeries: true,
        parentId: null
      },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { name: true, phone: true, email: true } },
        episodes: {
          where: { parentId: { not: null } },
          orderBy: { episodeNumber: 'asc' }
        }
      }
    })

    // Récupérer les vidéos simples (non masters, non épisodes)
    const simpleVideos = await prisma.videos.findMany({
      where: {
        isSeries: false,
        parentId: null
      },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { name: true, phone: true, email: true } }
      }
    })

    return res.status(200).json({
      series: masters,
      simpleVideos: simpleVideos
    })
  } catch (error) {
    console.error('Erreur all-videos:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}