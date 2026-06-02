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
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // Récupérer tous les achats avec les infos créateur
    const purchases = await (prisma as any).purchase.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, phone: true } },
        video: { 
          select: { 
            title: true,
            creator: { select: { name: true, phone: true } }
          } 
        }
      }
    })

    const earnings = purchases.map((p: any) => ({
      id: p.id,
      amount: p.amount || 0,
      status: p.status || 'completed',
      createdAt: p.createdAt,
      video: { title: p.video?.title || '—' },
      creator: p.video?.creator || p.user
    }))

    const total = earnings.reduce((sum: number, e: any) => sum + e.amount, 0)

    return res.status(200).json({ earnings, total })
  } catch (error) {
    console.error('Erreur earnings:', error)
    return res.status(200).json({ earnings: [], total: 0 })
  }
}