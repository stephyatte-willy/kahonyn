import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { reference, status, transactionId } = req.body

    const transaction = await prisma.coinTransactions.findUnique({
      where: { id: reference },
      include: { pack: true }
    })

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction non trouvée' })
    }

    if (status === 'completed') {
      await prisma.coinTransactions.update({
        where: { id: transaction.id },
        data: {
          status: 'completed',
          transactionId,
          completedAt: new Date()
        }
      })

      await prisma.users.update({
        where: { id: transaction.userId },
        data: { coins: { increment: transaction.amount } }
      })
    } else {
      await prisma.coinTransactions.update({
        where: { id: transaction.id },
        data: { status: 'failed' }
      })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Erreur webhook:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}