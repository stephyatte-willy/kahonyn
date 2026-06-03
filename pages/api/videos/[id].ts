import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID vidéo requis' })
  }

  try {
    // CORRECTION : prisma.video (singulier)
    const video = await (prisma as any).video.findUnique({
      where: { id },
      include: {
        creator: {
          select: { name: true, phone: true, email: true }
        }
      }
    })

    if (!video) {
      return res.status(404).json({ error: 'Vidéo non trouvée' })
    }

    return res.status(200).json(video)
  } catch (error) {
    console.error('Erreur API video detail:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}