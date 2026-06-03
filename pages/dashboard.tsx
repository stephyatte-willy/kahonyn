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
import toast from 'react-hot-toast'

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
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    fetchDashboardData()
  }, [session, sessionStatus, router])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/user/dashboard')
      if (!res.ok) throw new Error('Erreur chargement')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Erreur dashboard:', error)
      toast.error('Impossible de charger le tableau de bord')
    } finally {
      setLoading(false)
    }
  }

  const isCreator = (session?.user as any)?.role === 'creator'
  const isAdmin = (session?.user as any)?.role === 'admin'
  const displayName = session?.user?.name || (session?.user as any)?.phone || 'Utilisateur'

  const formatNumber = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '0'
    return value.toLocaleString()
  }

  if (loading || sessionStatus === 'loading') {
    return (
      <ProfileLayout title="Dashboard" activeTab="dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
        </div>
      </ProfileLayout>
    )
  }

  if (!session) return null

  return (
    <ProfileLayout 
      title={`Bienvenue, ${displayName}`}
      subtitle={isCreator ? 'Gérez vos vidéos et suivez vos revenus' : isAdmin ? 'Administration' : 'Découvrez et achetez les meilleures mini-séries'}
      activeTab="dashboard" 
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Statistiques */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {isCreator || isAdmin ? (
            <>
              <StatCard icon={VideoCameraIcon} label="Vidéos publiées" value={formatNumber(stats.totalVideos)} color="text-blue-600" bgColor="bg-blue-100" />
              <StatCard icon={EyeIcon} label="Vues totales" value={formatNumber(stats.totalViews)} color="text-green-600" bgColor="bg-green-100" />
              <StatCard icon={CurrencyDollarIcon} label="Gains totaux" value={`${formatNumber(stats.totalEarnings)} FCFA`} color="text-[#FF6B35]" bgColor="bg-[#FF6B35]/10" />
              <StatCard icon={ClockIcon} label="En attente" value={`${formatNumber(stats.pendingEarnings)} FCFA`} color="text-yellow-600" bgColor="bg-yellow-100" />
            </>
          ) : (
            <>
              <StatCard icon={ShoppingBagIcon} label="Vidéos achetées" value={formatNumber(stats.totalPurchases)} color="text-purple-600" bgColor="bg-purple-100" />
              <StatCard icon={CurrencyDollarIcon} label="Mes coins" value={formatNumber(stats.totalCoins)} color="text-[#D4A855]" bgColor="bg-[#D4A855]/10" />
              <StatCard icon={HeartIcon} label="Favoris" value={formatNumber(stats.favorites)} color="text-red-600" bgColor="bg-red-100" />
              <StatCard icon={EyeIcon} label="Vues" value={formatNumber(stats.totalViews)} color="text-green-600" bgColor="bg-green-100" />
            </>
          )}
        </div>

        {/* Actions rapides créateur */}
        {(isCreator || isAdmin) && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-[#D4A855]/10 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4">Actions rapides</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link href="/creator/upload" className="flex flex-col items-center gap-2 p-4 bg-[#EDE4D8] rounded-xl hover:bg-[#E8DCCF] transition text-center group">
                <ArrowUpTrayIcon className="w-6 h-6 text-[#FF6B35] group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-gray-900">Uploader</span>
              </Link>
              <Link href="/creator/videos" className="flex flex-col items-center gap-2 p-4 bg-[#EDE4D8] rounded-xl hover:bg-[#E8DCCF] transition text-center group">
                <VideoCameraIcon className="w-6 h-6 text-[#FF6B35] group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-gray-900">Mes vidéos</span>
              </Link>
              <Link href="/creator/earnings" className="flex flex-col items-center gap-2 p-4 bg-[#EDE4D8] rounded-xl hover:bg-[#E8DCCF] transition text-center group">
                <CurrencyDollarIcon className="w-6 h-6 text-[#FF6B35] group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-gray-900">Gains</span>
              </Link>
              <Link href="/creator/stats" className="flex flex-col items-center gap-2 p-4 bg-[#EDE4D8] rounded-xl hover:bg-[#E8DCCF] transition text-center group">
                <EyeIcon className="w-6 h-6 text-[#FF6B35] group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-gray-900">Stats</span>
              </Link>
            </div>
          </div>
        )}

        {/* Dernières vidéos (créateur) */}
        {(isCreator || isAdmin) && stats.recentVideos && stats.recentVideos.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-[#D4A855]/10 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900">Dernières vidéos</h3>
              <Link href="/creator/videos" className="text-xs font-bold text-[#FF6B35] hover:underline">Voir tout →</Link>
            </div>
            <div className="space-y-2">
              {stats.recentVideos.slice(0, 5).map((video: any) => (
                <div key={video.id} className="flex justify-between items-center p-3 bg-[#EDE4D8] rounded-xl hover:bg-[#E8DCCF] transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <PlayIcon className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{video.title}</p>
                      <p className="text-[10px] text-gray-600 font-bold">{formatNumber(video.views)} vues • {formatNumber(video.purchases)} achats</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold flex-shrink-0 ml-2 ${
                    video.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {video.status === 'approved' ? 'Publiée' : 'En attente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Derniers achats (client) */}
        {!isCreator && !isAdmin && stats.recentPurchases && stats.recentPurchases.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-[#D4A855]/10 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4">Derniers achats</h3>
            <div className="space-y-2">
              {stats.recentPurchases.slice(0, 5).map((purchase: any) => (
                <div key={purchase.id} className="flex justify-between items-center p-3 bg-[#EDE4D8] rounded-xl hover:bg-[#E8DCCF] transition">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">{purchase.video?.title || 'Contenu supprimé'}</p>
                    <p className="text-[10px] text-gray-600 font-bold">
                      Acheté le {purchase.createdAt ? new Date(purchase.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                    </p>
                  </div>
                  <span className="text-[#FF6B35] font-bold text-sm flex-shrink-0 ml-2">{formatNumber(purchase.amount)} FCFA</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aucune activité */}
        {((isCreator || isAdmin) && (!stats.recentVideos || stats.recentVideos.length === 0)) && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 text-center border border-[#D4A855]/10 shadow-sm">
            <VideoCameraIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-bold">Aucune vidéo publiée</p>
            <p className="text-sm text-gray-500 mt-1">Commencez par uploader votre première vidéo</p>
            <Link href="/creator/upload" className="inline-block mt-4 px-5 py-2.5 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white rounded-xl font-bold hover:shadow-lg transition">
              Uploader une vidéo
            </Link>
          </div>
        )}

        {!isCreator && !isAdmin && (!stats.recentPurchases || stats.recentPurchases.length === 0) && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 text-center border border-[#D4A855]/10 shadow-sm">
            <ShoppingBagIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-bold">Aucun achat effectué</p>
            <p className="text-sm text-gray-500 mt-1">Découvrez nos mini-séries et films</p>
            <Link href="/" className="inline-block mt-4 px-5 py-2.5 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white rounded-xl font-bold hover:shadow-lg transition">
              Découvrir du contenu
            </Link>
          </div>
        )}
      </div>
    </ProfileLayout>
  )
}