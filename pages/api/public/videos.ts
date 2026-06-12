import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // CORRECTION : prisma.video (singulier), seriesId au lieu de isSeries/parentId
    const videos = await (prisma as any).video.findMany({
      where: {
        seriesId: null  // Vidéos simples (pas d'épisodes de série)
      },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { name: true, phone: true } }
      }
    })

    console.log('Vidéos simples trouvées:', videos.length)

    return res.status(200).json(videos || [])
  } catch (error) {
    console.error('Erreur videos:', error)
    return res.status(200).json([])
  }
}