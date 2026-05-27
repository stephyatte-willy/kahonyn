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
    // Vérifier si la table creator_earnings existe
    let earnings: any[] = []
    let total = 0

    try {
      // Essayer de récupérer les gains
      earnings = await (prisma as any).creatorEarning?.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: { name: true, phone: true }
          },
          video: {
            select: { title: true }
          }
        }
      }) || []
      
      total = earnings.reduce((sum: number, e: any) => sum + (e.amount || 0), 0)
    } catch (err) {
      console.error('Table creator_earnings peut-être manquante:', err)
      // Si la table n'existe pas, retourner un tableau vide
      earnings = []
      total = 0
    }

    return res.status(200).json({ earnings, total })
  } catch (error) {
    console.error('Erreur earnings:', error)
    return res.status(500).json({ error: 'Erreur serveur', details: String(error) })
  }
}