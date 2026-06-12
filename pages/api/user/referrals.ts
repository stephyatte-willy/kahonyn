// /api/user/referrals.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  const userId = (session.user as any).id

  if (req.method === 'GET') {
    try {
      const completedReferrals = await (prisma as any).referral.count({
        where: {
          referrerId: userId,
          status: 'completed'
        }
      })

      const pendingReferrals = await (prisma as any).referral.count({
        where: {
          referrerId: userId,
          status: 'pending'
        }
      })

      return res.status(200).json({
        count: completedReferrals,
        pending: pendingReferrals,
        total: completedReferrals + pendingReferrals
      })
    } catch (error) {
      console.error('Erreur referrals:', error)
      return res.status(200).json({ count: 0, pending: 0, total: 0 })
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}