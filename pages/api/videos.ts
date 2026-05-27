import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ============================================================
  // GET - Récupérer les vidéos pour les utilisateurs
  // ============================================================
  if (req.method === 'GET') {
    try {
      const videos = await prisma.videos.findMany({
        where: {
          status: 'approved',
          isSeries: false,
          parentId: null
        },
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              phone: true,
              avatar: true
            }
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

    if (session.user?.role !== 'creator' && session.user?.role !== 'admin') {
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

      if (!title || !url) {
        return res.status(400).json({ error: 'Le titre et l\'URL sont requis' })
      }

      if (!duration || duration <= 0) {
        return res.status(400).json({ error: 'La durée de la vidéo est invalide' })
      }

      const video = await prisma.videos.create({
        data: {
          title,
          description: description || '',
          url,
          thumbnail: thumbnail || null,
          duration: duration,
          price: price || 0,
          publicId: publicId || null,
          category: category || 'popular',
          isSeries: false,
          status: 'pending',
          creatorId: session.user.id
        }
      })

      return res.status(201).json({
        success: true,
        message: 'Vidéo uploadée avec succès. En attente de validation.',
        video
      })
    } catch (error) {
      console.error('Erreur POST video:', error)
      return res.status(500).json({ error: 'Erreur lors de la création de la vidéo' })
    }
  }

  // ============================================================
  // PUT - Modifier une vidéo (admin seulement)
  // ============================================================
  if (req.method === 'PUT') {
    const session = await getServerSession(req, res, authOptions)

    if (!session) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id }
    })

    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Non autorisé. Réservé aux administrateurs.' })
    }

    try {
      const { id, title, description, price, status, category } = req.body

      if (!id) {
        return res.status(400).json({ error: 'ID de la vidéo requis' })
      }

      const existingVideo = await prisma.videos.findUnique({
        where: { id }
      })

      if (!existingVideo) {
        return res.status(404).json({ error: 'Vidéo non trouvée' })
      }

      const video = await prisma.videos.update({
        where: { id },
        data: {
          title: title || undefined,
          description: description !== undefined ? description : undefined,
          price: price !== undefined ? price : undefined,
          status: status || undefined,
          category: category || undefined,
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

    const user = await prisma.users.findUnique({
      where: { id: session.user.id }
    })

    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Non autorisé. Réservé aux administrateurs.' })
    }

    try {
      const { id } = req.body

      if (!id) {
        return res.status(400).json({ error: 'ID de la vidéo requis' })
      }

      await prisma.purchases.deleteMany({
        where: { videoId: id }
      })

      await prisma.creator_earnings.deleteMany({
        where: { videoId: id }
      })

      await prisma.videos.delete({
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