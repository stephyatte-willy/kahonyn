import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Sécurité : clé secrète
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Non autorisé' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // Récupérer les vidéos avec statut "deleted" dont le délai de 24h est passé
    const videosToHide = await prisma.videos.findMany({
      where: {
        status: 'deleted',
        deleteScheduledAt: { lte: new Date() },
        hiddenFromCreator: false
      }
    })

    let hiddenCount = 0
    for (const video of videosToHide) {
      await prisma.videos.update({
        where: { id: video.id },
        data: { hiddenFromCreator: true }
      })
      hiddenCount++
    }

    return res.status(200).json({ 
      success: true, 
      hiddenCount,
      message: `${hiddenCount} vidéo(s) masquée(s) aux créateurs`
    })
  } catch (error) {
    console.error('Erreur cron hide-deleted:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}