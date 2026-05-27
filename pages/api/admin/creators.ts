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
    const creators = await prisma.users.findMany({
      where: {
        OR: [
          { role: 'creator' },
          { role: 'admin' }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        videos: {
          select: { id: true }
        },
        earnings: {
          select: { amount: true }
        }
      }
    })

    const formattedCreators = creators.map(creator => ({
      id: creator.id,
      name: creator.name,
      phone: creator.phone,
      email: creator.email,
      coins: creator.coins,
      totalEarnings: creator.earnings.reduce((sum, e) => sum + e.amount, 0),
      role: creator.role,
      videos: creator.videos.length,
      createdAt: creator.createdAt
    }))

    return res.status(200).json(formattedCreators)
  } catch (error) {
    console.error('Erreur:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}