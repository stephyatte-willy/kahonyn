import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const plans = await (prisma as any).subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    })

    // Parser les benefits (JSON string → array)
    const formattedPlans = plans.map((plan: any) => ({
      ...plan,
      benefits: plan.benefits ? (typeof plan.benefits === 'string' ? JSON.parse(plan.benefits) : plan.benefits) : []
    }))

    return res.status(200).json(formattedPlans)
  } catch (error) {
    console.error('Erreur subscription-plans:', error)
    return res.status(200).json([])
  }
}