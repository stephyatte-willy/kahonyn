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

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { id, title, description, price, status } = req.body

    if (!id) {
      return res.status(400).json({ error: 'ID vidéo requis' })
    }

    const video = await prisma.videos.update({
      where: { id },
      data: {
        title: title || undefined,
        description: description || undefined,
        price: price || undefined,
        status: status || undefined,
        updatedAt: new Date()
      }
    })

    return res.status(200).json({ success: true, video })
  } catch (error) {
    console.error('Erreur update-video:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}