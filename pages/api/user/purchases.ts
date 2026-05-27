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
    const purchases = await prisma.purchases.findMany({
      where: { userId: session.user.id },
      include: {
        video: {
          select: { id: true, title: true, thumbnail: true, price: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return res.status(200).json(purchases)
  } catch (error) {
    console.error('Erreur:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}