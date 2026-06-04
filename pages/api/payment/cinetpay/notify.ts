import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const body = req.body
    console.log('📩 Notification CinetPay reçue:', JSON.stringify(body))

    const { transaction_id, status } = body

    if (!transaction_id) {
      console.error('❌ ID transaction manquant')
      return res.status(400).json({ error: 'ID transaction manquant' })
    }

    // Trouver la transaction
    const transaction = await (prisma as any).transaction.findUnique({
      where: { id: transaction_id }
    })

    if (!transaction) {
      console.error('❌ Transaction non trouvée:', transaction_id)
      return res.status(404).json({ error: 'Transaction non trouvée' })
    }

    if (transaction.status === 'completed') {
      console.log('⚠️ Transaction déjà complétée')
      return res.status(200).json({ message: 'Déjà traitée' })
    }

    if (status === 'ACCEPTED' || status === 'SUCCESS') {
      // Vérifier auprès de CinetPay
      const auth = Buffer.from(
        `${process.env.CINETPAY_API_KEY}:${process.env.CINETPAY_API_PASSWORD}`
      ).toString('base64')

      const checkResponse = await fetch(
        `https://api-checkout.cinetpay.com/v2/payment/check/${transaction_id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`
          },
          body: JSON.stringify({
            api_key: process.env.CINETPAY_API_KEY,
            site_id: process.env.CINETPAY_SITE_ID,
            transaction_id: transaction_id
          })
        }
      )

      const checkData = await checkResponse.json()

      if (checkData.data?.status === 'ACCEPTED') {
        await (prisma as any).transaction.update({
          where: { id: transaction.id },
          data: { status: 'completed', reference: transaction_id }
        })

        await (prisma as any).user.update({
          where: { id: transaction.userId },
          data: { coins: { increment: transaction.coins } }
        })

        await (prisma as any).notification.create({
          data: {
            userId: transaction.userId,
            type: 'coins',
            message: `🎉 ${transaction.coins} coins ajoutés !`
          }
        })

        console.log(`✅ ${transaction.coins} coins crédités`)
      }
    }

    return res.status(200).json({ message: 'OK' })
  } catch (error) {
    console.error('❌ Erreur notification:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}