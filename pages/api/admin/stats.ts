import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  // CORRECTION : Utiliser la session
  const userRole = (session.user as any)?.role
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // CORRECTION : prisma.video, prisma.user, prisma.purchase (singulier)
    const totalVideos = await (prisma as any).video.count({
      where: { seriesId: null }
    })
    
    const pendingVideos = await (prisma as any).video.count({ 
      where: { status: 'pending', seriesId: null } 
    })
    
    const approvedVideos = await (prisma as any).video.count({ 
      where: { status: 'approved', seriesId: null } 
    })
    
    // Calculer les gains depuis les achats
    let totalEarnings = 0
    try {
      const earningsResult = await (prisma as any).purchase.aggregate({
        _sum: { amount: true },
        where: { status: 'completed' }
      })
      totalEarnings = earningsResult._sum?.amount || 0
    } catch (e) {
      console.log('Table purchase pas encore disponible')
    }
    
    // Retraits
    let totalWithdrawals = 0
    try {
      const withdrawalsResult = await (prisma as any).withdrawalRequest.aggregate({
        _sum: { amount: true },
        where: { status: 'paid' }
      })
      totalWithdrawals = withdrawalsResult._sum?.amount || 0
    } catch (e) {
      console.log('Table withdrawalRequest pas encore disponible')
    }
    
    const totalCreators = await (prisma as any).user.count({ 
      where: { role: 'creator' } 
    })
    
    const totalUsers = await (prisma as any).user.count({
      where: { role: 'client' }
    })
    
    // Revenus mensuels (achats du mois en cours)
    let monthlyRevenue = 0
    try {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      
      const monthlyResult = await (prisma as any).purchase.aggregate({
        _sum: { amount: true },
        where: {
          status: 'completed',
          createdAt: { gte: startOfMonth }
        }
      })
      monthlyRevenue = monthlyResult._sum?.amount || 0
    } catch (e) {
      console.log('Calcul mensuel non disponible')
    }

    return res.status(200).json({
      totalVideos,
      pendingVideos,
      approvedVideos,
      totalEarnings,
      totalWithdrawals,
      totalCreators,
      totalUsers,
      monthlyRevenue,
    })
  } catch (error) {
    console.error('Erreur stats:', error)
    // Retourner des valeurs par défaut en cas d'erreur
    return res.status(200).json({
      totalVideos: 0,
      pendingVideos: 0,
      approvedVideos: 0,
      totalEarnings: 0,
      totalWithdrawals: 0,
      totalCreators: 0,
      totalUsers: 0,
      monthlyRevenue: 0,
    })
  }
}