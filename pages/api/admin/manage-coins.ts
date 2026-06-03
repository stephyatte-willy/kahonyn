import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  const adminRole = (session.user as any)?.role
  if (adminRole !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé. Réservé aux administrateurs.' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { userId, action, amount, reason } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'ID utilisateur requis' })
    }

    if (!action || !['credit', 'debit', 'set'].includes(action)) {
      return res.status(400).json({ error: 'Action invalide. Utilisez : credit, debit, set' })
    }

    if (amount === undefined || amount === null || amount < 0) {
      return res.status(400).json({ error: 'Montant invalide' })
    }

    // Vérifier que l'utilisateur existe
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: { id: true, coins: true, name: true, phone: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    let newCoins: number
    const currentCoins = user.coins || 0

    switch (action) {
      case 'credit':
        newCoins = currentCoins + parseInt(amount)
        await (prisma as any).user.update({
          where: { id: userId },
          data: { coins: { increment: parseInt(amount) } }
        })
        break

      case 'debit':
        if (parseInt(amount) > currentCoins) {
          return res.status(400).json({ error: 'Solde insuffisant' })
        }
        newCoins = currentCoins - parseInt(amount)
        await (prisma as any).user.update({
          where: { id: userId },
          data: { coins: { decrement: parseInt(amount) } }
        })
        break

      case 'set':
        newCoins = parseInt(amount)
        await (prisma as any).user.update({
          where: { id: userId },
          data: { coins: parseInt(amount) }
        })
        break

      default:
        return res.status(400).json({ error: 'Action non supportée' })
    }

    return res.status(200).json({
      success: true,
      message: `${amount} coins ${action === 'credit' ? 'crédités' : action === 'debit' ? 'débités' : 'définis'}`,
      previousBalance: currentCoins,
      newBalance: newCoins,
      action: action
    })
  } catch (error) {
    console.error('Erreur manage-coins:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}