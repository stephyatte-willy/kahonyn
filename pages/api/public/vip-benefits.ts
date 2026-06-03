import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const benefits = await (prisma as any).vipBenefit.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    })

    if (!benefits || benefits.length === 0) {
      const defaultBenefits = [
        { id: '1', title: 'Téléchargement', description: 'Téléchargez vos épisodes préférés', icon: 'CloudArrowDownIcon' },
        { id: '2', title: 'Accès anticipé', description: 'Voyez les épisodes 24h avant', icon: 'EyeIcon' },
        { id: '3', title: 'Badge exclusif', description: 'Badge VIP sur votre profil', icon: 'StarIcon' },
        { id: '4', title: 'Coins bonus', description: '+20% de coins à chaque achat', icon: 'GiftIcon' },
        { id: '5', title: 'Sans publicité', description: 'Navigation sans pub', icon: 'ShieldCheckIcon' },
      ]
      return res.status(200).json(defaultBenefits)
    }

    return res.status(200).json(benefits)
  } catch (error) {
    console.error('Erreur vip-benefits:', error)
    const fallbackBenefits = [
      { id: '1', title: 'Téléchargement', description: 'Téléchargez vos épisodes préférés', icon: 'CloudArrowDownIcon' },
      { id: '2', title: 'Accès anticipé', description: 'Voyez les épisodes 24h avant', icon: 'EyeIcon' },
      { id: '3', title: 'Badge exclusif', description: 'Badge VIP sur votre profil', icon: 'StarIcon' },
      { id: '4', title: 'Coins bonus', description: '+20% de coins à chaque achat', icon: 'GiftIcon' },
      { id: '5', title: 'Sans publicité', description: 'Navigation sans pub', icon: 'ShieldCheckIcon' },
    ]
    return res.status(200).json(fallbackBenefits)
  }
}