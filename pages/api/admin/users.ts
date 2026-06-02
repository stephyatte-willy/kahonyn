import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session || (session.user as any)?.role !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  try {
    const users = await (prisma as any).user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, phone: true, name: true, email: true,
        role: true, coins: true, totalEarnings: true,
        createdAt: true,
        _count: { select: { videos: true, purchases: true } }
      }
    })

    const formattedUsers = users.map((u: any) => ({
      id: u.id,
      phone: u.phone,
      name: u.name,
      email: u.email,
      role: u.role,
      coins: u.coins || 0,
      totalEarnings: u.totalEarnings || 0,
      totalWithdrawn: 0,
      isActive: true,
      videos: u._count?.videos || 0,
      purchases: u._count?.purchases || 0,
      createdAt: u.createdAt,
      lastLogin: null,
    }))

    return res.status(200).json(formattedUsers)
  } catch (error) {
    console.error('Erreur users:', error)
    return res.status(200).json([])
  }
}