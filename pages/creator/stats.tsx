"use client"

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import ProfileLayout from '../../components/ProfileLayout'
import { StatCard } from '../../components/ProfileComponents'
import { 
  EyeIcon, 
  HeartIcon, 
  ShoppingBagIcon, 
  CurrencyDollarIcon,
  VideoCameraIcon,
  FilmIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface StatsData {
  totalViews: number
  totalPurchases: number
  totalRevenue: number
  totalLikes: number
  totalVideos: number
  totalSeries: number
  topVideos: Array<{
    id: string
    title: string
    views: number
    purchases: number
    revenue: number
  }>
}

export default function CreatorStats() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<StatsData>({
    totalViews: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    totalLikes: 0,
    totalVideos: 0,
    totalSeries: 0,
    topVideos: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session || (session.user as any)?.role !== 'creator') { 
      router.push('/')
      return 
    }
    fetchStats()
  }, [session, router])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/creator/stats')
      if (!res.ok) throw new Error('Erreur chargement')
      const data = await res.json()
      
      setStats({
        totalViews: data.totalViews || 0,
        totalPurchases: data.totalPurchases || 0,
        totalRevenue: data.totalRevenue || 0,
        totalLikes: data.totalLikes || 0,
        totalVideos: data.totalVideos || 0,
        totalSeries: data.totalSeries || 0,
        topVideos: Array.isArray(data.topVideos) ? data.topVideos : [],
      })
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Impossible de charger les statistiques')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '0'
    return value.toLocaleString()
  }

  if (loading) {
    return (
      <ProfileLayout title="Statistiques" activeTab="stats">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
        </div>
      </ProfileLayout>
    )
  }

  return (
    <ProfileLayout title="Statistiques" subtitle="Analysez vos performances" activeTab="stats">
      <div className="space-y-6">
        {/* Cartes statistiques */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={EyeIcon} label="Vues totales" value={formatNumber(stats.totalViews)} color="text-blue-600" bgColor="bg-blue-100" />
          <StatCard icon={ShoppingBagIcon} label="Achats" value={formatNumber(stats.totalPurchases)} color="text-purple-600" bgColor="bg-purple-100" />
          <StatCard icon={CurrencyDollarIcon} label="Revenus" value={`${formatNumber(stats.totalRevenue)} FCFA`} color="text-[#FF6B35]" bgColor="bg-[#FF6B35]/10" />
          <StatCard icon={HeartIcon} label="Likes" value={formatNumber(stats.totalLikes)} color="text-red-600" bgColor="bg-red-100" />
        </div>

        {/* Résumé contenu */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-[#D4A855]/10 shadow-sm text-center">
            <VideoCameraIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalVideos)}</p>
            <p className="text-xs text-gray-600 font-bold">Vidéos simples</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-[#D4A855]/10 shadow-sm text-center">
            <FilmIcon className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalSeries)}</p>
            <p className="text-xs text-gray-600 font-bold">Séries</p>
          </div>
        </div>

        {/* Top vidéos */}
        {stats.topVideos.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-[#D4A855]/10 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              🏆 Top {stats.topVideos.length} vidéos
            </h3>
            <div className="space-y-2">
              {stats.topVideos.map((video, index) => (
                <div key={video.id} className="flex items-center justify-between p-3 bg-[#EDE4D8] rounded-xl hover:bg-[#E8DCCF] transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-lg font-bold flex-shrink-0 ${
                      index === 0 ? 'text-yellow-500' :
                      index === 1 ? 'text-gray-400' :
                      index === 2 ? 'text-amber-600' : 'text-gray-500'
                    }`}>
                      #{index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{video.title}</p>
                      <p className="text-[10px] text-gray-600 font-bold">
                        {formatNumber(video.views)} vues • {formatNumber(video.purchases)} achats
                      </p>
                    </div>
                  </div>
                  <span className="text-[#FF6B35] font-bold text-sm flex-shrink-0 ml-3">
                    {formatNumber(video.revenue)} FCFA
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aucune donnée */}
        {stats.totalVideos === 0 && stats.totalSeries === 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 text-center border border-[#D4A855]/10 shadow-sm">
            <EyeIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-bold">Aucune statistique disponible</p>
            <p className="text-sm text-gray-500 mt-1">
              Publiez des vidéos pour voir vos performances
            </p>
          </div>
        )}
      </div>
    </ProfileLayout>
  )
}