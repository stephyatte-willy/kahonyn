import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const packs = await prisma.coinPacks.findMany({
      orderBy: { price: 'asc' }
    })

    return res.status(200).json(packs)
  } catch (error) {
    console.error('Erreur coin-packs:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}