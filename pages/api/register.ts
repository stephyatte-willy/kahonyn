import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { phone, name, email, password, role, bio } = req.body

    if (!phone || !password) {
      return res.status(400).json({ error: 'Téléphone et mot de passe requis' })
    }

    const cleanPhone = phone.replace(/[\s\-+]/g, '').slice(-10)

    if (password.length < 6) {
      return res.status(400).json({ error: 'Mot de passe trop court (min 6 caractères)' })
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.users.findUnique({
      where: { phone: cleanPhone }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'Ce numéro est déjà utilisé' })
    }

    // Vérifier l'email si fourni
    if (email) {
      const existingEmail = await prisma.users.findUnique({
        where: { email }
      })
      if (existingEmail) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' })
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Déterminer le rôle (jamais admin via formulaire public)
    let userRole = 'user'
    if (role === 'creator') {
      userRole = 'creator'
    }

    const user = await prisma.users.create({
      data: {
        phone: cleanPhone,
        name: name || null,
        email: email || null,
        password: hashedPassword,
        role: userRole,
        coins: 0,
        bio: bio || null
      }
    })

    return res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      userId: user.id,
      role: user.role
    })

  } catch (error) {
    console.error('Erreur inscription:', error)
    return res.status(500).json({ error: 'Erreur interne' })
  }
}