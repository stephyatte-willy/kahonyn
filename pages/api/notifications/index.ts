import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  const userId = (session.user as any).id

  // GET - Récupérer les notifications
  if (req.method === 'GET') {
    try {
      const notifications = await (prisma as any).notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20
      })

      const unreadCount = await (prisma as any).notification.count({
        where: { userId, isRead: false }
      })

      return res.status(200).json({ notifications, unreadCount })
    } catch (error) {
      console.error('Erreur GET notifications:', error)
      return res.status(200).json({ notifications: [], unreadCount: 0 })
    }
  }

  // PATCH - Marquer comme lu
  if (req.method === 'PATCH') {
    try {
      const { id } = req.body

      if (id) {
        await (prisma as any).notification.update({
          where: { id },
          data: { isRead: true }
        })
      } else {
        await (prisma as any).notification.updateMany({
          where: { userId, isRead: false },
          data: { isRead: true }
        })
      }

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Erreur PATCH notifications:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}