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
      return res.status(400).json({ error: 'ID vidéo requis' })
    }

    const categoryString = Array.isArray(categories) 
      ? categories.join(',') 
      : category || undefined

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = parseInt(price)
    if (status !== undefined) updateData.status = status
    if (categoryString !== undefined) {
      updateData.category = categoryString
      updateData.tags = categoryString
    }

    await (prisma as any).video.update({
      where: { id },
      data: updateData
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Erreur update-video:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}