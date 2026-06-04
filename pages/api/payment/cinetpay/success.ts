import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { tx, transaction_id, payment_token, payment_method } = req.query
    const transactionId = tx as string

    console.log('✅ Retour succès CinetPay:', { transactionId, transaction_id })

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

    // Si déjà complétée, rediriger avec succès
    if (transaction.status === 'completed') {
      return res.redirect(302, `/premium?success=coins_added&amount=${transaction.coins}`)
    }

    // VÉRIFIER LE STATUT DU PAIEMENT AUPRÈS DE CINETPAY
    // Ceci est important pour la sécurité
    try {
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
      console.log('🔍 Vérification statut:', checkData)

      if (checkData.code === '200' && checkData.data?.status === 'ACCEPTED') {
        // Paiement confirmé → créditer les coins
        await (prisma as any).transaction.update({
          where: { id: transactionId },
          data: {
            status: 'completed',
            reference: transaction_id as string || `CP_${Date.now()}`,
            gatewayResponse: JSON.stringify(checkData)
          }
        })

        await (prisma as any).user.update({
          where: { id: transaction.userId },
          data: { coins: { increment: transaction.coins } }
        })

        await (prisma as any).notification.create({
          data: {
            userId: transaction.userId,
            type: 'coins',
            message: `🎉 ${transaction.coins} coins ajoutés via CinetPay !`,
            isRead: false
          }
        })

        return res.redirect(302, `/premium?success=coins_added&amount=${transaction.coins}`)
      } else {
        return res.redirect(302, '/premium?error=payment_not_confirmed')
      }
    } catch (checkError) {
      console.error('Erreur vérification:', checkError)
      return res.redirect(302, '/premium?error=verification_failed')
    }

  } catch (error) {
    console.error('Erreur success CinetPay:', error)
    return res.redirect(302, '/premium?error=server_error')
  }
}