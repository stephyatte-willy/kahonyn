import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session || (session.user as any)?.role !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { id, name, email, coins } = req.body

    if (!id) {
      return res.status(400).json({ error: 'ID utilisateur requis' })
    }

    await (prisma as any).user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(coins !== undefined && { coins: parseInt(coins) }),
      }
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Erreur update-user:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}