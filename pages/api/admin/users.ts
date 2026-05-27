import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  const admin = await prisma.users.findUnique({
    where: { id: session.user.id }
  })

  if (admin?.role !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const users = await prisma.users.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        videos: { select: { id: true } },
        purchases: { select: { id: true } },
        earnings: { select: { amount: true } },
        withdrawals: { select: { amount: true } }
      }
    })

    const formattedUsers = users.map(user => ({
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      role: user.role,
      coins: user.coins,
      totalEarnings: user.earnings.reduce((sum, e) => sum + e.amount, 0),
      totalWithdrawn: user.withdrawals.reduce((sum, w) => sum + w.amount, 0),
      isActive: user.isActive ?? true,
      videos: user.videos.length,
      purchases: user.purchases.length,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }))

    return res.status(200).json(formattedUsers)
  } catch (error) {
    console.error('Erreur users:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}