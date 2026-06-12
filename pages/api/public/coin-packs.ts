import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const packs = await (prisma as any).coinPack.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    })

    // Si aucun pack en BDD, retourner des packs par défaut
    if (!packs || packs.length === 0) {
      const defaultPacks = [
        { id: 'small', name: 'Petit pack', description: 'Idéal pour découvrir', coins: 100, price: 500, bonus: 0, isPopular: false, isVip: false, promotionText: null },
        { id: 'standard', name: 'Pack Standard', description: 'Le plus populaire', coins: 250, price: 1000, bonus: 50, isPopular: true, isVip: false, promotionText: null },
        { id: 'medium', name: 'Pack Moyen', description: 'Bon rapport qualité/prix', coins: 600, price: 2000, bonus: 100, isPopular: false, isVip: false, promotionText: null },
        { id: 'large', name: 'Grand Pack', description: 'Pour les binge-watchers', coins: 1800, price: 5000, bonus: 700, isPopular: false, isVip: false, promotionText: null },
        { id: 'vip', name: 'Pack VIP', description: 'Le meilleur rapport', coins: 4000, price: 10000, bonus: 2000, isPopular: false, isVip: true, promotionText: null },
      ]
      return res.status(200).json(defaultPacks)
    }

    return res.status(200).json(packs)
  } catch (error) {
    console.error('Erreur coin-packs:', error)
    // Retourner des packs par défaut en cas d'erreur
    const fallbackPacks = [
      { id: 'small', name: 'Petit pack', description: 'Idéal pour découvrir', coins: 100, price: 500, bonus: 0, isPopular: false, isVip: false, promotionText: null },
      { id: 'standard', name: 'Pack Standard', description: 'Le plus populaire', coins: 250, price: 1000, bonus: 50, isPopular: true, isVip: false, promotionText: null },
      { id: 'medium', name: 'Pack Moyen', description: 'Bon rapport qualité/prix', coins: 600, price: 2000, bonus: 100, isPopular: false, isVip: false, promotionText: null },
    ]
    return res.status(200).json(fallbackPacks)
  }
}