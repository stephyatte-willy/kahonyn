"use client"

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import UserLayout from '../components/UserLayout'
import {
  VideoCameraIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  EyeIcon,
  HeartIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface Stats {
  totalVideos?: number
  totalViews?: number
  totalPurchases?: number
  totalEarnings?: number
  pendingEarnings?: number
  totalCoins?: number
  favorites?: number  // ← AJOUTER CETTE LIGNE
  recentVideos?: any[]
  recentPurchases?: any[]
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/user/dashboard')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const isCreator = session?.user?.role === 'creator'

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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Bienvenue, {session?.user?.name || session?.user?.phone}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isCreator 
              ? 'Gérez vos vidéos et suivez vos revenus'
              : 'Découvrez et achetez les meilleures mini-séries'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isCreator ? (
            <>
              <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <VideoCameraIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalVideos || 0}</p>
                  <p className="text-sm text-gray-500">Vidéos publiées</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-xl">
                  <EyeIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalViews?.toLocaleString() || 0}</p>
                  <p className="text-sm text-gray-500">Vues totales</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
                <div className="bg-orange-100 p-3 rounded-xl">
                  <CurrencyDollarIcon className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{stats.totalEarnings?.toLocaleString() || 0} FCFA</p>
                  <p className="text-sm text-gray-500">Gains totaux</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
                <div className="bg-yellow-100 p-3 rounded-xl">
                  <ClockIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingEarnings?.toLocaleString() || 0} FCFA</p>
                  <p className="text-sm text-gray-500">En attente</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
                <div className="bg-purple-100 p-3 rounded-xl">
                  <ShoppingBagIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalPurchases || 0}</p>
                  <p className="text-sm text-gray-500">Vidéos achetées</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
                <div className="bg-amber-100 p-3 rounded-xl">
                  <CurrencyDollarIcon className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{stats.totalCoins?.toLocaleString() || 0}</p>
                  <p className="text-sm text-gray-500">Mes coins</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
                <div className="bg-red-100 p-3 rounded-xl">
                  <HeartIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.favorites || 0}</p>
                  <p className="text-sm text-gray-500">Favoris</p>
                </div>
              </div>
            </>
          )}
        </div>

        {isCreator && stats.recentVideos && stats.recentVideos.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Dernières vidéos</h2>
            <div className="space-y-3">
              {stats.recentVideos.slice(0, 5).map((video: any) => (
                <div key={video.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{video.title}</p>
                    <p className="text-sm text-gray-500">{video.views} vues • {video.purchases} achats</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    video.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {video.status === 'approved' ? 'Publiée' : 'En attente'}
                  </span>
                </div>
              ))}
            </div>
            <Link href="/creator/videos" className="text-orange-500 text-sm mt-3 inline-block hover:underline">
              Voir toutes mes vidéos →
            </Link>
          </div>
        )}

        {!isCreator && stats.recentPurchases && stats.recentPurchases.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Derniers achats</h2>
            <div className="space-y-3">
              {stats.recentPurchases.slice(0, 5).map((purchase: any) => (
                <div key={purchase.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{purchase.video?.title}</p>
                    <p className="text-sm text-gray-500">Acheté le {new Date(purchase.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="text-orange-500 font-semibold">{purchase.amount} FCFA</span>
                </div>
              ))}
            </div>
            <Link href="/user/purchases" className="text-orange-500 text-sm mt-3 inline-block hover:underline">
              Voir tous mes achats →
            </Link>
          </div>
        )}
      </div>
    </UserLayout>
  )
}