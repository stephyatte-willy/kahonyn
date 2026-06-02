// pages/creator/stats.tsx
"use client"

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import ProfileLayout from '../../components/ProfileLayout'
import { StatCard } from '../../components/ProfileComponents'
import { EyeIcon, HeartIcon, ShoppingBagIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'

export default function CreatorStats() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session || session.user?.role !== 'creator') { router.push('/'); return }
    fetchStats()
  }, [session, router])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/creator/stats')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <ProfileLayout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div></div></ProfileLayout>

  return (
<ProfileLayout title="Statistiques" subtitle="Analysez vos performances" activeTab="stats">
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={EyeIcon} label="Vues" value={stats.totalViews?.toLocaleString() || 0} color="text-blue-600" bgColor="bg-blue-100" />
          <StatCard icon={ShoppingBagIcon} label="Achats" value={stats.totalPurchases || 0} color="text-purple-600" bgColor="bg-purple-100" />
          <StatCard icon={CurrencyDollarIcon} label="Revenus" value={`${stats.totalRevenue?.toLocaleString() || 0} FCFA`} color="text-[#FF6B35]" bgColor="bg-[#FF6B35]/10" />
          <StatCard icon={HeartIcon} label="Likes" value={stats.totalLikes || 0} color="text-red-600" bgColor="bg-red-100" />
        </div>

        {stats.topVideos && stats.topVideos.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-[#D4A855]/10 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4">Top vidéos</h3>
            <div className="space-y-2">
              {stats.topVideos.map((video: any, index: number) => (
                <div key={video.id} className="flex items-center justify-between p-3 bg-[#EDE4D8] rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-[#FF6B35]">#{index + 1}</span>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{video.title}</p>
                      <p className="text-[10px] text-gray-600 font-bold">{video.views} vues • {video.purchases} achats</p>
                    </div>
                  </div>
                  <span className="text-[#FF6B35] font-bold">{video.revenue?.toLocaleString()} FCFA</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ProfileLayout>
  )
}