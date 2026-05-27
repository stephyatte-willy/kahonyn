"use client"

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import UserLayout from '../../components/UserLayout'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'
import toast, { Toaster } from 'react-hot-toast'

interface Earning {
  id: string
  amount: number
  status: string
  createdAt: string
  video: { title: string }
}

export default function CreatorEarnings() {
  const { data: session } = useSession()
  const router = useRouter()
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.role !== 'creator') {
      router.push('/')
      return
    }
    fetchEarnings()
  }, [session, router])

  const fetchEarnings = async () => {
    try {
      const res = await fetch('/api/creator/earnings')
      const data = await res.json()
      setEarnings(data.earnings)
      setTotal(data.total)
    } catch (error) {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mes gains</h1>
          <p className="text-gray-500 text-sm mt-1">Suivez vos revenus générés par vos vidéos</p>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-6 text-white">
          <p className="text-sm opacity-90">Gain total</p>
          <p className="text-3xl font-bold">{total.toLocaleString()} FCFA</p>
          <p className="text-xs opacity-75 mt-2">Commission plateforme: 30%</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {earnings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucun gain enregistré</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Vidéo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Montant</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Statut</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {earnings.map((earning) => (
                  <tr key={earning.id}>
                    <td className="px-4 py-3">{earning.video?.title || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-green-600">{earning.amount.toLocaleString()} FCFA</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        earning.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {earning.status === 'paid' ? 'Payé' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{new Date(earning.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </UserLayout>
  )
}