"use client"

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { 
  PlayIcon, UserCircleIcon, BookmarkIcon, ShoppingBagIcon, TrashIcon,
  HomeIcon, UserGroupIcon, TrophyIcon, LockClosedIcon, FilmIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useRequireAuth } from '../hooks/useRequireAuth'
import toast from 'react-hot-toast'

interface ListItem {
  id: string; title: string; description: string; coverImage: string
  price: number; duration: number; views: number
  type: 'series' | 'movie'; addedAt: string
  addedVia: 'like' | 'save' | 'purchase'
  creator: { name: string; phone: string }
}

interface Stats { likes: number; saves: number; purchases: number; total: number }

export default function MyListPage() {
  const { data: session } = useSession()
  const { isAuthorized, isLoading: authLoading } = useRequireAuth()
  const [items, setItems] = useState<ListItem[]>([])
  const [stats, setStats] = useState<Stats>({ likes: 0, saves: 0, purchases: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'like' | 'save' | 'purchase'>('all')
  const [activeFooterTab, setActiveFooterTab] = useState('my-list')

  useEffect(() => { if (!isAuthorized) return; fetchMyList() }, [isAuthorized])

  const fetchMyList = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/user/my-list')
      if (!res.ok) throw new Error('Erreur réseau')
      const data = await res.json()
      setItems(Array.isArray(data.items) ? data.items : [])
      setStats(data.stats || { likes: 0, saves: 0, purchases: 0, total: 0 })
    } catch (error) { toast.error('Impossible de charger votre liste') }
    finally { setLoading(false) }
  }

  const removeFromList = async (itemId: string, type: 'like' | 'save') => {
    try {
      const res = await fetch('/api/user/remove-from-list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ episodeId: itemId, itemId, type }) })
      if (res.ok) { toast.success('Retiré de votre liste'); fetchMyList() }
      else { toast.error('Erreur') }
    } catch { toast.error('Erreur réseau') }
  }

  const filteredItems = filter === 'all' ? items : items.filter(item => item.addedVia === filter)
  const seriesItems = filteredItems.filter(item => item.type === 'series')
  const movieItems = filteredItems.filter(item => item.type === 'movie')

  const getAddedViaIcon = (via: string) => {
    switch (via) {
      case 'like': return <HeartSolidIcon className="w-3 h-3 text-red-500" />
      case 'save': return <BookmarkIcon className="w-3 h-3 text-[#FF6B35]" />
      case 'purchase': return <ShoppingBagIcon className="w-3 h-3 text-green-500" />
      default: return null
    }
  }

  const getAddedViaLabel = (via: string) => {
    switch (via) { case 'like': return 'Aimé'; case 'save': return 'Sauvegardé'; case 'purchase': return 'Acheté'; default: return '' }
  }

  const footerTabs = [
    { id: 'home', label: 'Accueil', icon: HomeIcon, href: '/' },
    { id: 'for-you', label: 'Pour vous', icon: UserGroupIcon, href: '/for-you' },
    { id: 'my-list', label: 'Ma liste', icon: BookmarkIcon, href: '/my-list' },
    { id: 'premium', label: 'Primes', icon: TrophyIcon, href: '/premium' },
    { id: 'profile', label: 'Profil', icon: UserCircleIcon, href: '/profile' },
  ]

  if (!isAuthorized && !authLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D]"><Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] px-4">
          <div className="w-24 h-24 rounded-2xl bg-[#1A1A2E] border border-white/[0.06] flex items-center justify-center mb-6 shadow-xl">
            <LockClosedIcon className="w-12 h-12 text-[#FF6B35]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Accès restreint</h2>
          <p className="text-sm text-white/60 text-center max-w-sm">Connectez-vous pour accéder à votre liste personnelle</p>
        </div>
      </div>
    )
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D]"><Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-white/[0.04] flex items-center justify-center p-3 animate-pulse border border-white/[0.06]">
                <img src="/logo-kahonyn.png" alt="Kahonyn" className="w-14 h-14 object-contain" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FF6B35] animate-bounce"></div>
            </div>
            <p className="text-white/60 text-sm font-semibold">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  const renderGrid = (title: string, IconComponent: React.ElementType, data: ListItem[], accentColor: string) => {
    if (data.length === 0) return null
    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${accentColor} flex items-center justify-center shadow-lg`}>
            <IconComponent className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{title}</h2>
            <p className="text-sm text-white/50 font-medium">{data.length} élément{data.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2.5">
          {data.map((item) => (
            <div key={`${item.id}-${item.addedVia}`} className="relative group">
              <Link href={item.type === 'series' ? `/series/${item.id}` : `/video/${item.id}`} className="block">
                <div className="relative rounded-xl overflow-hidden bg-[#1A1A2E] border border-white/[0.04] hover:border-[#FF6B35]/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {item.coverImage ? (
                      <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1A1A2E] to-[#2A2A4E] flex items-center justify-center">
                        <IconComponent className="w-10 h-10 text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <PlayIcon className="w-10 h-10 text-white drop-shadow-lg" />
                    </div>
                    <div className="absolute top-2 left-2">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${item.type === 'series' ? 'bg-purple-500/90 text-white' : 'bg-blue-500/90 text-white'}`}>
                        {item.type === 'series' ? 'Série' : 'Film'}
                      </span>
                    </div>
                    {item.addedVia === 'purchase' && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-gradient-to-r from-[#D4A855] to-[#E5C87B] text-[#0D0D0D] text-[10px] font-bold px-2 py-1 rounded-lg">{item.price} 🪙</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <h3 className="font-semibold text-xs text-white line-clamp-1 group-hover:text-[#FF6B35] transition">{item.title}</h3>
                  </div>
                </div>
              </Link>
              <div className="absolute -top-1 -right-1 flex items-center gap-1 bg-[#1A1A2E] rounded-full px-2 py-1 shadow-lg border border-white/[0.06] z-10">
                {getAddedViaIcon(item.addedVia)}
                <span className="text-[10px] text-white font-medium">{getAddedViaLabel(item.addedVia)}</span>
              </div>
              {(item.addedVia === 'like' || item.addedVia === 'save') && (
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFromList(item.id, item.addedVia as 'like' | 'save') }}
                  className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg z-10">
                  <TrashIcon className="w-3.5 h-3.5 text-white" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-20">
      <Navbar />
      <div className="sticky top-12 z-20 bg-[#0D0D0D]/98 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF6B35]/20">
              <BookmarkIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Ma liste</h1>
              <p className="text-sm text-[#D4A855] font-medium">
                {stats.total} élément{stats.total !== 1 ? 's' : ''} • {seriesItems.length} série{seriesItems.length !== 1 ? 's' : ''} • {movieItems.length} film{movieItems.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button onClick={() => setFilter(filter === 'like' ? 'all' : 'like')}
            className={`bg-[#1A1A2E] rounded-xl p-3 text-center transition-all duration-300 border ${filter === 'like' ? 'ring-2 ring-red-500 border-red-500/30' : 'border-white/[0.04] hover:border-white/[0.08]'}`}>
            <HeartSolidIcon className="w-6 h-6 text-red-500 mx-auto mb-1" />
            <p className="text-white font-bold text-lg">{stats.likes}</p>
            <p className="text-white/50 text-xs font-medium">Aimés</p>
          </button>
          <button onClick={() => setFilter(filter === 'save' ? 'all' : 'save')}
            className={`bg-[#1A1A2E] rounded-xl p-3 text-center transition-all duration-300 border ${filter === 'save' ? 'ring-2 ring-[#FF6B35] border-[#FF6B35]/30' : 'border-white/[0.04] hover:border-white/[0.08]'}`}>
            <BookmarkIcon className="w-6 h-6 text-[#FF6B35] mx-auto mb-1" />
            <p className="text-white font-bold text-lg">{stats.saves}</p>
            <p className="text-white/50 text-xs font-medium">Sauvegardés</p>
          </button>
          <button onClick={() => setFilter(filter === 'purchase' ? 'all' : 'purchase')}
            className={`bg-[#1A1A2E] rounded-xl p-3 text-center transition-all duration-300 border ${filter === 'purchase' ? 'ring-2 ring-green-500 border-green-500/30' : 'border-white/[0.04] hover:border-white/[0.08]'}`}>
            <ShoppingBagIcon className="w-6 h-6 text-green-500 mx-auto mb-1" />
            <p className="text-white font-bold text-lg">{stats.purchases}</p>
            <p className="text-white/50 text-xs font-medium">Achetés</p>
          </button>
        </div>
        {filter !== 'all' && (
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-white/60">Filtre : <span className="text-[#FF6B35] font-semibold">{getAddedViaLabel(filter)}</span></p>
            <button onClick={() => setFilter('all')} className="text-sm text-white/50 hover:text-[#FF6B35] transition">✕ Réinitialiser</button>
          </div>
        )}

        {filteredItems.length > 0 ? (
          <>
            {renderGrid('Séries', FilmIcon, seriesItems, 'from-purple-500 to-purple-700')}
            {renderGrid('Films', PlayIcon, movieItems, 'from-blue-500 to-blue-700')}
          </>
        ) : (
          <div className="bg-[#1A1A2E] rounded-2xl p-12 text-center border border-white/[0.04] mt-6">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-white font-bold text-lg">Votre liste est vide</p>
            <p className="text-sm text-white/50 mt-2">{filter !== 'all' ? `Aucun élément ${getAddedViaLabel(filter).toLowerCase()}` : 'Aimez, sauvegardez ou achetez des vidéos pour les retrouver ici'}</p>
            <Link href="/" className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white rounded-xl font-bold hover:shadow-lg transition">Découvrir des vidéos</Link>
          </div>
        )}
      </div>
      <Footer footerTabs={footerTabs} activeFooterTab={activeFooterTab} setActiveFooterTab={setActiveFooterTab} />
    </div>
  )
}