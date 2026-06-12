import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  const userRole = (session.user as any)?.role
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const creators = await (prisma as any).user.findMany({
      where: {
        role: { in: ['creator', 'admin'] }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        videos: { select: { id: true } },
        purchases: { select: { amount: true } }
      }
    })

    const formattedCreators = creators.map((creator: any) => ({
      id: creator.id,
      name: creator.name,
      phone: creator.phone,
      email: creator.email,
      coins: creator.coins || 0,
      totalEarnings: creator.totalEarnings || 0,
      role: creator.role,
      videos: creator.videos?.length || 0,
      createdAt: creator.createdAt
    }))

    return res.status(200).json(formattedCreators)
  } catch (error) {
    console.error('Erreur creators:', error)
    return res.status(200).json([])
  }
}