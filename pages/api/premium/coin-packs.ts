import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const packs = await (prisma as any).coinPack.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    })

    return res.status(200).json(packs)
  } catch (error) {
    console.error('Erreur coin-packs:', error)
    return res.status(200).json([])
  }
}