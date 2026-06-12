// pages/api/search.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const { q, filter = 'all', sort = 'relevance' } = req.query
  const searchTerm = (q as string)?.trim()

  if (!searchTerm || searchTerm.length < 1) {
    return res.status(200).json({ results: [], total: 0, query: '' })
  }

  try {
    const results: any[] = []

    // ✅ 1. RECHERCHE DANS LES SÉRIES (table Series)
    console.log('🔍 Recherche dans Series avec:', searchTerm)
    
    const seriesResults = await (prisma as any).series.findMany({
      where: {
        status: 'approved',
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      include: {
        creator: { select: { name: true, phone: true } }
      },
      take: 50
    })

    console.log('📊 Séries trouvées:', seriesResults.length)

    for (const serie of seriesResults) {
      // Récupérer le prix moyen des épisodes
      const episodes = await (prisma as any).video.findMany({
        where: { seriesId: serie.id, status: 'approved' },
        select: { price: true }
      })
      
      const avgPrice = episodes.length > 0 
        ? Math.round(episodes.reduce((sum: number, e: any) => sum + e.price, 0) / episodes.length)
        : 0

      // Calcul de pertinence
      let relevance = 0
      if (serie.title?.toLowerCase() === searchTerm.toLowerCase()) relevance = 100
      else if (serie.title?.toLowerCase().startsWith(searchTerm.toLowerCase())) relevance = 70
      else if (serie.title?.toLowerCase().includes(searchTerm.toLowerCase())) relevance = 40
      else if (serie.description?.toLowerCase().includes(searchTerm.toLowerCase())) relevance = 20

      results.push({
        id: serie.id,
        title: serie.title || 'Sans titre',
        description: serie.description || '',
        coverImage: serie.coverImage || null,
        type: 'series',
        price: serie.price || avgPrice,
        totalEpisodes: episodes.length,
        views: serie.totalViews || 0,
        relevance,
        createdAt: serie.createdAt
      })
    }

    // ✅ 2. RECHERCHE DANS LES VIDÉOS (films sans série)
    console.log('🔍 Recherche dans Video avec:', searchTerm)
    
    const videoResults = await (prisma as any).video.findMany({
      where: {
        seriesId: null,  // Uniquement les vidéos indépendantes (films)
        status: 'approved',
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      include: {
        creator: { select: { name: true, phone: true } }
      },
      take: 50
    })

    console.log('📊 Vidéos trouvées:', videoResults.length)

    for (const video of videoResults) {
      // Calcul de pertinence
      let relevance = 0
      if (video.title?.toLowerCase() === searchTerm.toLowerCase()) relevance = 100
      else if (video.title?.toLowerCase().startsWith(searchTerm.toLowerCase())) relevance = 70
      else if (video.title?.toLowerCase().includes(searchTerm.toLowerCase())) relevance = 40
      else if (video.description?.toLowerCase().includes(searchTerm.toLowerCase())) relevance = 20

      results.push({
        id: video.id,
        title: video.title || 'Sans titre',
        description: video.description || '',
        coverImage: video.thumbnail || null,
        type: 'movie',
        price: video.price || 0,
        duration: video.duration || 0,
        views: video.views || 0,
        relevance,
        createdAt: video.createdAt
      })
    }

    // ✅ 3. TRI PAR PERTINENCE
    results.sort((a, b) => b.relevance - a.relevance)

    // ✅ 4. FILTRAGE PAR TYPE
    let filteredResults = results
    if (filter === 'series') {
      filteredResults = results.filter(r => r.type === 'series')
    } else if (filter === 'movie') {
      filteredResults = results.filter(r => r.type === 'movie')
    }

    // ✅ 5. TRI SPÉCIFIQUE
    if (sort === 'views') {
      filteredResults.sort((a, b) => b.views - a.views)
    } else if (sort === 'price_asc') {
      filteredResults.sort((a, b) => a.price - b.price)
    } else if (sort === 'price_desc') {
      filteredResults.sort((a, b) => b.price - a.price)
    }

    console.log(`✅ Résultat final: ${filteredResults.length} résultats pour "${searchTerm}"`)

    return res.status(200).json({ 
      results: filteredResults,
      total: filteredResults.length,
      query: searchTerm
    })
  } catch (error) {
    console.error('❌ Erreur recherche:', error)
    return res.status(500).json({ error: 'Erreur lors de la recherche' })
  }
}