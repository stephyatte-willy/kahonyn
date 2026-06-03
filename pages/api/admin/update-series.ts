import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { id, title, description, price, status, category, categories } = req.body

    if (!id) {
      return res.status(400).json({ error: 'ID série requis' })
    }

    const categoryString = Array.isArray(categories) 
      ? categories.join(',') 
      : category || undefined

    // Mettre à jour la série
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = parseInt(price)
    if (status !== undefined) updateData.status = status
    if (categoryString !== undefined) updateData.category = categoryString

    await (prisma as any).series.update({
      where: { id },
      data: updateData
    })

    // Mettre à jour tous les épisodes
    const episodeUpdate: any = {}
    if (price !== undefined) episodeUpdate.price = parseInt(price)
    if (status !== undefined) episodeUpdate.status = status
    if (categoryString !== undefined) {
      episodeUpdate.category = categoryString
      episodeUpdate.tags = categoryString
    }

    if (Object.keys(episodeUpdate).length > 0) {
      await (prisma as any).video.updateMany({
        where: { seriesId: id },
        data: episodeUpdate
      })
    }

    return res.status(200).json({ success: true, message: 'Série et épisodes mis à jour' })
  } catch (error) {
    console.error('Erreur update-series:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}