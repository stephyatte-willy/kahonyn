import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

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

    const userId = (session.user as any).id
    const videoIds = ids.split(',').filter(Boolean)

    if (videoIds.length === 0) {
      return res.status(200).json({ purchasedIds: [] })
    }

    // CORRECTION : prisma.purchase (singulier)
    const purchases = await (prisma as any).purchase.findMany({
      where: {
        userId,
        videoId: { in: videoIds },
        status: 'completed'
      },
      select: { videoId: true }
    })

    const purchasedIds = purchases.map((p: any) => p.videoId)

    return res.status(200).json({ purchasedIds })
  } catch (error) {
    console.error('Erreur purchased-episodes:', error)
    return res.status(200).json({ purchasedIds: [] })
  }
}