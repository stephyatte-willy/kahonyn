// lib/videoAccess.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from './prisma'

interface VideoAccessResult {
  success?: boolean
  error?: string
  status: number
  requireAuth?: boolean
  requirePurchase?: boolean
  video?: any
  purchase?: any
  series?: any
  episode?: any
  isFree?: boolean
  isOwner?: boolean
  isVip?: boolean
}

export async function checkVideoAccess(
  videoId: string, 
  req: any, 
  res: any
): Promise<VideoAccessResult> {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    // Vérifier si la vidéo existe et est approuvée
    const video = await (prisma as any).video.findUnique({
      where: { id: videoId },
      include: {
        series: true,
      },
    })

    if (!video) {
      return { error: 'Vidéo introuvable', status: 404 }
    }

    if (video.status !== 'approved') {
      return { error: 'Vidéo non disponible', status: 403 }
    }

    // Si c'est une vidéo gratuite (prix = 0)
    if (video.price === 0) {
      return { success: true, video, status: 200 }
    }

    // Vérifier l'authentification
    if (!session) {
      return { 
        error: 'Connectez-vous pour regarder cette vidéo', 
        status: 401, 
        requireAuth: true 
      }
    }

    const userId = (session.user as any).id

    // Vérifier si l'utilisateur a déjà acheté cette vidéo
    const purchase = await (prisma as any).purchase.findFirst({
      where: {
        userId,
        videoId,
        status: 'completed',
      },
    })

    if (purchase) {
      return { success: true, video, purchase, status: 200 }
    }

    // Vérifier si c'est un épisode d'une série achetée
    if (video.seriesId) {
      const seriesPurchase = await (prisma as any).purchase.findFirst({
        where: {
          userId,
          seriesId: video.seriesId,
          status: 'completed',
        },
      })

      if (seriesPurchase) {
        return { success: true, video, purchase: seriesPurchase, status: 200 }
      }
    }

    // Vérifier si l'utilisateur est admin ou le créateur
    const userRole = (session.user as any).role
    if (userRole === 'admin' || video.creatorId === userId) {
      return { success: true, video, isOwner: true, status: 200 }
    }

    // Vérifier le statut VIP/abonnement
    const subscription = await (prisma as any).subscription.findFirst({
      where: {
        userId,
        status: 'active',
        endDate: { gte: new Date() },
      },
    })

    if (subscription) {
      return { success: true, video, isVip: true, status: 200 }
    }

    return { 
      error: 'Achetez cette vidéo pour la regarder', 
      status: 402, 
      requirePurchase: true,
      video: {
        id: video.id,
        title: video.title,
        price: video.price,
        thumbnail: video.thumbnail,
      }
    }
  } catch (error) {
    console.error('Erreur checkVideoAccess:', error)
    return { error: 'Erreur interne', status: 500 }
  }
}

export async function checkSeriesAccess(
  seriesId: string, 
  episodeNumber: number, 
  req: any, 
  res: any
): Promise<VideoAccessResult> {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    const series = await (prisma as any).series.findUnique({
      where: { id: seriesId },
      include: {
        episodes: {
          where: { episodeNumber },
        },
      },
    })

    if (!series || series.episodes.length === 0) {
      return { error: 'Épisode introuvable', status: 404 }
    }

    const episode = series.episodes[0]

    if (episode.status !== 'approved') {
      return { error: 'Épisode non disponible', status: 403 }
    }

    // Premiers épisodes gratuits (configurable)
    const freeEpisodes = series.freeEpisodes || 1
    if (episodeNumber <= freeEpisodes) {
      return { success: true, series, episode, isFree: true, status: 200 }
    }

    if (!session) {
      return { 
        error: 'Connectez-vous pour continuer', 
        status: 401, 
        requireAuth: true 
      }
    }

    const userId = (session.user as any).id

    // Vérifier l'achat de la série
    const purchase = await (prisma as any).purchase.findFirst({
      where: {
        userId,
        seriesId,
        status: 'completed',
      },
    })

    if (purchase) {
      return { success: true, series, episode, purchase, status: 200 }
    }

    // Admin ou créateur
    const userRole = (session.user as any).role
    if (userRole === 'admin' || series.creatorId === userId) {
      return { success: true, series, episode, isOwner: true, status: 200 }
    }

    return {
      error: 'Achetez la série pour débloquer tous les épisodes',
      status: 402,
      requirePurchase: true,
      series: {
        id: series.id,
        title: series.title,
        price: series.price,
        coverImage: series.coverImage,
      }
    }
  } catch (error) {
    console.error('Erreur checkSeriesAccess:', error)
    return { error: 'Erreur interne', status: 500 }
  }
}