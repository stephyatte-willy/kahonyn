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

  // PUT - Modifier un pack
  if (req.method === 'PUT') {
    try {
      const { name, description, coins, price, bonus, isPopular, isActive, sortOrder, promotionText } = req.body
      
      const pack = await (prisma as any).coinPack.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(coins !== undefined && { coins: parseInt(coins) }),
          ...(price !== undefined && { price: parseFloat(price) }),
          ...(bonus !== undefined && { bonus: parseInt(bonus) }),
          ...(isPopular !== undefined && { isPopular }),
          ...(isActive !== undefined && { isActive }),
          ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder) }),
          ...(promotionText !== undefined && { promotionText })
        }
      })

      return res.status(200).json(pack)
    } catch (error) {
      console.error('Erreur PUT pack:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  // PATCH - Activer/Désactiver
  if (req.method === 'PATCH') {
    try {
      const { isActive } = req.body
      const pack = await (prisma as any).coinPack.update({
        where: { id },
        data: { isActive }
      })
      return res.status(200).json(pack)
    } catch (error) {
      console.error('Erreur PATCH pack:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  // DELETE - Supprimer
  if (req.method === 'DELETE') {
    try {
      await (prisma as any).coinPack.delete({ where: { id } })
      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Erreur DELETE pack:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}