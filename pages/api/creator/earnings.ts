import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  // Vérifier que l'utilisateur est créateur ou admin
  if (session.user?.role !== 'creator' && session.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // Récupérer tous les gains du créateur
    const earnings = await prisma.creator_earnings.findMany({
      where: { creatorId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        video: {
          select: { title: true, id: true }
        }
      }
    })

    // Calculer le total des gains
    const total = earnings.reduce((sum, e) => sum + e.amount, 0)
    const pendingTotal = earnings
      .filter(e => e.status === 'pending')
      .reduce((sum, e) => sum + e.amount, 0)
    const paidTotal = earnings
      .filter(e => e.status === 'paid')
      .reduce((sum, e) => sum + e.amount, 0)

    return res.status(200).json({
      earnings,
      total,
      pendingTotal,
      paidTotal
    })
  } catch (error) {
    console.error('Erreur creator/earnings:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}