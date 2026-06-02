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

  const { seriesId, action, data } = req.body

  if (!seriesId || !action) {
    return res.status(400).json({ error: 'ID série et action requis' })
  }

  try {
    const series = await (prisma as any).video.findFirst({
      where: { id: seriesId }
    })

    if (!series) {
      return res.status(404).json({ error: 'Série non trouvée' })
    }

    switch (action) {
      case 'delete':
        await (prisma as any).video.deleteMany({ where: { seriesId } })
        await (prisma as any).video.delete({ where: { id: seriesId } })
        break

      case 'archive':
        await (prisma as any).video.updateMany({
          where: { seriesId },
          data: { status: 'archived' }
        })
        await (prisma as any).video.update({
          where: { id: seriesId },
          data: { status: 'archived' }
        })
        break

      case 'restore':
        await (prisma as any).video.updateMany({
          where: { seriesId },
          data: { status: 'approved' }
        })
        await (prisma as any).video.update({
          where: { id: seriesId },
          data: { status: 'approved' }
        })
        break

      default:
        return res.status(400).json({ error: 'Action non reconnue' })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Erreur manage-series:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}