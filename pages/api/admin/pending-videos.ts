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
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // Récupérer les IDs des masters déjà archivés
    const archivedMasterIds = await (prisma as any).video.findMany({
      where: {
        status: 'archived',
        seriesId: { not: null }
      },
      select: { id: true }
    }).then((v: any) => v.map((m: any) => m.id)).catch(() => [])

    const pendingVideos = await (prisma as any).video.findMany({
      where: {
        seriesId: null,
        status: { not: 'archived' },
        // Exclure les masters archivés
        id: archivedMasterIds.length > 0 ? { notIn: archivedMasterIds } : undefined,
        OR: [
          { status: 'pending' },
          { deletionRequested: true }
        ]
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