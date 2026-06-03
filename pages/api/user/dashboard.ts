import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const userId = (session.user as any).id
    const userRole = (session.user as any).role

    // Récupérer l'utilisateur
    const user = await (prisma as any).user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    if (userRole === 'creator' || userRole === 'admin') {
      // ============================================================
      // STATS CRÉATEUR
      // ============================================================
      
      // Vidéos simples du créateur
      const videos = await (prisma as any).video.findMany({
        where: { 
          creatorId: userId,
          seriesId: null,
          status: { not: 'archived' }
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          views: true,
          purchasesCount: true,
          status: true,
          createdAt: true,
        }
      })

      // Séries du créateur
      const seriesList = await (prisma as any).series.findMany({
        where: { creatorId: userId },
        select: { id: true, title: true, totalViews: true, status: true, createdAt: true }
      })

      // Calculer les vues totales
      const videoViews = videos.reduce((sum: number, v: any) => sum + (v.views || 0), 0)
      const seriesViews = seriesList.reduce((sum: number, s: any) => sum + (s.totalViews || 0), 0)
      const totalViews = videoViews + seriesViews

      // Gains depuis les achats
      const purchases = await (prisma as any).purchase.findMany({
        where: {
          status: 'completed',
          video: { creatorId: userId }
        },
        select: { amount: true, status: true }
      })

      const totalEarnings = purchases.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

      // Dernières vidéos (fusionner vidéos et séries)
      const recentVideos = [...videos, ...seriesList.map((s: any) => ({
        id: s.id,
        title: s.title,
        views: s.totalViews || 0,
        purchases: 0,
        status: s.status,
        createdAt: s.createdAt,
      }))]
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)

      return res.status(200).json({
        totalVideos: videos.length + seriesList.length,
        totalViews,
        totalEarnings,
        pendingEarnings: 0,
        totalCoins: user.coins || 0,
        recentVideos,
      })
    } else {
      // ============================================================
      // STATS CLIENT
      // ============================================================
      
      // Achats du client
      const purchases = await (prisma as any).purchase.findMany({
        where: { userId },
        include: {
          video: { select: { title: true } },
          series: { select: { title: true } }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Nombre de likes
      const likesCount = await (prisma as any).like.count({
        where: { userId }
      })

      // Historique de visionnage
      const watchCount = await (prisma as any).watchHistory.count({
        where: { userId }
      })

      return res.status(200).json({
        totalPurchases: purchases.length,
        totalCoins: user.coins || 0,
        favorites: likesCount,
        totalViews: watchCount,
        recentPurchases: purchases.slice(0, 5).map((p: any) => ({
          id: p.id,
          amount: p.amount || 0,
          createdAt: p.createdAt,
          video: p.video ? { title: p.video.title } : (p.series ? { title: p.series.title } : { title: 'Contenu supprimé' }),
          status: p.status,
        })),
      })
    }
  } catch (error) {
    console.error('Erreur dashboard:', error)
    // Retourner des valeurs par défaut
    return res.status(200).json({
      totalVideos: 0,
      totalViews: 0,
      totalEarnings: 0,
      pendingEarnings: 0,
      totalPurchases: 0,
      totalCoins: 0,
      favorites: 0,
      recentVideos: [],
      recentPurchases: [],
    })
  }
}