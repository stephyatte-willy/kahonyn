import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  const user = await prisma.users.findUnique({
    where: { id: session.user.id }
  })

  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // Récupérer les vidéos en attente ET les demandes de suppression
    const pendingVideos = await prisma.videos.findMany({
      where: {
        OR: [
          { status: 'pending' },
          { status: 'deletion_requested' }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { name: true, phone: true, email: true }
        }
      }
    })

    return res.status(200).json(pendingVideos)
  } catch (error) {
    console.error('Erreur:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}