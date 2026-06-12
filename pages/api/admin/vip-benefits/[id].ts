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

  // PUT - Modifier un avantage
  if (req.method === 'PUT') {
    try {
      const { title, description, icon, isActive, sortOrder } = req.body
      
      const benefit = await (prisma as any).vipBenefit.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(icon !== undefined && { icon }),
          ...(isActive !== undefined && { isActive }),
          ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder) })
        }
      })

      return res.status(200).json(benefit)
    } catch (error) {
      console.error('Erreur PUT benefit:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  // PATCH - Activer/Désactiver
  if (req.method === 'PATCH') {
    try {
      const { isActive } = req.body
      const benefit = await (prisma as any).vipBenefit.update({
        where: { id },
        data: { isActive }
      })
      return res.status(200).json(benefit)
    } catch (error) {
      console.error('Erreur PATCH benefit:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  // DELETE - Supprimer
  if (req.method === 'DELETE') {
    try {
      await (prisma as any).vipBenefit.delete({ where: { id } })
      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Erreur DELETE benefit:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}