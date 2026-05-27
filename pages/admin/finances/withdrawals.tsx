"use client"

import { useEffect, useState } from 'react'
import AdminLayout from '../layout'

interface Withdrawal {
  id: string
  amount: number
  phone: string
  status: string
  createdAt: string
  creator: { name: string; phone: string }
}

export default function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  const fetchWithdrawals = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/withdrawals')
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Erreur ${res.status}`)
      }
      const data = await res.json()
      setWithdrawals(data.withdrawals || [])
      setTotal(data.total || 0)
    } catch (err: any) {
      console.error('Erreur:', err)
      setError(err.message || 'Impossible de charger les données')
    } finally {
      setLoading(false)
    }
  }

  const handleProcess = async (id: string) => {
    try {
      const res = await fetch('/api/admin/process-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId: id })
      })
      if (res.ok) {
        fetchWithdrawals()
        alert('Retrait traité')
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur')
      }
    } catch (error) {
      alert('Erreur réseau')
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
          <h1 className="text-2xl font-bold text-gray-800">Demandes de retrait</h1>
          <div className="bg-red-100 rounded-xl px-4 py-2">
            <span className="text-red-700 font-bold">{total.toLocaleString()} FCFA</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {withdrawals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucune demande de retrait</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Créateur</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Téléphone</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Montant</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Statut</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id}>
                    <td className="px-4 py-3">{withdrawal.creator?.name || withdrawal.creator?.phone}</td>
                    <td className="px-4 py-3">{withdrawal.phone}</td>
                    <td className="px-4 py-3 font-semibold text-red-600">{withdrawal.amount.toLocaleString()} FCFA</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        withdrawal.status === 'processed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {withdrawal.status === 'processed' ? 'Traité' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{new Date(withdrawal.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {withdrawal.status === 'pending' && (
                        <button
                          onClick={() => handleProcess(withdrawal.id)}
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                        >
                          Traiter
                        </button>
                      )}
                    </td>
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