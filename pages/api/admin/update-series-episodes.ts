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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { seriesId, price, status, category } = req.body

    if (!seriesId) {
      return res.status(400).json({ error: 'ID série requis' })
    }

    const updateData: any = {}
    if (price !== undefined) updateData.price = price
    if (status !== undefined) updateData.status = status
    if (category !== undefined) updateData.category = category

    await prisma.videos.updateMany({
      where: { parentId: seriesId },
      data: updateData
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Erreur update-series-episodes:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}