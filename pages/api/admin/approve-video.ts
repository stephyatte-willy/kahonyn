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
    const { videoId, price } = req.body

    if (!videoId) {
      return res.status(400).json({ error: 'ID vidéo requis' })
    }

    const video = await prisma.videos.update({
      where: { id: videoId },
      data: {
        status: 'approved',
        price: price || 100,
        isSeries: false
      }
    })

    return res.status(200).json({ success: true, video })
  } catch (error) {
    console.error('Erreur approve-video:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}