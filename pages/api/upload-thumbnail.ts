import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'
import cloudinary from '../../lib/cloudinary'
import formidable from 'formidable'

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

    const result = await cloudinary.uploader.upload(file.filepath, {
      resource_type: 'image',
      folder: 'kahonyn/thumbnails',
      transformation: [
        { width: 640, height: 360, crop: 'fill' }
      ]
    })

    return res.status(200).json({
      url: result.secure_url,
      publicId: result.public_id
    })

  } catch (error) {
    console.error('Upload thumbnail error:', error)
    return res.status(500).json({ error: 'Erreur upload' })
  }
}