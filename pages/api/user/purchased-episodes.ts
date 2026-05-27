import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { ids } = req.query

    if (!ids || typeof ids !== 'string') {
      return res.status(200).json({ purchasedIds: [] })
    }

    const videoIds = ids.split(',')

    const purchases = await prisma.purchases.findMany({
      where: {
        userId: session.user.id,
        videoId: { in: videoIds },
        status: 'completed'
      },
      select: { videoId: true }
    })

    const purchasedIds = purchases.map(p => p.videoId)

    return res.status(200).json({ purchasedIds })
  } catch (error) {
    console.error('Erreur purchased-episodes:', error)
    return res.status(200).json({ purchasedIds: [] }) // Retourner un tableau vide au lieu d'une erreur
  }
}