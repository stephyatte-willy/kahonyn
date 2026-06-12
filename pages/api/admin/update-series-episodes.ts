import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  // CORRECTION : Utiliser la session
  const userRole = (session.user as any)?.role
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { seriesId, price, status, category } = req.body

    if (!seriesId) {
      return res.status(400).json({ error: 'ID série requis' })
    }

    // Construire l'objet de mise à jour
    const updateData: any = {}
    if (price !== undefined) updateData.price = parseInt(price)
    if (status !== undefined) updateData.status = status
    if (category !== undefined) updateData.category = category

    // CORRECTION : prisma.video.updateMany avec seriesId
    await (prisma as any).video.updateMany({
      where: { seriesId: seriesId },
      data: updateData
    })

    return res.status(200).json({ 
      success: true,
      message: `${Object.keys(updateData).length} champ(s) mis à jour pour tous les épisodes`
    })
  } catch (error) {
    console.error('Erreur update-series-episodes:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}