// /api/ad/rewarded.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

const MAX_REWARDED_ADS_PER_DAY = 5

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  const userId = (session.user as any).id

  // GET - Vérifier la disponibilité (depuis la BDD uniquement)
  if (req.method === 'GET') {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const adsToday = await (prisma as any).adWatch.count({
        where: {
          userId,
          createdAt: { gte: today }
        }
      })

      // ✅ Retourner les valeurs exactes
      return res.status(200).json({
        canWatchAd: adsToday < MAX_REWARDED_ADS_PER_DAY,
        adsWatchedToday: adsToday,
        maxAdsPerDay: MAX_REWARDED_ADS_PER_DAY,
        remainingAds: Math.max(0, MAX_REWARDED_ADS_PER_DAY - adsToday)
      })
    } catch (error) {
      console.error('Erreur vérification pubs:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  // POST - Récompenser après une pub
  if (req.method === 'POST') {
    const { episodeId, rewardType = 'free_episode' } = req.body

    if (!episodeId) {
      return res.status(400).json({ error: 'ID épisode requis' })
    }

    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // ✅ Récupérer le compteur EXACT depuis la BDD
      const adsToday = await (prisma as any).adWatch.count({
        where: {
          userId,
          createdAt: { gte: today }
        }
      })

      // ✅ Vérification stricte
      if (adsToday >= MAX_REWARDED_ADS_PER_DAY) {
        return res.status(429).json({ 
          error: `Limite quotidienne atteinte (${MAX_REWARDED_ADS_PER_DAY}/${MAX_REWARDED_ADS_PER_DAY})`,
          remainingAds: 0
        })
      }

      // ✅ Vérifier si déjà récompensé pour cet épisode
      const existingReward = await (prisma as any).adWatch.findFirst({
        where: { userId, episodeId }
      })

      if (existingReward) {
        return res.status(400).json({ error: 'Cet épisode a déjà été débloqué par pub' })
      }

      // ✅ Transaction pour éviter les doublons
      const result = await (prisma as any).$transaction(async (tx: any) => {
        // Créer l'achat gratuit
        const purchase = await tx.purchase.create({
          data: {
            userId,
            videoId: episodeId,
            amount: 0,
            paymentMethod: 'rewarded_ad',
            status: 'completed'
          }
        })

        // Enregistrer la pub regardée
        const adWatch = await tx.adWatch.create({
          data: {
            userId,
            episodeId,
            rewardType,
            rewardAmount: 1
          }
        })

        return { purchase, adWatch }
      })

      // ✅ Compter le nouveau total
      const newAdsToday = adsToday + 1
      const remainingAfter = MAX_REWARDED_ADS_PER_DAY - newAdsToday

      return res.status(200).json({
        success: true,
        message: 'Épisode débloqué !',
        episodeId,
        adsWatchedToday: newAdsToday,
        remainingAds: remainingAfter,
        maxAdsPerDay: MAX_REWARDED_ADS_PER_DAY,
        canWatchMore: newAdsToday < MAX_REWARDED_ADS_PER_DAY
      })
    } catch (error) {
      console.error('Erreur récompense pub:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}