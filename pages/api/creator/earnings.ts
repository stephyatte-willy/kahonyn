import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  const userRole = (session.user as any)?.role
  if (userRole !== 'creator' && userRole !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const userId = (session.user as any).id

    // Récupérer les achats des vidéos du créateur (ses gains)
    const purchases = await (prisma as any).purchase.findMany({
      where: {
        status: 'completed',
        video: {
          creatorId: userId
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        video: {
          select: { title: true, id: true }
        },
        user: {
          select: { name: true, phone: true }
        }
      }
    })

    // Formater les gains
    const earnings = purchases.map((p: any) => ({
      id: p.id,
      amount: p.amount || 0,
      status: p.status || 'completed',
      createdAt: p.createdAt,
      video: p.video ? { title: p.video.title } : { title: 'Vidéo supprimée' },
      buyer: p.user ? { name: p.user.name, phone: p.user.phone } : null
    }))

    // Calculer les totaux
    const total = earnings.reduce((sum: number, e: any) => sum + (e.amount || 0), 0)

    return res.status(200).json({
      earnings,
      total,
      pendingTotal: 0,
      paidTotal: total
    })
  } catch (error) {
    console.error('Erreur creator/earnings:', error)
    // Retourner des valeurs par défaut en cas d'erreur
    return res.status(200).json({
      earnings: [],
      total: 0,
      pendingTotal: 0,
      paidTotal: 0
    })
  }
}