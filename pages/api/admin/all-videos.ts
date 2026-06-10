// /api/admin/all-videos.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  const userRole = (session.user as any)?.role
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // 1. Récupérer les IDs des masters archivés (ceux qui sont des masters de série)
    const archivedMasters = await (prisma as any).video.findMany({
      where: {
        status: 'archived',
        seriesId: { not: null }
      },
      select: { id: true, seriesId: true }
    })
    
    const archivedMasterIds = archivedMasters.map((v: any) => v.id)
    const masterSeriesIds = archivedMasters.map((v: any) => v.seriesId)

    // 2. Récupérer les SÉRIES (exclure celles qui n'ont que le master comme épisode)
    let seriesList: any[] = []
    
    try {
      const allSeries = await (prisma as any).series.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { 
            select: { name: true, phone: true, email: true } 
          },
          episodes: {
            where: { 
              status: 'approved',  // ← Exclure les masters archivés
              id: { notIn: archivedMasterIds }  // ← Exclure explicitement les masters
            },
            orderBy: { createdAt: 'asc' },
          }
        }
      })

      // Ne garder que les séries qui ont au moins 1 épisode valide
      seriesList = allSeries
        .filter((s: any) => (s.episodes || []).length > 0)
        .map((s: any) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          thumbnail: s.coverImage || null,
          url: s.episodes?.[0]?.url || '',
          duration: s.episodes?.reduce((sum: number, ep: any) => sum + (ep.duration || 0), 0) || 0,
          price: s.price || s.episodes?.[0]?.price || 0,
          views: s.totalViews || 0,
          purchases: 0,
          status: s.status,
          category: s.category || 'popular',
          isSeries: true,
          parentId: null,
          episodeNumber: null,
          creatorId: s.creatorId,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          creator: s.creator,
          episodes: (s.episodes || []).map((ep: any, index: number) => ({
            id: ep.id,
            title: ep.title || `Épisode ${index + 1}`,
            episodeNumber: index + 1,  // ← Recompter les épisodes
            duration: ep.duration || 0,
            price: ep.price || 0,
            url: ep.url || '',
            thumbnail: ep.thumbnail || null,
            views: ep.views || 0,
            purchases: ep.purchasesCount || 0,
            status: ep.status || 'approved',
            description: ep.description || '',
          }))
        }))
    } catch (err) {
      console.error('Table Series inaccessible:', err)
      seriesList = []
    }

    // 3. Récupérer les VIDÉOS SIMPLES (exclure les masters)
    const simpleVideos = await (prisma as any).video.findMany({
      where: {
        seriesId: null,
        status: { not: 'archived' },
        // Exclure les masters (ceux qui sont liés à une série)
        id: archivedMasterIds.length > 0 ? { notIn: archivedMasterIds } : undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { name: true, phone: true, email: true } }
      }
    })

    // Formater les vidéos simples
    const formattedSimpleVideos = simpleVideos.map((v: any) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      thumbnail: v.thumbnail,
      url: v.url,
      duration: v.duration,
      price: v.price,
      views: v.views,
      purchases: v.purchasesCount || 0,
      status: v.status,
      category: v.category,
      isSeries: false,
      parentId: null,
      episodeNumber: null,
      creatorId: v.creatorId,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
      creator: v.creator,
      episodes: [],
    }))

    console.log('📊 all-videos (master exclus):', {
      series: seriesList.length,
      simpleVideos: formattedSimpleVideos.length,
      mastersExcluded: archivedMasterIds.length
    })

    return res.status(200).json({
      series: seriesList,
      simpleVideos: formattedSimpleVideos
    })
  } catch (error) {
    console.error('Erreur all-videos:', error)
    return res.status(200).json({ series: [], simpleVideos: [] })
  }
}