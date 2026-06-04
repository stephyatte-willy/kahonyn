import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { tx, plan, duration, coinsBonus } = req.query
    const transactionId = tx as string

    if (!transactionId) {
      return res.redirect(302, '/premium?error=missing_transaction')
    }

    const transaction = await (prisma as any).transaction.findUnique({
      where: { id: transactionId }
    })

    if (!transaction) {
      return res.redirect(302, '/premium?error=transaction_not_found')
    }

    if (transaction.status === 'completed') {
      return res.redirect(302, '/premium?success=subscription_activated')
    }

    // Vérifier le statut auprès de CinetPay
    const auth = Buffer.from(
      `${process.env.CINETPAY_API_KEY}:${process.env.CINETPAY_API_PASSWORD}`
    ).toString('base64')

    const checkResponse = await fetch(
      `https://api-checkout.cinetpay.com/v2/payment/check/${transactionId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({
          api_key: process.env.CINETPAY_API_KEY,
          site_id: process.env.CINETPAY_SITE_ID,
          transaction_id: transactionId
        })
      }
    )

    const checkData = await checkResponse.json()

    if (checkData.code === '200' && checkData.data?.status === 'ACCEPTED') {
      // Mettre à jour la transaction
      await (prisma as any).transaction.update({
        where: { id: transactionId },
        data: { status: 'completed' }
      })

      // Activer l'abonnement
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + parseInt(duration as string || '30'))

      const existingSub = await (prisma as any).subscription.findFirst({
        where: { userId: transaction.userId, status: 'active' }
      })

      if (existingSub) {
        await (prisma as any).subscription.update({
          where: { id: existingSub.id },
          data: { endDate, plan: plan as string }
        })
      } else {
        await (prisma as any).subscription.create({
          data: {
            userId: transaction.userId,
            plan: plan as string || 'monthly',
            status: 'active',
            amount: transaction.amount,
            startDate,
            endDate,
            autoRenew: true
          }
        })
      }

      // Créditer les coins bonus
      if (coinsBonus) {
        await (prisma as any).user.update({
          where: { id: transaction.userId },
          data: { coins: { increment: parseInt(coinsBonus as string) || 0 } }
        })
      }

      return res.redirect(302, '/premium?success=subscription_activated')
    } else {
      return res.redirect(302, '/premium?error=payment_not_confirmed')
    }

  } catch (error) {
    console.error('Erreur subscribe-success:', error)
    return res.redirect(302, '/premium?error=server_error')
  }
}