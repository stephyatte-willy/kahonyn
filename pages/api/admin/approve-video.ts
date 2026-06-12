import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { videoId, price, category, categories } = req.body

    if (!videoId) {
      return res.status(400).json({ error: 'ID vidéo requis' })
    }

    // Gérer les catégories multiples (séparées par des virgules)
    const categoryString = Array.isArray(categories) 
      ? categories.join(',') 
      : category || 'popular'

    await (prisma as any).video.update({
      where: { id: videoId },
      data: {
        status: 'approved',
        price: parseInt(price) || 100,
        category: categoryString,
        tags: categoryString, // Stocker aussi dans tags pour la recherche
      }
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Erreur approve:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}