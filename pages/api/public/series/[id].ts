import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    let series = await (prisma as any).series.findUnique({
      where: { id: id as string },
      include: {
        creator: { select: { name: true, phone: true } },
        episodes: {
          where: { status: 'approved' },
          orderBy: { createdAt: 'asc' },
        }
      }
    })

    if (!series) {
      // Fallback : chercher dans Video
      const videoMaster = await (prisma as any).video.findUnique({
        where: { id: id as string },
        include: {
          creator: { select: { name: true, phone: true } },
          episodes: {
            where: { status: 'approved' },
            orderBy: { createdAt: 'asc' },
          }
        }
      })

      if (videoMaster && videoMaster.episodes?.length > 0) {
        series = {
          id: videoMaster.id,
          title: videoMaster.title,
          description: videoMaster.description || '',
          coverImage: videoMaster.thumbnail || '',
          price: videoMaster.price || 0,
          freeEpisodes: Math.ceil((videoMaster.episodes.length) / 6), // ← FORMULE
          totalEpisodes: videoMaster.episodes.length,
          totalViews: videoMaster.views || 0,
          status: videoMaster.status,
          category: videoMaster.category || 'popular',
          createdAt: videoMaster.createdAt,
          creator: videoMaster.creator,
          episodes: videoMaster.episodes,
          creatorId: videoMaster.creatorId,
        }
      }
    }

    if (!series) {
      return res.status(404).json({ error: 'Série non trouvée' })
    }

    // === CALCUL DES ÉPISODES GRATUITS ===
    const totalEpisodes = series.episodes?.length || 0
    // Formule : 1 épisode gratuit pour 6, minimum 1 si la série a des épisodes
    const freeEpisodesCount = totalEpisodes > 0 ? Math.max(1, Math.ceil(totalEpisodes / 6)) : 0

    // Formater les épisodes
    const formattedEpisodes = (series.episodes || []).map((ep: any, index: number) => ({
      id: ep.id,
      episodeNumber: index + 1,
      title: ep.title || `Épisode ${index + 1}`,
      description: ep.description || '',
      url: ep.url || '',
      thumbnail: ep.thumbnail || '',
      duration: ep.duration || 0,
      price: ep.price || 0,
      views: ep.views || 0,
      purchases: ep.purchasesCount || 0,
      status: ep.status || 'approved',
      isFree: index < freeEpisodesCount, // ← Les premiers épisodes sont gratuits
    }))

    // Incrémenter les vues
    try {
      await (prisma as any).series.update({
        where: { id: series.id },
        data: { totalViews: { increment: 1 } }
      })
    } catch (e) {}

    return res.status(200).json({
      id: series.id,
      title: series.title,
      description: series.description || '',
      coverImage: series.coverImage || '',
      creator: series.creator || { name: 'Créateur', phone: '' },
      totalEpisodes,
      freeEpisodes: freeEpisodesCount,
      totalViews: (series.totalViews || 0) + 1,
      totalPurchases: 0,
      createdAt: series.createdAt || new Date().toISOString(),
      episodes: formattedEpisodes,
    })

  } catch (error) {
    console.error('❌ Erreur API série:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}