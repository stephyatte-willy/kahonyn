import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { seriesId } = req.query

  if (!seriesId || typeof seriesId !== 'string') {
    return res.status(400).json({ error: 'ID série requis' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // Récupérer tous les épisodes de la série
    const episodes = await (prisma as any).video.findMany({
      where: { seriesId },
      select: { id: true }
    })

    if (episodes.length === 0) {
      return res.status(200).json({ average: 0, count: 0 })
    }

    const episodeIds = episodes.map((ep: any) => ep.id)

    // Récupérer les notes de tous les épisodes
    const ratings = await (prisma as any).rating.findMany({
      where: { videoId: { in: episodeIds } }
    })

    const average = ratings.length > 0
      ? ratings.reduce((sum: number, r: any) => sum + r.value, 0) / ratings.length
      : 0

    return res.status(200).json({
      average: Math.round(average * 10) / 10,
      count: ratings.length
    })
  } catch (error) {
    console.error('Erreur notes série:', error)
    return res.status(200).json({ average: 0, count: 0 })
  }
}