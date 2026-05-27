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

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { userId, isActive } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'UserId requis' })
    }

    const user = await prisma.users.update({
      where: { id: userId },
      data: { isActive }
    })

    return res.status(200).json({ success: true, user })
  } catch (error) {
    console.error('Erreur toggle-active:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}