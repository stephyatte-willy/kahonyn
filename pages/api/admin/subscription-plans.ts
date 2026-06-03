import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  // GET - Récupérer tous les plans
  if (req.method === 'GET') {
    try {
      const plans = await (prisma as any).subscriptionPlan.findMany({
        orderBy: { sortOrder: 'asc' }
      })
      return res.status(200).json(plans)
    } catch (error) {
      console.error('Erreur GET plans:', error)
      return res.status(200).json([])
    }
  }

  // POST - Créer un plan
  if (req.method === 'POST') {
    try {
      const { name, description, price, duration, coinsBonus, dailyCoins, benefits, isPopular, isActive, sortOrder, color, badge } = req.body
      
      if (!name) return res.status(400).json({ error: 'Nom requis' })

      const plan = await (prisma as any).subscriptionPlan.create({
        data: {
          name,
          description: description || '',
          price: parseFloat(price) || 0,
          duration: parseInt(duration) || 30,
          coinsBonus: parseInt(coinsBonus) || 0,
          dailyCoins: parseInt(dailyCoins) || 0,
          benefits: benefits || '[]',
          isPopular: isPopular || false,
          isActive: isActive !== false,
          sortOrder: parseInt(sortOrder) || 0,
          color: color || 'blue',
          badge: badge || null
        }
      })

      return res.status(201).json(plan)
    } catch (error) {
      console.error('Erreur POST plan:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}