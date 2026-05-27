import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const mostViewed = await prisma.videos.findMany({
      where: { 
        status: 'approved',
        isSeries: false,
        parentId: null
      },
      orderBy: { views: 'desc' },
      take: 10,
      include: {
        creator: { select: { name: true } }
      }
    })

    return res.status(200).json(mostViewed)
  } catch (error) {
    console.error('Erreur most-viewed:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}