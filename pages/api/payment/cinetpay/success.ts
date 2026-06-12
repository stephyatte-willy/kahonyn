import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' })

  try {
    const { tx, transaction_id } = req.query
    const transactionId = tx as string
    if (!transactionId) return res.redirect(302, '/premium?error=missing_transaction')

    const transaction = await (prisma as any).transaction.findUnique({ where: { id: transactionId } })
    if (!transaction) return res.redirect(302, '/premium?error=transaction_not_found')
    if (transaction.status === 'completed') return res.redirect(302, `/premium?success=coins_added&amount=${transaction.coins}`)

    // Vérifier le statut auprès de CinetPay
    const auth = Buffer.from(`${process.env.CINETPAY_API_KEY}:${process.env.CINETPAY_API_PASSWORD}`).toString('base64')
    const checkResponse = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${auth}` },
      body: JSON.stringify({ transaction_id: transactionId })
    })
    const checkData = await checkResponse.json()

    if (checkData.code === '200' && checkData.data?.status === 'ACCEPTED') {
      await (prisma as any).transaction.update({ where: { id: transactionId }, data: { status: 'completed', reference: (transaction_id as string) || `CP_${Date.now()}`, gatewayResponse: JSON.stringify(checkData) } })
      await (prisma as any).user.update({ where: { id: transaction.userId }, data: { coins: { increment: transaction.coins } } })
      await (prisma as any).notification.create({ data: { userId: transaction.userId, type: 'coins', message: `🎉 ${transaction.coins} coins ajoutés via CinetPay !` } })
      return res.redirect(302, `/premium?success=coins_added&amount=${transaction.coins}`)
    } else {
      return res.redirect(302, '/premium?error=payment_not_confirmed')
    }
  } catch (error) {
    console.error('Erreur success:', error)
    return res.redirect(302, '/premium?error=server_error')
  }
}