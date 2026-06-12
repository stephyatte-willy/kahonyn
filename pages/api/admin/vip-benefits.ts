import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  // GET - Récupérer tous les avantages
  if (req.method === 'GET') {
    try {
      const benefits = await (prisma as any).vipBenefit.findMany({
        orderBy: { sortOrder: 'asc' }
      })
      return res.status(200).json(benefits)
    } catch (error) {
      console.error('Erreur GET benefits:', error)
      return res.status(200).json([])
    }
  }

  // POST - Créer un avantage
  if (req.method === 'POST') {
    try {
      const { title, description, icon, isActive, sortOrder } = req.body
      
      if (!title) return res.status(400).json({ error: 'Titre requis' })

      const benefit = await (prisma as any).vipBenefit.create({
        data: {
          title,
          description: description || '',
          icon: icon || 'SparklesIcon',
          isActive: isActive !== false,
          sortOrder: parseInt(sortOrder) || 0
        }
      })

      return res.status(201).json(benefit)
    } catch (error) {
      console.error('Erreur POST benefit:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}