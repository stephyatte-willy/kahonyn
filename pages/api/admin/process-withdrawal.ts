import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  const admin = await prisma.users.findUnique({
    where: { id: session.user.id }
  })

  if (admin?.role !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { withdrawalId } = req.body

    if (!withdrawalId) {
      return res.status(400).json({ error: 'ID de retrait requis' })
    }

    // Vérifier si la table existe
    if (!(prisma as any).withdrawal) {
      return res.status(500).json({ error: 'Table withdrawals non configurée' })
    }

    const withdrawal = await (prisma as any).withdrawal.update({
      where: { id: withdrawalId },
      data: { status: 'processed', processedAt: new Date() }
    })

    return res.status(200).json({ success: true, withdrawal })
  } catch (error) {
    console.error('Erreur process withdrawal:', error)
    return res.status(500).json({ error: 'Erreur serveur', details: String(error) })
  }
}