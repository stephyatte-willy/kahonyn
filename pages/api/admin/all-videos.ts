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
    // Récupérer les séries (vidéos qui ont des épisodes)
    const seriesMasters = await (prisma as any).video.findMany({
      where: {
        seriesId: null,
        // Vidéos qui sont des masters de série
        episodes: { some: {} }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { name: true, phone: true, email: true } },
        episodes: {
          orderBy: { episodeNumber: 'asc' }
        }
      }
    })

    // Récupérer les vidéos simples (pas de seriesId, pas d'épisodes)
    const simpleVideos = await (prisma as any).video.findMany({
      where: {
        seriesId: null,
        episodes: { none: {} }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { name: true, phone: true, email: true } }
      }
    })

    return res.status(200).json({
      series: seriesMasters || [],
      simpleVideos: simpleVideos || []
    })
  } catch (error) {
    console.error('Erreur all-videos:', error)
    return res.status(200).json({ series: [], simpleVideos: [] })
  }
}