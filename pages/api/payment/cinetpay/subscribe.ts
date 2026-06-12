import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '../../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  try {
    const { plan, amount, name, duration, coinsBonus } = req.body
    const userId = (session.user as any).id
    const userName = (session.user as any).name || 'Client'

    if (!plan || !amount) {
      return res.status(400).json({ error: 'Données incomplètes' })
    }

    // 1. Créer la transaction
    const transaction = await (prisma as any).transaction.create({
      data: {
        userId,
        type: 'subscription',
        amount: parseFloat(amount),
        coins: coinsBonus || 0,
        currency: 'XOF',
        paymentMethod: 'cinetpay',
        paymentGateway: 'gateway_cinetpay',
        status: 'pending',
        description: `Abonnement ${name || plan} via CinetPay`
      }
    })

    // 2. URL de base
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

    // 3. Données pour CinetPay
    const paymentData = {
      amount: parseInt(amount),
      currency: 'XOF',
      api_key: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: transaction.id,
      description: `Abonnement Kahonyn ${name || plan} - ${duration || 30} jours`,
      return_url: `${baseUrl}/api/payment/cinetpay/subscribe-success?tx=${transaction.id}&plan=${plan}&duration=${duration}&coinsBonus=${coinsBonus}`,
      notify_url: `${baseUrl}/api/payment/cinetpay/notify`,
      cancel_url: `${baseUrl}/premium?cancelled=true`,
      channels: 'ALL',
      lang: 'fr',
      customer_name: userName,
      customer_surname: userName,
      customer_email: (session.user as any).email || '',
      customer_phone_number: (session.user as any).phone || '',
      customer_country: 'CI',
      metadata: JSON.stringify({ 
        transactionId: transaction.id, 
        userId, 
        plan,
        type: 'subscription'
      })
    }

    console.log('📤 Envoi abonnement CinetPay:', paymentData.transaction_id)

    // 4. Appeler l'API CinetPay
    const auth = Buffer.from(
      `${process.env.CINETPAY_API_KEY}:${process.env.CINETPAY_API_PASSWORD}`
    ).toString('base64')

    const cinetpayResponse = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(paymentData)
    })

    const cinetpayData = await cinetpayResponse.json()

    if (cinetpayData.code === '201') {
      return res.status(200).json({
        success: true,
        paymentUrl: cinetpayData.data?.payment_url,
        transactionId: transaction.id
      })
    } else {
      return res.status(400).json({ 
        error: cinetpayData.message || 'Erreur lors de la création du paiement' 
      })
    }

  } catch (error) {
    console.error('Erreur abonnement CinetPay:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}