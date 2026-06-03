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
    const userId = (session.user as any).id
    const FREE_VIDEOS_LIMIT = 2

    const watchedCount = await (prisma as any).watchHistory.count({
      where: { userId }
    })

    const remaining = Math.max(0, FREE_VIDEOS_LIMIT - watchedCount)

    return res.status(200).json({
      remaining,
      total: FREE_VIDEOS_LIMIT,
      watched: watchedCount
    })
  } catch (error) {
    console.error('Erreur free-videos:', error)
    return res.status(200).json({ remaining: 0, total: 2, watched: 2 })
  }
}