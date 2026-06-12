import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  // GET - Récupérer tous les packs
  if (req.method === 'GET') {
    try {
      const packs = await (prisma as any).coinPack.findMany({
        orderBy: { sortOrder: 'asc' }
      })
      return res.status(200).json(packs)
    } catch (error) {
      console.error('Erreur GET packs:', error)
      return res.status(200).json([])
    }
  }

  // POST - Créer un pack
  if (req.method === 'POST') {
    try {
      const { name, description, coins, price, bonus, isPopular, isActive, sortOrder, promotionText } = req.body
      
      if (!name) return res.status(400).json({ error: 'Nom requis' })

      const pack = await (prisma as any).coinPack.create({
        data: {
          name,
          description: description || '',
          coins: parseInt(coins) || 0,
          price: parseFloat(price) || 0,
          bonus: parseInt(bonus) || 0,
          isPopular: isPopular || false,
          isActive: isActive !== false,
          sortOrder: parseInt(sortOrder) || 0,
          promotionText: promotionText || null
        }
      })

      return res.status(201).json(pack)
    } catch (error) {
      console.error('Erreur POST pack:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}