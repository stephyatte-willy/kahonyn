import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  const userRole = (session.user as any)?.role
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const pendingVideos = await (prisma as any).video.findMany({
      where: {
        OR: [
          { status: 'pending' },
          { status: 'deletion_requested' },
          { deletionRequested: true }
        ],
        seriesId: null // Seulement les masters, pas les épisodes
      },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { name: true, phone: true, email: true }
        }
      }
    })

    return res.status(200).json(Array.isArray(pendingVideos) ? pendingVideos : [])
  } catch (error) {
    console.error('Erreur pending-videos:', error)
    return res.status(200).json([])
  }
}