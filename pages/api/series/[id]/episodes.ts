import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const episodes = await prisma.videos.findMany({
      where: {
        parentId: id as string,
        status: 'approved'
      },
      orderBy: {
        episodeNumber: 'asc'
      }
    })

    return res.status(200).json(episodes)
  } catch (error) {
    console.error('Erreur:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}