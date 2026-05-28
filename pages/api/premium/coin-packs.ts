import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const coinPacks = await prisma.coinPacks.findMany({
      orderBy: { price: 'asc' }
    })

    if (coinPacks.length === 0) {
      // Packs par défaut si la table est vide
      const defaultPacks = [
        { id: 'small', name: 'Petit pack', coins: 100, price: 500, bonus: 0, isPopular: false, isVip: false },
        { id: 'medium', name: 'Pack moyen', coins: 450, price: 2000, bonus: 50, isPopular: true, isVip: false },
        { id: 'large', name: 'Grand pack', coins: 1200, price: 5000, bonus: 200, isPopular: false, isVip: false },
        { id: 'premium', name: 'Pack premium', coins: 2500, price: 10000, bonus: 500, isPopular: false, isVip: true },
        { id: 'vip', name: 'Pack VIP', coins: 6500, price: 25000, bonus: 1500, isPopular: false, isVip: true }
      ]
      return res.status(200).json(defaultPacks)
    }

    return res.status(200).json(coinPacks)
  } catch (error) {
    console.error('Erreur coin-packs:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}