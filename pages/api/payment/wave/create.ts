// pages/api/payment/wave/create.ts
// Cette API crée une transaction et retourne l'URL de paiement Wave
// 🚀 EN PRODUCTION : Remplacez l'URL simulée par l'URL réelle de l'API Wave

import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  try {
    const { packId, amount, coins } = req.body
    const userId = (session.user as any).id

    if (!packId || !amount || !coins) {
      return res.status(400).json({ error: 'Données incomplètes' })
    }

    // 1. Créer la transaction avec statut "pending"
    const transaction = await (prisma as any).transaction.create({
      data: {
        userId,
        type: 'coin_purchase',
        amount: parseFloat(amount),
        coins: parseInt(coins),
        currency: 'XOF',
        paymentMethod: 'wave',
        status: 'pending',
        description: `Achat de ${coins} coins via Wave`
      }
    })

    // 2. Créer aussi un achat dans la table Purchase
    const purchase = await (prisma as any).purchase.create({
      data: {
        userId,
        amount: parseFloat(amount),
        coinsUsed: parseInt(coins),
        status: 'pending',
        paymentMethod: 'wave',
        transactionId: transaction.id
      }
    })

    // 3. URL de l'API Wave (À REMPLACER par la vraie URL en production)
    // 📍 EMPLACEMENT DE L'API WAVE : Ici vous appellerez l'API Wave
    // Exemple : POST https://api.wave.com/v1/checkout/sessions
    
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    // ============================================================
    // 🔧 SIMULATION (À REMPLACER PAR L'APPEL RÉEL À L'API WAVE)
    // ============================================================
    // En production, remplacez ce bloc par :
    //
    // const waveResponse = await fetch('https://api.wave.com/v1/checkout/sessions', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.WAVE_SECRET_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     amount: amount,
    //     currency: 'XOF',
    //     success_url: `${baseUrl}/api/payment/wave/success?tx=${transaction.id}`,
    //     cancel_url: `${baseUrl}/premium`,
    //     error_url: `${baseUrl}/premium`
    //   })
    // })
    // const waveData = await waveResponse.json()
    // const paymentUrl = waveData.checkout_url
    // ============================================================

    // Pour l'instant, on simule un paiement réussi après redirection
    const successUrl = `${baseUrl}/api/payment/wave/success?tx=${transaction.id}&simulate=true`

    return res.status(200).json({
      success: true,
      paymentUrl: successUrl, // ← En production, ce sera waveData.checkout_url
      transactionId: transaction.id,
      purchaseId: purchase.id
    })
  } catch (error) {
    console.error('Erreur création paiement:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}