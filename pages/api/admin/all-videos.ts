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
    // 1. Récupérer les SÉRIES depuis la table Series avec leurs épisodes
    let seriesList: any[] = []
    let archivedMasterIds: string[] = []

    try {
      seriesList = await (prisma as any).series.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { 
            select: { name: true, phone: true, email: true } 
          },
          episodes: {
            where: { 
              status: { not: 'archived' } 
            },
            orderBy: { createdAt: 'asc' },
          }
        }
      })

      // Formater les épisodes avec episodeNumber
      seriesList = seriesList.map((s: any) => ({
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
          episodeNumber: ep.episodeNumber || index + 1,
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

    // 2. Trouver les IDs des masters archivés
    try {
      const archivedMasters = await (prisma as any).video.findMany({
        where: { status: 'archived', seriesId: { not: null } },
        select: { id: true }
      })
      archivedMasterIds = archivedMasters.map((v: any) => v.id)
    } catch (err) {
      archivedMasterIds = []
    }

    // 3. Récupérer les VIDÉOS SIMPLES
    const simpleVideos = await (prisma as any).video.findMany({
      where: {
        seriesId: null,
        status: { not: 'archived' },
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

    console.log('📊 all-videos:', {
      series: seriesList.length,
      simpleVideos: formattedSimpleVideos.length,
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