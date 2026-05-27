"use client"

import { useEffect, useState } from 'react'
import AdminLayout from '../layout'
import { UserGroupIcon, CurrencyDollarIcon, VideoCameraIcon } from '@heroicons/react/24/outline'

interface Creator {
  id: string
  name: string
  phone: string
  email: string
  coins: number
  totalEarnings: number
  role: string
  videos: number
  createdAt: string
}

export default function Creators() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCreators()
  }, [])

  const fetchCreators = async () => {
    try {
      const res = await fetch('/api/admin/creators')
      const data = await res.json()
      setCreators(data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (creatorId: string, newRole: string) => {
    try {
      const res = await fetch('/api/admin/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: creatorId, role: newRole })
      })
      if (res.ok) {
        fetchCreators()
        alert('Rôle mis à jour')
      }
    } catch (error) {
      alert('Erreur')
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des créateurs</h1>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Nom</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Téléphone</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Vidéos</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Gains</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Rôle</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {creators.map((creator) => (
                <tr key={creator.id}>
                  <td className="px-4 py-3">{creator.name || '—'}</td>
                  <td className="px-4 py-3">{creator.phone}</td>
                  <td className="px-4 py-3">{creator.videos}</td>
                  <td className="px-4 py-3 font-semibold text-green-600">{creator.totalEarnings.toLocaleString()} FCFA</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      creator.role === 'admin' ? 'bg-red-100 text-red-700' :
                      creator.role === 'creator' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {creator.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={creator.role}
                      onChange={(e) => handleRoleChange(creator.id, e.target.value)}
                      className="text-sm border rounded-lg p-1"
                    >
                      <option value="user">Utilisateur</option>
                      <option value="creator">Créateur</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}