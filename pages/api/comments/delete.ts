import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  try {
    const { commentId } = req.body
    const userId = (session.user as any).id
    const userRole = (session.user as any).role

    const comment = await (prisma as any).comment.findUnique({
      where: { id: commentId }
    })

    if (!comment) {
      return res.status(404).json({ error: 'Commentaire non trouvé' })
    }

    if (comment.userId !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Non autorisé' })
    }

    await (prisma as any).comment.delete({
      where: { id: commentId }
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Erreur DELETE comment:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}