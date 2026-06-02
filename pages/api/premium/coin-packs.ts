// pages/api/premium/coin-packs.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // Essayer de récupérer depuis la base de données
    let coinPacks: any[] = []
    
    try {
      coinPacks = await (prisma as any).coinPack.findMany({
        orderBy: { price: 'asc' }
      })
    } catch (dbError) {
      console.log('Table coinPack non trouvée, utilisation des packs par défaut')
    }

    // Si la table est vide ou n'existe pas, utiliser les packs par défaut
    if (!coinPacks || coinPacks.length === 0) {
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
    // Toujours retourner un tableau
    const fallbackPacks = [
      { id: 'small', name: 'Petit pack', coins: 100, price: 500, bonus: 0, isPopular: false, isVip: false },
      { id: 'medium', name: 'Pack moyen', coins: 450, price: 2000, bonus: 50, isPopular: true, isVip: false },
      { id: 'large', name: 'Grand pack', coins: 1200, price: 5000, bonus: 200, isPopular: false, isVip: false },
    ]
    return res.status(200).json(fallbackPacks)
  }
}