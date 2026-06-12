import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '../../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  const { id } = req.query
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'ID requis' })

  // PUT - Modifier un plan
  if (req.method === 'PUT') {
    try {
      const { name, description, price, duration, coinsBonus, dailyCoins, benefits, isPopular, isActive, sortOrder, color, badge } = req.body
      
      const plan = await (prisma as any).subscriptionPlan.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(price !== undefined && { price: parseFloat(price) }),
          ...(duration !== undefined && { duration: parseInt(duration) }),
          ...(coinsBonus !== undefined && { coinsBonus: parseInt(coinsBonus) }),
          ...(dailyCoins !== undefined && { dailyCoins: parseInt(dailyCoins) }),
          ...(benefits !== undefined && { benefits }),
          ...(isPopular !== undefined && { isPopular }),
          ...(isActive !== undefined && { isActive }),
          ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder) }),
          ...(color !== undefined && { color }),
          ...(badge !== undefined && { badge })
        }
      })

      return res.status(200).json(plan)
    } catch (error) {
      console.error('Erreur PUT plan:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  // PATCH - Activer/Désactiver
  if (req.method === 'PATCH') {
    try {
      const { isActive } = req.body
      const plan = await (prisma as any).subscriptionPlan.update({
        where: { id },
        data: { isActive }
      })
      return res.status(200).json(plan)
    } catch (error) {
      console.error('Erreur PATCH plan:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  // DELETE - Supprimer
  if (req.method === 'DELETE') {
    try {
      await (prisma as any).subscriptionPlan.delete({ where: { id } })
      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Erreur DELETE plan:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}