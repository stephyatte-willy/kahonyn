// pages/api/video/[id]/stream.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { checkVideoAccess } from '../../../../lib/videoAccess'
import fs from 'fs'
import path from 'path'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  // Vérifier l'accès
  const access = await checkVideoAccess(id as string, req, res)

  if (access.error) {
    return res.status(access.status).json({ 
      error: access.error,
      requireAuth: access.requireAuth,
      requirePurchase: access.requirePurchase,
      video: access.video,
    })
  }

  // Si accès autorisé, streamer la vidéo
  const video = access.video
  const videoPath = path.join(process.cwd(), 'uploads', video.url)

  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ error: 'Fichier vidéo introuvable' })
  }

  const stat = fs.statSync(videoPath)
  const fileSize = stat.size
  const range = req.headers.range

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
    const chunksize = end - start + 1

    const file = fs.createReadStream(videoPath, { start, end })
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    }

    res.writeHead(206, head)
    file.pipe(res)
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    }

    res.writeHead(200, head)
    fs.createReadStream(videoPath).pipe(res)
  }
}