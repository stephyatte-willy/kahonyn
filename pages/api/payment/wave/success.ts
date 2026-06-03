// pages/api/payment/wave/success.ts
// Cette API est appelée après un paiement Wave réussi
// Elle crédite les coins de l'utilisateur

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { tx, simulate } = req.query
    const transactionId = tx as string

    if (!transactionId) {
      return res.redirect(302, '/premium?error=missing_transaction')
    }

    // Trouver la transaction
    const transaction = await (prisma as any).transaction.findUnique({
      where: { id: transactionId }
    })

    if (!transaction) {
      return res.redirect(302, '/premium?error=transaction_not_found')
    }

    // Si la transaction est déjà complétée, ne pas re-créditer
    if (transaction.status === 'completed') {
      return res.redirect(302, '/premium?success=already_credited')
    }

    // Mettre à jour la transaction
    await (prisma as any).transaction.update({
      where: { id: transactionId },
      data: {
        status: 'completed',
        reference: simulate ? `SIM_${Date.now()}` : (req.query.wave_ref as string)
      }
    })

    // Créditer les coins à l'utilisateur
    await (prisma as any).user.update({
      where: { id: transaction.userId },
      data: { coins: { increment: transaction.coins } }
    })

    // Mettre à jour le Purchase lié
    await (prisma as any).purchase.updateMany({
      where: { transactionId: transactionId },
      data: { status: 'completed' }
    })

    // Créer une notification
    await (prisma as any).notification.create({
      data: {
        userId: transaction.userId,
        type: 'coins',
        message: `🎉 ${transaction.coins} coins ont été ajoutés à votre compte !`,
        isRead: false
      }
    })

    // Rediriger vers la page premium avec succès
    return res.redirect(302, '/premium?success=coins_added&amount=' + transaction.coins)
  } catch (error) {
    console.error('Erreur success paiement:', error)
    return res.redirect(302, '/premium?error=server_error')
  }
}