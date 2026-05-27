"use client"

import { useEffect, useState } from 'react'
import AdminLayout from '../layout'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'

interface Earning {
  id: string
  amount: number
  status: string
  createdAt: string
  video: { title: string }
  creator: { name: string; phone: string }
}

export default function Earnings() {
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchEarnings()
  }, [])

  const fetchEarnings = async () => {
    try {
      const res = await fetch('/api/admin/earnings')
      if (!res.ok) throw new Error('Erreur chargement')
      const data = await res.json()
      setEarnings(data.earnings || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Erreur:', err)
      setError('Impossible de charger les données')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Gains des créateurs</h1>
          <div className="bg-green-100 rounded-xl px-4 py-2">
            <span className="text-green-700 font-bold">{total.toLocaleString()} FCFA</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {earnings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucun gain enregistré</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Créateur</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Vidéo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Montant</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Statut</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {earnings.map((earning) => (
                  <tr key={earning.id}>
                    <td className="px-4 py-3">{earning.creator?.name || earning.creator?.phone}</td>
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
    </AdminLayout>
  )
}