import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // Les mêmes catégories que la barre horizontale
    const allCategories = [
      { id: 'popular', label: 'Populaires', icon: '🔥' },
      { id: 'anime', label: 'Animé', icon: '🎌' },
      { id: 'unpublished', label: 'Inédit', icon: '✨' },
      { id: 'ranking', label: 'Classement', icon: '🏆' },
      { id: 'dubbed', label: 'Doublés', icon: '🎤' },
      { id: 'vip', label: 'VIP', icon: '👑' },
      { id: 'women', label: 'Femmes', icon: '👩' },
      { id: 'men', label: 'Hommes', icon: '👨' },
    ]

    return res.status(200).json(allCategories)
  } catch (error) {
    console.error('Erreur categories:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}