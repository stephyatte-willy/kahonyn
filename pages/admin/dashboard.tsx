"use client"

import { useEffect, useState } from 'react'
import AdminLayout from './layout'
import {
  VideoCameraIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface Stats {
  totalVideos: number
  pendingVideos: number
  approvedVideos: number
  totalEarnings: number
  totalWithdrawals: number
  totalCreators: number
  totalUsers: number
  monthlyRevenue: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Erreur:', error)
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

  const cards = [
    {
      title: 'Vidéos totales',
      value: stats?.totalVideos || 0,
      icon: VideoCameraIcon,
      color: 'bg-blue-500'
    },
    {
      title: 'En attente',
      value: stats?.pendingVideos || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500'
    },
    {
      title: 'Approuvées',
      value: stats?.approvedVideos || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500'
    },
    {
      title: 'Créateurs',
      value: stats?.totalCreators || 0,
      icon: UserGroupIcon,
      color: 'bg-purple-500'
    },
    {
      title: 'Revenus (FCFA)',
      value: `${(stats?.totalEarnings || 0).toLocaleString()} FCFA`,
      icon: CurrencyDollarIcon,
      color: 'bg-orange-500'
    },
    {
      title: 'Retraits (FCFA)',
      value: `${(stats?.totalWithdrawals || 0).toLocaleString()} FCFA`,
      icon: CurrencyDollarIcon,
      color: 'bg-red-500'
    },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

        {/* Cartes statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
              <div className={`${card.color} p-3 rounded-xl text-white`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-2xl font-bold text-gray-800">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Section rapide */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Actions rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/admin/videos/pending"
              className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition"
            >
              <span className="font-medium">Vidéos en attente ({stats?.pendingVideos || 0})</span>
              <span className="text-yellow-600">→</span>
            </a>
            <a
              href="/admin/finances/withdrawals"
              className="flex items-center justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 transition"
            >
              <span className="font-medium">Demandes de retrait</span>
              <span className="text-red-600">→</span>
            </a>
            <a
              href="/admin/creators"
              className="flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
            >
              <span className="font-medium">Gérer les créateurs</span>
              <span className="text-purple-600">→</span>
            </a>
            <a
              href="/admin/settings"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <span className="font-medium">Paramètres</span>
              <span className="text-gray-600">→</span>
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}