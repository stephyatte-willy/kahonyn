import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Tous les champs sont requis' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit avoir au moins 6 caractères' })
    }

    // CORRECTION : prisma.user (singulier)
    const userId = (session.user as any).id
    const user = await (prisma as any).user.findUnique({
      where: { id: userId }
    })

    if (!user || !user.password) {
      return res.status(400).json({ error: 'Utilisateur non trouvé ou connexion Google' })
    }

    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // CORRECTION : prisma.user.update
    await (prisma as any).user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    return res.status(200).json({ success: true, message: 'Mot de passe modifié avec succès' })
  } catch (error) {
    console.error('Erreur change-password:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}