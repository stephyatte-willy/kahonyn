import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Non autorisé' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // Récupérer les vidéos à faire disparaître définitivement
    const videosToDelete = await prisma.videos.findMany({
      where: {
        status: 'deleted',
        deletedAt: { lte: new Date() }
      }
    })

    let deletedCount = 0
    for (const video of videosToDelete) {
      // Notifier le créateur (à implémenter avec un système de notifications)
      console.log(`Notification au créateur ${video.creatorId}: Votre vidéo "${video.title}" a été supprimée définitivement`)
      
      // Supprimer définitivement
      await prisma.purchases.deleteMany({ where: { videoId: video.id } })
      await prisma.creator_earnings.deleteMany({ where: { videoId: video.id } })
      await prisma.videos.delete({ where: { id: video.id } })
      deletedCount++
    }

    return res.status(200).json({ success: true, deletedCount })
  } catch (error) {
    console.error('Erreur cron delete:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}