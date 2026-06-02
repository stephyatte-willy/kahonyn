"use client"

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import ProfileLayout from '../components/ProfileLayout'
import { StatCard } from '../components/ProfileComponents'
import {
  VideoCameraIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  EyeIcon,
  HeartIcon,
  ClockIcon,
  ArrowUpTrayIcon,
  PlayIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface Stats {
  totalVideos?: number
  totalViews?: number
  totalPurchases?: number
  totalEarnings?: number
  pendingEarnings?: number
  totalCoins?: number
  favorites?: number
  recentVideos?: any[]
  recentPurchases?: any[]
}

export default function Dashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      router.push('/login')
      return
    }
    fetchDashboardData()
  }, [session, router])

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
      <ProfileLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
        </div>
      </ProfileLayout>
    )
  }

  return (
    <ProfileLayout 
  title={`Bienvenue, ${session?.user?.name || session?.user?.phone}`}
  subtitle={isCreator ? 'Gérez vos vidéos et suivez vos revenus' : 'Découvrez et achetez les meilleures mini-séries'}
  activeTab="dashboard"
>
      <div className="space-y-6">
        {/* Statistiques */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {isCreator ? (
            <>
              <StatCard icon={VideoCameraIcon} label="Vidéos publiées" value={stats.totalVideos || 0} color="text-blue-600" bgColor="bg-blue-100" />
              <StatCard icon={EyeIcon} label="Vues totales" value={stats.totalViews?.toLocaleString() || 0} color="text-green-600" bgColor="bg-green-100" />
              <StatCard icon={CurrencyDollarIcon} label="Gains totaux" value={`${stats.totalEarnings?.toLocaleString() || 0} FCFA`} color="text-[#FF6B35]" bgColor="bg-[#FF6B35]/10" />
              <StatCard icon={ClockIcon} label="En attente" value={`${stats.pendingEarnings?.toLocaleString() || 0} FCFA`} color="text-yellow-600" bgColor="bg-yellow-100" />
            </>
          ) : (
            <>
              <StatCard icon={ShoppingBagIcon} label="Vidéos achetées" value={stats.totalPurchases || 0} color="text-purple-600" bgColor="bg-purple-100" />
              <StatCard icon={CurrencyDollarIcon} label="Mes coins" value={stats.totalCoins?.toLocaleString() || 0} color="text-[#D4A855]" bgColor="bg-[#D4A855]/10" />
              <StatCard icon={HeartIcon} label="Favoris" value={stats.favorites || 0} color="text-red-600" bgColor="bg-red-100" />
              <StatCard icon={EyeIcon} label="Vues" value={stats.totalViews?.toLocaleString() || 0} color="text-green-600" bgColor="bg-green-100" />
            </>
          )}
        </div>

        {/* Actions rapides créateur */}
        {isCreator && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-[#D4A855]/10 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4">Actions rapides</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link href="/creator/upload" className="flex flex-col items-center gap-2 p-4 bg-[#EDE4D8] rounded-xl hover:bg-[#E8DCCF] transition text-center">
                <ArrowUpTrayIcon className="w-6 h-6 text-[#FF6B35]" />
                <span className="text-xs font-bold text-gray-900">Uploader</span>
              </Link>
              <Link href="/creator/videos" className="flex flex-col items-center gap-2 p-4 bg-[#EDE4D8] rounded-xl hover:bg-[#E8DCCF] transition text-center">
                <VideoCameraIcon className="w-6 h-6 text-[#FF6B35]" />
                <span className="text-xs font-bold text-gray-900">Mes vidéos</span>
              </Link>
              <Link href="/creator/earnings" className="flex flex-col items-center gap-2 p-4 bg-[#EDE4D8] rounded-xl hover:bg-[#E8DCCF] transition text-center">
                <CurrencyDollarIcon className="w-6 h-6 text-[#FF6B35]" />
                <span className="text-xs font-bold text-gray-900">Gains</span>
              </Link>
              <Link href="/creator/stats" className="flex flex-col items-center gap-2 p-4 bg-[#EDE4D8] rounded-xl hover:bg-[#E8DCCF] transition text-center">
                <EyeIcon className="w-6 h-6 text-[#FF6B35]" />
                <span className="text-xs font-bold text-gray-900">Stats</span>
              </Link>
            </div>
          </div>
        )}

        {/* Dernières vidéos / achats */}
        {isCreator && stats.recentVideos && stats.recentVideos.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-[#D4A855]/10 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900">Dernières vidéos</h3>
              <Link href="/creator/videos" className="text-xs font-bold text-[#FF6B35] hover:underline">Voir tout →</Link>
            </div>
            <div className="space-y-2">
              {stats.recentVideos.slice(0, 5).map((video: any) => (
                <div key={video.id} className="flex justify-between items-center p-3 bg-[#EDE4D8] rounded-xl">
                  <div className="flex items-center gap-3">
                    <PlayIcon className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="font-bold text-sm text-gray-900">{video.title}</p>
                      <p className="text-[10px] text-gray-600 font-bold">{video.views} vues • {video.purchases} achats</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                    video.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {video.status === 'approved' ? 'Publiée' : 'En attente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isCreator && stats.recentPurchases && stats.recentPurchases.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-[#D4A855]/10 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4">Derniers achats</h3>
            <div className="space-y-2">
              {stats.recentPurchases.slice(0, 5).map((purchase: any) => (
                <div key={purchase.id} className="flex justify-between items-center p-3 bg-[#EDE4D8] rounded-xl">
                  <div>
                    <p className="font-bold text-sm text-gray-900">{purchase.video?.title}</p>
                    <p className="text-[10px] text-gray-600 font-bold">Acheté le {new Date(purchase.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="text-[#FF6B35] font-bold text-sm">{purchase.amount} FCFA</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ProfileLayout>
  )
}