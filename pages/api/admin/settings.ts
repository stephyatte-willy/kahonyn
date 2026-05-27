import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

// Paramètres par défaut
const defaultSettings = {
  defaultVideoPrice: 100,
  platformCommission: 30,
  minWithdrawal: 5000,
  videoApprovalRequired: true,
  maxVideoDuration: 300,
  maxVideoSize: 100
}

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

  // GET - Récupérer les paramètres
  if (req.method === 'GET') {
    try {
      // Ici tu peux charger les paramètres depuis une table Settings si elle existe
      // Pour l'instant, on retourne les paramètres par défaut
      return res.status(200).json(defaultSettings)
    } catch (error) {
      console.error('Erreur GET settings:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  // POST - Sauvegarder les paramètres
  if (req.method === 'POST') {
    try {
      const settings = req.body
      // Ici tu peux sauvegarder dans une table Settings
      // Pour l'instant, on simule la sauvegarde
      return res.status(200).json({ success: true, settings })
    } catch (error) {
      console.error('Erreur POST settings:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}