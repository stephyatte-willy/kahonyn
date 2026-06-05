import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Non authentifié' })

  try {
    const { packId, amount, coins, currency } = req.body
    const userId = (session.user as any).id
    const userName = (session.user as any).name || 'Client'
    const userPhone = (session.user as any).phone || ''
    const userEmail = (session.user as any).email || ''

    if (!packId || !amount || !coins) return res.status(400).json({ error: 'Données incomplètes' })

    // 1. Créer la transaction
    const transaction = await (prisma as any).transaction.create({
      data: {
        userId, type: 'coin_purchase', amount: parseFloat(amount), coins: parseInt(coins),
        currency: currency || 'XOF', paymentMethod: 'cinetpay', paymentGateway: 'gateway_cinetpay',
        status: 'pending', description: `Achat de ${coins} coins via CinetPay`
      }
    })

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

    // 2. Données pour l'API CinetPay (SANS site_id)
    const paymentData = {
      amount: parseInt(amount),
      currency: currency || 'XOF',
      transaction_id: transaction.id,
      description: `Achat de ${coins} coins Kahonyn`,
      return_url: `${baseUrl}/api/payment/cinetpay/success?tx=${transaction.id}`,
      notify_url: `${baseUrl}/api/payment/cinetpay/notify`,
      cancel_url: `${baseUrl}/premium?cancelled=true`,
      channels: 'ALL',
      lang: 'fr',
      customer_name: userName || 'Client Kahonyn',
      customer_surname: userName || 'Client',
      customer_email: userEmail || 'client@kahonyn.com',
      customer_phone_number: userPhone || '',
      customer_address: '',
      customer_city: '',
      customer_country: 'CI',
      customer_state: '',
      customer_zip_code: '',
      metadata: JSON.stringify({ transactionId: transaction.id, userId, packId, coins })
    }

    console.log('📤 Envoi paiement CinetPay:', JSON.stringify({ ...paymentData, api_key: '***' }))

    // 3. Authentification Basic Auth
    const auth = Buffer.from(`${process.env.CINETPAY_API_KEY}:${process.env.CINETPAY_API_PASSWORD}`).toString('base64')

    const cinetpayResponse = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${auth}` },
      body: JSON.stringify(paymentData)
    })

    const cinetpayData = await cinetpayResponse.json()
    console.log('📥 Réponse CinetPay:', { code: cinetpayData.code, message: cinetpayData.message })

    if (cinetpayData.code === '201') {
      return res.status(200).json({ success: true, paymentUrl: cinetpayData.data?.payment_url, transactionId: transaction.id })
    } else {
      console.error('❌ Erreur CinetPay:', cinetpayData)
      return res.status(400).json({ error: cinetpayData.message || 'Erreur lors de la création du paiement', details: cinetpayData })
    }
  } catch (error) {
    console.error('❌ Erreur création paiement:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}