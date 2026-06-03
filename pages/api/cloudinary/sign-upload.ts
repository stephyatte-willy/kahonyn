import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  if (session.user?.role !== 'creator' && session.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  // Avec un preset unsigned, on n'a besoin que du cloudName et du uploadPreset
  return res.status(200).json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    uploadPreset: 'kahonyn_video_upload', // Nom du preset créé dans Cloudinary
    folder: 'kahonyn/videos',
  })
}