import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  // GET - Récupérer le profil
  if (req.method === 'GET') {
    try {
      const user = await prisma.users.findUnique({
        where: { id: session.user.id },
        include: {
          earnings: {
            where: { status: 'paid' },
            select: { amount: true }
          }
        }
      })

      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' })
      }

      return res.status(200).json({
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        avatar: user.avatar,
        coins: user.coins,
        totalEarnings: user.earnings.reduce((sum, e) => sum + e.amount, 0),
        createdAt: user.createdAt
      })
    } catch (error) {
      console.error('Erreur GET profile:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  // PUT - Mettre à jour le profil
  if (req.method === 'PUT') {
    try {
      const { name, email, bio, avatar } = req.body

      const data: any = {}
      if (name !== undefined) data.name = name
      if (email !== undefined) data.email = email
      if (bio !== undefined) data.bio = bio
      if (avatar !== undefined) data.avatar = avatar

      const user = await prisma.users.update({
        where: { id: session.user.id },
        data
      })

      return res.status(200).json({ success: true, user })
    } catch (error) {
      console.error('Erreur PUT profile:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}