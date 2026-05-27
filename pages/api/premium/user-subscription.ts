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
    const subscription = await prisma.subscriptions.findFirst({
      where: {
        userId: session.user.id,
        status: 'active',
        endDate: { gt: new Date() }
      }
    })

    return res.status(200).json({ subscription })
  } catch (error) {
    console.error('Erreur user-subscription:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}