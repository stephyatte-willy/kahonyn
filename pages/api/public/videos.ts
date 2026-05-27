import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // Récupérer les vidéos simples sans condition de statut pour le debug
    const videos = await prisma.videos.findMany({
      where: {
        isSeries: false,
        parentId: null
        // Temporairement sans condition status
      },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { name: true, phone: true } }
      }
    })

    console.log('Vidéos simples trouvées:', videos.length)

    return res.status(200).json(videos)
  } catch (error) {
    console.error('Erreur videos:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}