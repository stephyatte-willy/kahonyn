import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import formidable from 'formidable'
import cloudinary from '@/lib/cloudinary'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const form = formidable({})
    const [fields, files] = await form.parse(req)
    const file = files.file?.[0]

    if (!file) {
      return res.status(400).json({ error: 'Aucun fichier' })
    }

    // Upload vers Cloudinary
    const result = await cloudinary.uploader.upload(file.filepath, {
      resource_type: 'image',
      folder: 'kahonyn/avatars',
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face' }
      ]
    })

    // Mettre à jour l'utilisateur avec le nouvel avatar
    const updatedUser = await prisma.users.update({
      where: { id: session.user.id },
      data: { avatar: result.secure_url }
    })

    return res.status(200).json({ 
      success: true, 
      url: result.secure_url,
      avatar: result.secure_url
    })

  } catch (error) {
    console.error('Upload avatar error:', error)
    return res.status(500).json({ error: 'Erreur upload' })
  }
}