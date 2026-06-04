"use client"

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import ProfileLayout from '../components/ProfileLayout'
import { StatCard } from '../components/ProfileComponents'
import { VideoCameraIcon, CurrencyDollarIcon, ShoppingBagIcon, EyeIcon, HeartIcon, ClockIcon, ArrowUpTrayIcon, PlayIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Stats {
  totalVideos?: number; totalViews?: number; totalPurchases?: number; totalEarnings?: number
  pendingEarnings?: number; totalCoins?: number; favorites?: number
  recentVideos?: any[]; recentPurchases?: any[]
}

export default function Dashboard() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!session) { router.push('/login'); return }
    fetchDashboardData()
  }, [session, sessionStatus, router])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/user/dashboard')
      if (!res.ok) throw new Error('Erreur chargement')
      setStats(await res.json())
    } catch (error) { toast.error('Impossible de charger le tableau de bord') } finally { setLoading(false) }
  }

  const isCreator = (session?.user as any)?.role === 'creator'
  const isAdmin = (session?.user as any)?.role === 'admin'
  const displayName = session?.user?.name || (session?.user as any)?.phone || 'Utilisateur'
  const formatNumber = (value: number | undefined | null): string => value === undefined || value === null ? '0' : value.toLocaleString()

  if (loading || sessionStatus === 'loading') return <ProfileLayout title="Dashboard" activeTab="dashboard"><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div></div></ProfileLayout>
  if (!session) return null

  return (
    <ProfileLayout title={`Bienvenue, ${displayName}`} subtitle={isCreator ? 'Gérez vos vidéos et suivez vos revenus' : isAdmin ? 'Administration' : 'Découvrez et achetez les meilleures mini-séries'} activeTab="dashboard">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {isCreator || isAdmin ? (
            <>
              <StatCard icon={VideoCameraIcon} label="Vidéos publiées" value={formatNumber(stats.totalVideos)} color="text-blue-400" bgColor="bg-blue-500/10" />
              <StatCard icon={EyeIcon} label="Vues totales" value={formatNumber(stats.totalViews)} color="text-green-400" bgColor="bg-green-500/10" />
              <StatCard icon={CurrencyDollarIcon} label="Gains totaux" value={`${formatNumber(stats.totalEarnings)} FCFA`} color="text-[#FF6B35]" bgColor="bg-[#FF6B35]/10" />
              <StatCard icon={ClockIcon} label="En attente" value={`${formatNumber(stats.pendingEarnings)} FCFA`} color="text-yellow-400" bgColor="bg-yellow-500/10" />
            </>
          ) : (
            <>
              <StatCard icon={ShoppingBagIcon} label="Vidéos achetées" value={formatNumber(stats.totalPurchases)} color="text-purple-400" bgColor="bg-purple-500/10" />
              <StatCard icon={CurrencyDollarIcon} label="Mes coins" value={formatNumber(stats.totalCoins)} color="text-[#D4A855]" bgColor="bg-[#D4A855]/10" />
              <StatCard icon={HeartIcon} label="Favoris" value={formatNumber(stats.favorites)} color="text-red-400" bgColor="bg-red-500/10" />
              <StatCard icon={EyeIcon} label="Vues" value={formatNumber(stats.totalViews)} color="text-green-400" bgColor="bg-green-500/10" />
            </>
          )}
        </div>

        {(isCreator || isAdmin) && (
          <div className="bg-[#1A1A2E] rounded-2xl p-6 border border-white/[0.04]">
            <h3 className="text-base font-bold text-white mb-4">Actions rapides</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { href: '/creator/upload', icon: ArrowUpTrayIcon, label: 'Uploader' },
                { href: '/creator/videos', icon: VideoCameraIcon, label: 'Mes vidéos' },
                { href: '/creator/earnings', icon: CurrencyDollarIcon, label: 'Gains' },
                { href: '/creator/stats', icon: EyeIcon, label: 'Stats' },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="flex flex-col items-center gap-2 p-4 bg-white/[0.03] rounded-xl hover:bg-white/[0.06] transition text-center group border border-white/[0.04] hover:border-[#FF6B35]/30">
                  <item.icon className="w-6 h-6 text-[#FF6B35] group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-white">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {(isCreator || isAdmin) && stats.recentVideos && stats.recentVideos.length > 0 && (
          <div className="bg-[#1A1A2E] rounded-2xl p-6 border border-white/[0.04]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white">Dernières vidéos</h3>
              <Link href="/creator/videos" className="text-xs font-semibold text-[#FF6B35] hover:underline">Voir tout →</Link>
            </div>
            <div className="space-y-2">
              {stats.recentVideos.slice(0, 5).map((video: any) => (
                <div key={video.id} className="flex justify-between items-center p-3 bg-white/[0.03] rounded-xl hover:bg-white/[0.05] transition border border-white/[0.02]">
                  <div className="flex items-center gap-3 min-w-0">
                    <PlayIcon className="w-4 h-4 text-white/40 flex-shrink-0" />
                    <div className="min-w-0"><p className="font-semibold text-sm text-white truncate">{video.title}</p><p className="text-[10px] text-white/40 font-medium">{formatNumber(video.views)} vues • {formatNumber(video.purchases)} achats</p></div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold flex-shrink-0 ml-2 ${video.status === 'approved' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{video.status === 'approved' ? 'Publiée' : 'En attente'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isCreator && !isAdmin && stats.recentPurchases && stats.recentPurchases.length > 0 && (
          <div className="bg-[#1A1A2E] rounded-2xl p-6 border border-white/[0.04]">
            <h3 className="text-base font-bold text-white mb-4">Derniers achats</h3>
            <div className="space-y-2">
              {stats.recentPurchases.slice(0, 5).map((purchase: any) => (
                <div key={purchase.id} className="flex justify-between items-center p-3 bg-white/[0.03] rounded-xl hover:bg-white/[0.05] transition border border-white/[0.02]">
                  <div className="min-w-0"><p className="font-semibold text-sm text-white truncate">{purchase.video?.title || 'Contenu supprimé'}</p><p className="text-[10px] text-white/40 font-medium">Acheté le {purchase.createdAt ? new Date(purchase.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}</p></div>
                  <span className="text-[#FF6B35] font-bold text-sm flex-shrink-0 ml-2">{formatNumber(purchase.amount)} FCFA</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {((isCreator || isAdmin) && (!stats.recentVideos || stats.recentVideos.length === 0)) && (
          <div className="bg-[#1A1A2E] rounded-2xl p-12 text-center border border-white/[0.04]">
            <VideoCameraIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white font-semibold">Aucune vidéo publiée</p>
            <p className="text-sm text-white/40 mt-1">Commencez par uploader votre première vidéo</p>
            <Link href="/creator/upload" className="inline-block mt-4 px-5 py-2.5 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white rounded-xl font-bold hover:shadow-lg transition">Uploader une vidéo</Link>
          </div>
        )}

        {!isCreator && !isAdmin && (!stats.recentPurchases || stats.recentPurchases.length === 0) && (
          <div className="bg-[#1A1A2E] rounded-2xl p-12 text-center border border-white/[0.04]">
            <ShoppingBagIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white font-semibold">Aucun achat effectué</p>
            <p className="text-sm text-white/40 mt-1">Découvrez nos mini-séries et films</p>
            <Link href="/" className="inline-block mt-4 px-5 py-2.5 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white rounded-xl font-bold hover:shadow-lg transition">Découvrir du contenu</Link>
          </div>
        )}
      </div>
    </ProfileLayout>
  )
}