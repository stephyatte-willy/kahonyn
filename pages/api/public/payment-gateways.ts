import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // Essayer de récupérer depuis la BDD
    let gateways = await (prisma as any).paymentGateway.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    })

    // Si aucun moyen de paiement en BDD, retourner les valeurs par défaut
    if (!gateways || gateways.length === 0) {
      gateways = [
        { id: 'gateway_wave', name: 'wave', displayName: 'Wave Côte d\'Ivoire', type: 'mobile_money', isActive: true },
        { id: 'gateway_cinetpay', name: 'cinetpay', displayName: 'Carte Bancaire (Visa/Mastercard)', type: 'card', isActive: true },
      ]
    }

    // Ne pas exposer les champs sensibles (config)
    const safeGateways = gateways.map((g: any) => ({
      id: g.id,
      name: g.name,
      displayName: g.displayName,
      type: g.type,
      isActive: g.isActive,
      currency: g.currency,
      logoUrl: g.logoUrl,
    }))

    return res.status(200).json(safeGateways)
  } catch (error) {
    console.error('Erreur payment-gateways:', error)
    // Fallback en cas d'erreur
    return res.status(200).json([
      { id: 'gateway_wave', name: 'wave', displayName: 'Wave Côte d\'Ivoire', type: 'mobile_money', isActive: true },
      { id: 'gateway_cinetpay', name: 'cinetpay', displayName: 'Carte Bancaire (Visa/Mastercard)', type: 'card', isActive: true },
    ])
  }
}