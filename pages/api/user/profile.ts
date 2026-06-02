// pages/api/user/profile.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  try {
    const userId = (session.user as any).id

    if (req.method === 'GET') {
      const user = await (prisma as any).user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          phone: true,
          name: true,
          email: true,
          role: true,
          bio: true,
          avatar: true,
          coins: true,
          totalEarnings: true,
          createdAt: true,
          // Compter les vidéos, vues, achats...
        }
      })

      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' })
      }

      // Ajouter des valeurs par défaut pour les champs manquants
      const profile = {
        ...user,
        totalVideos: user.totalVideos || 0,
        totalViews: user.totalViews || 0,
        totalPurchases: user.totalPurchases || 0,
        favorites: user.favorites || 0,
      }

      return res.status(200).json(profile)
    }

    if (req.method === 'PUT') {
      const { name, email, bio } = req.body

      const updatedUser = await (prisma as any).user.update({
        where: { id: userId },
        data: {
          name: name?.trim() || null,
          email: email?.trim() || null,
          bio: bio?.trim() || null,
        }
      })

      return res.status(200).json({ success: true, user: updatedUser })
    }

    return res.status(405).json({ error: 'Méthode non autorisée' })
  } catch (error) {
    console.error('Erreur profile:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}