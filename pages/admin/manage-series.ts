import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
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

  const { seriesId, action, data } = req.body

  if (!seriesId || !action) {
    return res.status(400).json({ error: 'ID série et action requis' })
  }

  try {
    const series = await prisma.videos.findFirst({
      where: { id: seriesId, isSeries: true, parentId: null }
    })

    if (!series) {
      return res.status(404).json({ error: 'Série non trouvée' })
    }

    let result

    switch (action) {
      case 'delete':
        // Supprimer tous les épisodes puis la série
        await prisma.videos.deleteMany({
          where: { parentId: seriesId }
        })
        result = await prisma.videos.delete({
          where: { id: seriesId }
        })
        break

      case 'archive':
        // Archiver la série et tous ses épisodes
        await prisma.videos.updateMany({
          where: { parentId: seriesId },
          data: { status: 'archived', updatedAt: new Date() }
        })
        result = await prisma.videos.update({
          where: { id: seriesId },
          data: { status: 'archived', updatedAt: new Date() }
        })
        break

      case 'restore':
        // Restaurer la série et tous ses épisodes
        await prisma.videos.updateMany({
          where: { parentId: seriesId },
          data: { status: 'approved', updatedAt: new Date() }
        })
        result = await prisma.videos.update({
          where: { id: seriesId },
          data: { status: 'approved', updatedAt: new Date() }
        })
        break

      case 'update-price':
        // Changer le prix de tous les épisodes
        const { price } = data
        await prisma.videos.updateMany({
          where: { parentId: seriesId },
          data: { price, updatedAt: new Date() }
        })
        result = await prisma.videos.update({
          where: { id: seriesId },
          data: { updatedAt: new Date() }
        })
        break

      case 'update-category':
        // Changer la catégorie de la série et de tous les épisodes
        const { category } = data
        await prisma.videos.updateMany({
          where: { parentId: seriesId },
          data: { category, updatedAt: new Date() }
        })
        result = await prisma.videos.update({
          where: { id: seriesId },
          data: { category, updatedAt: new Date() }
        })
        break

      default:
        return res.status(400).json({ error: 'Action non reconnue' })
    }

    return res.status(200).json({ success: true, result })
  } catch (error) {
    console.error('Erreur manage-series:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}