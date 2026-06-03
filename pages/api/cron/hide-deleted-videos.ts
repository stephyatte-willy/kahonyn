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
    // Récupérer les vidéos marquées pour suppression dont le délai est passé
    // CORRECTION : prisma.video (singulier), utiliser isDeleted/willDisappearAt
    const videosToHide = await (prisma as any).video.findMany({
      where: {
        isDeleted: true,
        willDisappearAt: { lte: new Date() }
      }
    })

    let hiddenCount = 0
    for (const video of videosToHide) {
      // Marquer comme complètement supprimée (ne plus afficher du tout)
      // CORRECTION : prisma.video (singulier)
      await (prisma as any).video.update({
        where: { id: video.id },
        data: { 
          status: 'archived', // Archiver au lieu de supprimer pour garder une trace
          isDeleted: false,
          willDisappearAt: null
        }
      })
      hiddenCount++
    }

    return res.status(200).json({ 
      success: true, 
      hiddenCount,
      message: `${hiddenCount} vidéo(s) masquée(s)`
    })
  } catch (error) {
    console.error('Erreur cron hide-deleted:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}