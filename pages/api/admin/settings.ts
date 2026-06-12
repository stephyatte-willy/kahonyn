import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

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

  // CORRECTION : Utiliser (session.user as any).role au lieu de chercher dans la BDD
  const userRole = (session.user as any)?.role
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  // GET - Récupérer les paramètres
  if (req.method === 'GET') {
    try {
      // Essayer de charger depuis la BDD
      const configs = await (prisma as any).siteConfig.findMany()
      
      if (configs && configs.length > 0) {
        const settings: any = {}
        configs.forEach((c: any) => {
          try {
            settings[c.key] = JSON.parse(c.value)
          } catch {
            settings[c.key] = c.value
          }
        })
        return res.status(200).json({ ...defaultSettings, ...settings })
      }
      
      return res.status(200).json(defaultSettings)
    } catch (error) {
      console.error('Erreur GET settings:', error)
      return res.status(200).json(defaultSettings)
    }
  }

  // POST - Sauvegarder les paramètres
  if (req.method === 'POST') {
    try {
      const settings = req.body
      
      // Sauvegarder chaque paramètre
      for (const [key, value] of Object.entries(settings)) {
        await (prisma as any).siteConfig.upsert({
          where: { key },
          update: { value: JSON.stringify(value) },
          create: { key, value: JSON.stringify(value) }
        })
      }
      
      return res.status(200).json({ success: true, settings })
    } catch (error) {
      console.error('Erreur POST settings:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}