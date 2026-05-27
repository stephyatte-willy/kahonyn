import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'
import cloudinary from '@/lib/cloudinary'
import formidable from 'formidable'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false,
    // Augmenter la limite de taille pour les vidéos (500MB)
    responseLimit: '500mb',
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Vérifier l'authentification
  const session = await getServerSession(req, res, authOptions)
  
  if (!session) {
    return res.status(401).json({ error: 'Non authentifié. Veuillez vous connecter.' })
  }

  // 2. Vérifier que l'utilisateur est créateur ou admin
  if (session.user?.role !== 'creator' && session.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé. Seuls les créateurs peuvent uploader.' })
  }

  // 3. Vérifier la méthode HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' })
  }

  try {
    // 4. Configuration de formidable pour les gros fichiers
    const form = formidable({
      maxFileSize: 500 * 1024 * 1024, // 500MB maximum
      keepExtensions: true,
      multiples: false,
    })

    const [fields, files] = await form.parse(req)
    const file = files.file?.[0]

    // 5. Vérifier la présence du fichier
    if (!file) {
      return res.status(400).json({ error: 'Aucun fichier trouvé. Veuillez sélectionner une vidéo.' })
    }

    // 6. Vérifier le type de fichier
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/mpeg']
    if (!allowedTypes.includes(file.mimetype || '')) {
      return res.status(400).json({ 
        error: 'Format de fichier non supporté. Utilisez MP4, MOV, AVI ou MPEG.' 
      })
    }

    // 7. Upload vers Cloudinary
    console.log(`📤 Upload de la vidéo: ${file.originalFilename} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)
    
    const result = await cloudinary.uploader.upload(file.filepath, {
      resource_type: 'video',
      folder: 'kahonyn/videos',
      chunk_size: 6000000, // 6MB chunks pour les gros fichiers
      eager: [
        { streaming_profile: 'hd', format: 'm3u8' }, // Pour le streaming
        { width: 640, height: 360, crop: 'fill', format: 'jpg' } // Pour la miniature
      ],
      eager_async: true,
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }
      ]
    })

    // 8. Nettoyer le fichier temporaire
    try {
      fs.unlinkSync(file.filepath)
    } catch (err) {
      console.warn('Impossible de supprimer le fichier temporaire:', err)
    }

    console.log(`✅ Upload terminé: ${result.public_id} (${Math.round(result.duration || 0)}s)`)

    // 9. Retourner les informations
    return res.status(200).json({
      success: true,
      url: result.secure_url,
      duration: Math.round(result.duration || 0),
      publicId: result.public_id,
      thumbnail: result.eager?.[1]?.secure_url || null,
      format: result.format,
      bytes: result.bytes
    })

  } catch (error: any) {
    console.error('❌ Erreur upload:', error)
    
    // Gestion des erreurs spécifiques Cloudinary
    if (error.http_code === 401) {
      return res.status(500).json({ error: 'Erreur de configuration Cloudinary. Contactez l\'administrateur.' })
    }
    
    if (error.http_code === 413) {
      return res.status(413).json({ error: 'Fichier trop volumineux. Maximum 500MB.' })
    }
    
    return res.status(500).json({ 
      error: 'Erreur lors de l\'upload de la vidéo',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}