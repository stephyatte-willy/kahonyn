import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Vérifier la méthode HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  // 2. Vérifier que l'utilisateur est authentifié
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  // 3. Vérifier que l'utilisateur actuel est ADMIN
  const currentUser = await prisma.users.findUnique({
    where: { id: session.user.id }
  })

  if (currentUser?.role !== 'admin') {
    return res.status(403).json({ error: 'Accès non autorisé. Seul un administrateur peut créer un autre administrateur.' })
  }

  // 4. Récupérer les données du nouvel admin
  const { name, phone, email, password } = req.body

  // 5. Validation des champs
  if (!phone || !password) {
    return res.status(400).json({ error: 'Téléphone et mot de passe requis' })
  }

  const cleanPhone = phone.replace(/[\s\-+]/g, '').slice(-10)

  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit avoir au moins 6 caractères' })
  }

  // 6. Vérifier que le téléphone n'existe pas déjà
  const existingUser = await prisma.users.findUnique({
    where: { phone: cleanPhone }
  })

  if (existingUser) {
    return res.status(400).json({ error: 'Ce numéro de téléphone est déjà utilisé' })
  }

  // 7. Vérifier l'email si fourni
  if (email) {
    const existingEmail = await prisma.users.findUnique({
      where: { email }
    })
    if (existingEmail) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' })
    }
  }

  // 8. Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(password, 10)

  // 9. Créer l'utilisateur avec le rôle ADMIN
  const newAdmin = await prisma.users.create({
    data: {
      name: name || null,
      phone: cleanPhone,
      email: email || null,
      password: hashedPassword,
      role: 'admin',  // ← FORCÉ à admin
      coins: 0,
      isActive: true
    }
  })

  // 10. Journaliser l'action (optionnel)
  console.log(`[SECURITY] Nouvel admin créé par ${currentUser.phone} (${currentUser.id}) - Nouvel admin: ${newAdmin.phone}`)

  return res.status(201).json({
    success: true,
    message: 'Administrateur créé avec succès',
    userId: newAdmin.id
  })
}