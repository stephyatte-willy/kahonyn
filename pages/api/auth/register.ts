// pages/api/auth/register.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Activer CORS si nécessaire
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // Vérifier que le body est bien parsé
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { phone, name, email, password, role, bio } = body

    console.log('📝 Données reçues:', { phone, name, email, role })

    // Validation
    if (!phone || !password) {
      return res.status(400).json({ error: 'Téléphone et mot de passe requis' })
    }

    // Nettoyer le téléphone
    const cleanPhone = String(phone).replace(/\D/g, '')
    
    if (cleanPhone.length < 8) {
      return res.status(400).json({ error: 'Numéro de téléphone invalide' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Mot de passe trop court (min 6 caractères)' })
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await (prisma as any).user.findUnique({
      where: { phone: cleanPhone }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'Ce numéro est déjà utilisé' })
    }

    // Vérifier l'email
    if (email && email.trim() !== '') {
      const existingEmail = await (prisma as any).user.findUnique({
        where: { email: email.trim() }
      })
      if (existingEmail) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' })
      }
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Déterminer le rôle
    let userRole = 'client'
    if (role === 'creator') {
      userRole = 'creator'
    }
    if (role === 'admin') {
      userRole = 'client' // On ne permet pas l'inscription admin via le formulaire public
    }

    // Créer l'utilisateur
    const user = await (prisma as any).user.create({
      data: {
        phone: cleanPhone,
        name: name?.trim() || null,
        email: email?.trim() || null,
        password: hashedPassword,
        role: userRole,
        coins: 0,
        bio: bio?.trim() || null,
        totalEarnings: 0,
      }
    })

    console.log('✅ Utilisateur créé:', user.id)

    return res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      userId: user.id,
      role: user.role
    })

  } catch (error) {
    console.error('❌ Erreur inscription:', error)
    return res.status(500).json({ 
      error: 'Erreur interne lors de l\'inscription',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    })
  }
}