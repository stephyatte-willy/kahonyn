import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'
import bcrypt from 'bcryptjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  const userRole = (session.user as any)?.role
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Accès non autorisé. Seul un administrateur peut créer un autre administrateur.' })
  }

  const { name, phone, email, password } = req.body

  if (!phone || !password) {
    return res.status(400).json({ error: 'Téléphone et mot de passe requis' })
  }

  const cleanPhone = phone.replace(/\D/g, '')

  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit avoir au moins 6 caractères' })
  }

  const existingUser = await (prisma as any).user.findUnique({
    where: { phone: cleanPhone }
  })

  if (existingUser) {
    return res.status(400).json({ error: 'Ce numéro de téléphone est déjà utilisé' })
  }

  if (email) {
    const existingEmail = await (prisma as any).user.findUnique({
      where: { email }
    })
    if (existingEmail) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' })
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const newAdmin = await (prisma as any).user.create({
    data: {
      name: name || null,
      phone: cleanPhone,
      email: email || null,
      password: hashedPassword,
      role: 'admin',
      coins: 0,
    }
  })

  console.log(`[SECURITY] Nouvel admin créé - Nouvel admin: ${newAdmin.phone}`)

  return res.status(201).json({
    success: true,
    message: 'Administrateur créé avec succès',
    userId: newAdmin.id
  })
}