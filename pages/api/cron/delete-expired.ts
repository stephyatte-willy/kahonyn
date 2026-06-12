import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Non autorisé' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // Récupérer les vidéos marquées pour suppression
    // CORRECTION : prisma.video (singulier), utiliser isDeleted/willDisappearAt
    const videosToDelete = await (prisma as any).video.findMany({
      where: {
        isDeleted: true,
        willDisappearAt: { lte: new Date() }
      }
    })

    let deletedCount = 0
    for (const video of videosToDelete) {
      console.log(`Suppression définitive: "${video.title}" (${video.id})`)
      
      // Supprimer les achats liés
      // CORRECTION : prisma.purchase (singulier)
      await (prisma as any).purchase.deleteMany({ where: { videoId: video.id } })
      
      // Supprimer les likes liés
      await (prisma as any).like.deleteMany({ where: { videoId: video.id } })
      
      // Supprimer les commentaires liés
      await (prisma as any).comment.deleteMany({ where: { videoId: video.id } })
      
      // Supprimer l'historique de visionnage
      await (prisma as any).watchHistory.deleteMany({ where: { videoId: video.id } })
      
      // Supprimer la vidéo
      // CORRECTION : prisma.video (singulier)
      await (prisma as any).video.delete({ where: { id: video.id } })
      
      deletedCount++
    }

    return res.status(200).json({ success: true, deletedCount })
  } catch (error) {
    console.error('Erreur cron delete:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}