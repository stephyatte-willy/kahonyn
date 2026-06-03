import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ============================================================
  // GET - Récupérer les vidéos pour les utilisateurs
  // ============================================================
  // pages/api/videos.ts - Dans la partie GET
if (req.method === 'GET') {
  try {
    const videos = await (prisma as any).video.findMany({
      where: {
        status: 'approved', // ← Seulement 'approved', pas 'archived'
        seriesId: null
      },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { id: true, name: true, phone: true, avatar: true }
        }
      }
    })

    return res.status(200).json(videos)
  } catch (error) {
    console.error('Erreur GET videos:', error)
    return res.status(500).json({ error: 'Erreur lors de la récupération des vidéos' })
  }
}

  // ============================================================
  // POST - Créer une vidéo (upload par le créateur)
  // ============================================================
  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions)

    if (!session) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const userRole = (session.user as any)?.role
    if (userRole !== 'creator' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Non autorisé. Seuls les créateurs peuvent uploader.' })
    }

    try {
      const {
        title,
        description,
        url,
        duration,
        price,
        thumbnail,
        publicId,
        category
      } = req.body

      // Validations
      if (!title || !url) {
        return res.status(400).json({ error: 'Le titre et l\'URL sont requis' })
      }

      if (!duration || duration <= 0) {
        return res.status(400).json({ error: 'La durée de la vidéo est invalide' })
      }

      console.log('📹 Création vidéo:', { title, url, duration, category })

      // Utiliser prisma.video (singulier) au lieu de prisma.videos
      const video = await (prisma as any).video.create({
        data: {
          title,
          description: description || '',
          url,
          thumbnail: thumbnail || null,
          duration: parseInt(duration) || 0,
          price: parseFloat(price) || 0,
          category: category || 'popular',
          status: 'pending', // En attente de validation par l'admin
          creatorId: (session.user as any).id
        }
      })

      console.log('✅ Vidéo créée:', video.id)

      return res.status(201).json({
        success: true,
        message: 'Vidéo uploadée avec succès. En attente de validation.',
        video
      })
    } catch (error) {
      console.error('❌ Erreur POST video:', error)
      return res.status(500).json({ 
        error: 'Erreur lors de la création de la vidéo',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      })
    }
  }

  // ============================================================
  // PUT - Modifier une vidéo (admin ou créateur propriétaire)
  // ============================================================
  if (req.method === 'PUT') {
    const session = await getServerSession(req, res, authOptions)

    if (!session) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    try {
      const { id, title, description, price, status, category } = req.body

      if (!id) {
        return res.status(400).json({ error: 'ID de la vidéo requis' })
      }

      // Vérifier que la vidéo existe
      const existingVideo = await (prisma as any).video.findUnique({
        where: { id }
      })

      if (!existingVideo) {
        return res.status(404).json({ error: 'Vidéo non trouvée' })
      }

      // Vérifier les droits : admin ou créateur propriétaire
      const userId = (session.user as any).id
      const userRole = (session.user as any).role

      if (userRole !== 'admin' && existingVideo.creatorId !== userId) {
        return res.status(403).json({ error: 'Non autorisé. Vous ne pouvez modifier que vos propres vidéos.' })
      }

      const video = await (prisma as any).video.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(price !== undefined && { price: parseFloat(price) }),
          ...(status !== undefined && { status }),
          ...(category !== undefined && { category }),
          updatedAt: new Date()
        }
      })

      return res.status(200).json({
        success: true,
        message: 'Vidéo modifiée avec succès',
        video
      })
    } catch (error) {
      console.error('Erreur PUT video:', error)
      return res.status(500).json({ error: 'Erreur lors de la modification' })
    }
  }

  // ============================================================
  // DELETE - Supprimer une vidéo (admin seulement)
  // ============================================================
  if (req.method === 'DELETE') {
    const session = await getServerSession(req, res, authOptions)

    if (!session) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const userRole = (session.user as any)?.role
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Non autorisé. Réservé aux administrateurs.' })
    }

    try {
      const { id } = req.body

      if (!id) {
        return res.status(400).json({ error: 'ID de la vidéo requis' })
      }

      // Supprimer les achats liés
      await (prisma as any).purchase.deleteMany({
        where: { videoId: id }
      })

      // Supprimer les likes liés
      await (prisma as any).like.deleteMany({
        where: { videoId: id }
      })

      // Supprimer les commentaires liés
      await (prisma as any).comment.deleteMany({
        where: { videoId: id }
      })

      // Supprimer l'historique de visionnage
      await (prisma as any).watchHistory.deleteMany({
        where: { videoId: id }
      })

      // Supprimer la vidéo
      await (prisma as any).video.delete({
        where: { id }
      })

      return res.status(200).json({
        success: true,
        message: 'Vidéo supprimée avec succès'
      })
    } catch (error) {
      console.error('Erreur DELETE video:', error)
      return res.status(500).json({ error: 'Erreur lors de la suppression' })
    }
  }

  return res.status(405).json({ error: `Méthode ${req.method} non autorisée` })
}