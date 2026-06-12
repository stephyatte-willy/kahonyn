import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { videoId } = req.query

  if (!videoId || typeof videoId !== 'string') {
    return res.status(400).json({ error: 'ID vidéo requis' })
  }

  // GET - Récupérer la note moyenne et la note de l'utilisateur
  if (req.method === 'GET') {
    try {
      // Note moyenne
      const ratings = await (prisma as any).rating.findMany({
        where: { videoId }
      })

      const average = ratings.length > 0
        ? ratings.reduce((sum: number, r: any) => sum + r.value, 0) / ratings.length
        : 0

      // Note de l'utilisateur connecté
      const session = await getServerSession(req, res, authOptions)
      let userRating = 0
      if (session) {
        const userId = (session.user as any).id
        const userRate = await (prisma as any).rating.findFirst({
          where: { userId, videoId }
        })
        userRating = userRate?.value || 0
      }

      return res.status(200).json({
        average: Math.round(average * 10) / 10,
        count: ratings.length,
        userRating
      })
    } catch (error) {
      console.error('Erreur GET ratings:', error)
      return res.status(200).json({ average: 0, count: 0, userRating: 0 })
    }
  }

  // POST - Noter
  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    try {
      const { value } = req.body
      const userId = (session.user as any).id

      if (!value || value < 1 || value > 5) {
        return res.status(400).json({ error: 'Note invalide (1-5)' })
      }

      // Upsert : créer ou mettre à jour
      const existing = await (prisma as any).rating.findFirst({
        where: { userId, videoId }
      })

      if (existing) {
        await (prisma as any).rating.update({
          where: { id: existing.id },
          data: { value }
        })
      } else {
        await (prisma as any).rating.create({
          data: { userId, videoId, value }
        })
      }

      // Recalculer la moyenne
      const ratings = await (prisma as any).rating.findMany({
        where: { videoId }
      })
      const average = ratings.reduce((sum: number, r: any) => sum + r.value, 0) / ratings.length

      return res.status(200).json({
        success: true,
        average: Math.round(average * 10) / 10,
        count: ratings.length,
        userRating: value
      })
    } catch (error) {
      console.error('Erreur POST rating:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}