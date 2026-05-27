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
    // Récupération sécurisée des stats
    const totalVideos = await (prisma.videos as any).count()
    const pendingVideos = await (prisma.videos as any).count({ where: { status: 'pending' } })
    const approvedVideos = await (prisma.videos as any).count({ where: { status: 'approved' } })
    
    const earningsResult = await (prisma.creator_earnings as any).aggregate({ _sum: { amount: true } })
    const totalEarnings = earningsResult._sum?.amount || 0
    
    const withdrawalsResult = await (prisma.withdrawals as any).aggregate({ _sum: { amount: true } })
    const totalWithdrawals = withdrawalsResult._sum?.amount || 0
    
    const totalCreators = await prisma.users.count({ where: { role: 'creator' } })
    const totalUsers = await prisma.users.count()

    return res.status(200).json({
      totalVideos,
      pendingVideos,
      approvedVideos,
      totalEarnings,
      totalWithdrawals,
      totalCreators,
      totalUsers,
    })
  } catch (error) {
    console.error('Erreur stats:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}