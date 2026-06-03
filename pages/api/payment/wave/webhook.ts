// pages/api/payment/wave/webhook.ts
// Cette API est appelée par Wave pour notifier d'un paiement
// 📍 EMPLACEMENT À CONFIGURER DANS LE DASHBOARD WAVE

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // 📍 En production : Vérifier la signature Wave ici
    // const waveSignature = req.headers['wave-signature']
    // if (!verifyWaveSignature(req.body, waveSignature, process.env.WAVE_WEBHOOK_SECRET)) {
    //   return res.status(401).json({ error: 'Signature invalide' })
    // }

    const { reference, status, transaction_id, metadata } = req.body

    console.log('📩 Webhook Wave reçu:', { reference, status, transaction_id })

    // Trouver la transaction par la référence
    const transaction = await (prisma as any).transaction.findFirst({
      where: { id: reference }
    })

    if (!transaction) {
      console.error('Transaction non trouvée:', reference)
      return res.status(404).json({ error: 'Transaction non trouvée' })
    }

    if (status === 'completed' || status === 'success') {
      // Mettre à jour la transaction
      await (prisma as any).transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'completed',
          reference: transaction_id
        }
      })

      // Créditer les coins (si pas déjà fait)
      if (transaction.status !== 'completed') {
        await (prisma as any).user.update({
          where: { id: transaction.userId },
          data: { coins: { increment: transaction.coins } }
        })

        // Mettre à jour le Purchase lié
        await (prisma as any).purchase.updateMany({
          where: { transactionId: transaction.id },
          data: { status: 'completed' }
        })

        // Notification
        await (prisma as any).notification.create({
          data: {
            userId: transaction.userId,
            type: 'coins',
            message: `🎉 ${transaction.coins} coins ajoutés via Wave !`
          }
        })
      }
    } else if (status === 'failed' || status === 'cancelled') {
      await (prisma as any).transaction.update({
        where: { id: transaction.id },
        data: { status: 'failed' }
      })

      await (prisma as any).purchase.updateMany({
        where: { transactionId: transaction.id },
        data: { status: 'failed' }
      })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Erreur webhook Wave:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}