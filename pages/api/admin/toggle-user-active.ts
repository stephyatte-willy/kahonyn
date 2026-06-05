import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session || (session.user as any)?.role !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { userId, isActive } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'ID utilisateur requis' })
    }

    // Convertir isActive en booléen
    const newStatus = isActive === true || isActive === 'true' || isActive === 1

    const updated = await (prisma as any).user.update({
      where: { id: userId },
      data: { isActive: newStatus },
      select: { id: true, isActive: true, name: true, phone: true }
    })

    return res.status(200).json({ 
      success: true, 
      isActive: updated.isActive,
      message: updated.isActive ? 'Utilisateur activé' : 'Utilisateur désactivé'
    })
  } catch (error: any) {
    console.error('Erreur toggle-active:', error)
    
    // Si le champ n'existe pas
    if (error.code === 'P2005' || error.message?.includes('Unknown field')) {
      return res.status(500).json({ 
        error: 'Le champ isActive n\'existe pas dans la base de données. Exécutez : npx prisma db push' 
      })
    }
    
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}