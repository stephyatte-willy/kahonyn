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

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { id, title, description, price, status, category } = req.body

    if (!id) {
      return res.status(400).json({ error: 'ID vidéo requis' })
    }

    await (prisma as any).video.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseInt(price) }),
        ...(status !== undefined && { status }),
        ...(category !== undefined && { category }),
      }
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Erreur update-video:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}