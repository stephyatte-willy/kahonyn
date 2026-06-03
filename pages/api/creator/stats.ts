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
  if (userRole !== 'creator' && userRole !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const userId = (session.user as any).id

    // 1. Récupérer toutes les vidéos du créateur (simples, pas les épisodes)
    const videos = await (prisma as any).video.findMany({
      where: {
        creatorId: userId,
        seriesId: null,
        status: { not: 'archived' }
      },
      select: {
        id: true,
        title: true,
        views: true,
        purchasesCount: true,
      }
    })

    // 2. Récupérer les séries du créateur
    const seriesList = await (prisma as any).series.findMany({
      where: { creatorId: userId },
      select: {
        id: true,
        title: true,
        totalViews: true,
      }
    })

    // 3. Calculer les totaux
    const totalViewsFromVideos = videos.reduce((sum: number, v: any) => sum + (v.views || 0), 0)
    const totalViewsFromSeries = seriesList.reduce((sum: number, s: any) => sum + (s.totalViews || 0), 0)
    const totalViews = totalViewsFromVideos + totalViewsFromSeries

    const totalPurchases = videos.reduce((sum: number, v: any) => sum + (v.purchasesCount || 0), 0)

    // 4. Récupérer les revenus (achats des vidéos du créateur)
    const purchases = await (prisma as any).purchase.findMany({
      where: {
        status: 'completed',
        video: { creatorId: userId }
      },
      select: { amount: true }
    })

    const totalRevenue = purchases.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

    // 5. Récupérer les likes
    const likesCount = await (prisma as any).like.count({
      where: {
        video: { creatorId: userId }
      }
    })

    // 6. Top vidéos par vues
    const topVideos = [...videos]
      .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
      .slice(0, 5)
      .map((v: any) => ({
        id: v.id,
        title: v.title,
        views: v.views || 0,
        purchases: v.purchasesCount || 0,
        revenue: 0, // Calculé séparément si nécessaire
      }))

    // Calculer les revenus pour chaque top vidéo
    for (const video of topVideos) {
      const videoPurchases = await (prisma as any).purchase.findMany({
        where: {
          status: 'completed',
          videoId: video.id
        },
        select: { amount: true }
      })
      video.revenue = videoPurchases.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
    }

    return res.status(200).json({
      totalViews,
      totalPurchases,
      totalRevenue,
      totalLikes: likesCount,
      totalVideos: videos.length,
      totalSeries: seriesList.length,
      topVideos,
    })
  } catch (error) {
    console.error('Erreur creator/stats:', error)
    // Retourner des valeurs par défaut en cas d'erreur
    return res.status(200).json({
      totalViews: 0,
      totalPurchases: 0,
      totalRevenue: 0,
      totalLikes: 0,
      totalVideos: 0,
      totalSeries: 0,
      topVideos: [],
    })
  }
}