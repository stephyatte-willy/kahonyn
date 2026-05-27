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
    const user = await prisma.users.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    if (user.role === 'creator') {
      // Stats pour créateur
      const videos = await prisma.videos.findMany({
        where: { creatorId: user.id },
        orderBy: { createdAt: 'desc' }
      })

      const totalViews = videos.reduce((sum, v) => sum + v.views, 0)
      const totalEarnings = await prisma.creator_earnings.aggregate({
        where: { creatorId: user.id, status: 'paid' },
        _sum: { amount: true }
      })
      const pendingEarnings = await prisma.creator_earnings.aggregate({
        where: { creatorId: user.id, status: 'pending' },
        _sum: { amount: true }
      })

      return res.status(200).json({
        totalVideos: videos.length,
        totalViews,
        totalEarnings: totalEarnings._sum.amount || 0,
        pendingEarnings: pendingEarnings._sum.amount || 0,
        recentVideos: videos.slice(0, 5)
      })
    } else {
      // Stats pour utilisateur normal
      const purchases = await prisma.purchases.findMany({
        where: { userId: user.id },
        include: { video: true },
        orderBy: { createdAt: 'desc' }
      })

      return res.status(200).json({
        totalPurchases: purchases.length,
        totalCoins: user.coins,
        recentPurchases: purchases.slice(0, 5)
      })
    }
  } catch (error) {
    console.error('Erreur dashboard:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}