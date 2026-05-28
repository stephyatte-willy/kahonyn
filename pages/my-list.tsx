"use client"

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { 
  FilmIcon, 
  TvIcon, 
  PlayIcon,
  UserCircleIcon,
  HeartIcon,
  BookmarkIcon,
  ShoppingBagIcon,
  TrashIcon,
  HomeIcon,
  UserGroupIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import toast, { Toaster } from 'react-hot-toast'

interface ListItem {
  id: string
  title: string
  description: string
  coverImage: string
  price: number
  duration: number
  views: number
  type: 'series' | 'movie'
  addedAt: string
  addedVia: 'like' | 'save' | 'purchase'
  creator: { name: string; phone: string }
}

interface Stats {
  likes: number
  saves: number
  purchases: number
  total: number
}

export default function MyListPage() {
  const { data: session } = useSession()
  const [items, setItems] = useState<ListItem[]>([])
  const [stats, setStats] = useState<Stats>({ likes: 0, saves: 0, purchases: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'like' | 'save' | 'purchase'>('all')
  const [activeFooterTab, setActiveFooterTab] = useState('my-list')

  useEffect(() => {
    if (!session) {
      window.location.href = '/login'
      return
    }
    fetchMyList()
  }, [session])

  const fetchMyList = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/user/my-list')
      const data = await res.json()
      setItems(data.items || [])
      setStats(data.stats || { likes: 0, saves: 0, purchases: 0, total: 0 })
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Impossible de charger votre liste')
    } finally {
      setLoading(false)
    }
  }

  const removeFromList = async (itemId: string, type: 'like' | 'save') => {
    try {
      const res = await fetch(`/api/user/remove-from-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId: itemId, type })
      })
      if (res.ok) {
        toast.success('Retiré de votre liste')
        fetchMyList()
      } else {
        toast.error('Erreur')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    }
  }

  const filteredItems = filter === 'all' 
    ? items 
    : items.filter(item => item.addedVia === filter)

  const getAddedViaIcon = (via: ListItem['addedVia']) => {
    switch (via) {
      case 'like': return <HeartSolidIcon className="w-3 h-3 text-red-500" />
      case 'save': return <BookmarkIcon className="w-3 h-3 text-[#FF6B35]" />
      case 'purchase': return <ShoppingBagIcon className="w-3 h-3 text-green-600" />
      default: return null
    }
  }

  const getAddedViaLabel = (via: string) => {
    switch (via) {
      case 'like': return 'Aimé'
      case 'save': return 'Sauvegardé'
      case 'purchase': return 'Acheté'
      default: return ''
    }
  }

  const footerTabs = [
    { id: 'home', label: 'Accueil', icon: HomeIcon, href: '/' },
    { id: 'for-you', label: 'Pour vous', icon: UserGroupIcon, href: '/for-you' },
    { id: 'my-list', label: 'Ma liste', icon: BookmarkIcon, href: '/my-list' },
    { id: 'premium', label: 'Primes', icon: TrophyIcon, href: '/premium' },
    { id: 'profile', label: 'Profil', icon: UserCircleIcon, href: '/profile' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8]">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-20">
      <Navbar />
      <Toaster position="top-right" />

      {/* En-tête - fond sombre conservé */}
      <div className="sticky top-12 z-20 bg-[#0D0D1A]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] rounded-xl flex items-center justify-center shadow-md shadow-[#FF6B35]/20">
              <BookmarkIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Ma liste</h1>
              <p className="text-xs text-[#D4A855]/60">
                {stats.total} élément{stats.total !== 1 ? 's' : ''} enregistré{stats.total !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          <div 
            onClick={() => setFilter('like')}
            className={`bg-white/90 backdrop-blur-sm rounded-xl p-3 text-center cursor-pointer transition-all duration-300 border ${
              filter === 'like' ? 'ring-2 ring-red-400 shadow-md border-red-200' : 'border-[#D4A855]/10 hover:shadow-md'
            }`}
          >
            <HeartSolidIcon className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <p className="text-[#5C3D2E] font-bold text-lg">{stats.likes}</p>
            <p className="text-[#8B5A2B]/60 text-[10px]">Aimés</p>
          </div>
          <div 
            onClick={() => setFilter('save')}
            className={`bg-white/90 backdrop-blur-sm rounded-xl p-3 text-center cursor-pointer transition-all duration-300 border ${
              filter === 'save' ? 'ring-2 ring-[#FF6B35] shadow-md border-[#FF6B35]/20' : 'border-[#D4A855]/10 hover:shadow-md'
            }`}
          >
            <BookmarkIcon className="w-5 h-5 text-[#FF6B35] mx-auto mb-1" />
            <p className="text-[#5C3D2E] font-bold text-lg">{stats.saves}</p>
            <p className="text-[#8B5A2B]/60 text-[10px]">Sauvegardés</p>
          </div>
          <div 
            onClick={() => setFilter('purchase')}
            className={`bg-white/90 backdrop-blur-sm rounded-xl p-3 text-center cursor-pointer transition-all duration-300 border ${
              filter === 'purchase' ? 'ring-2 ring-green-500 shadow-md border-green-200' : 'border-[#D4A855]/10 hover:shadow-md'
            }`}
          >
            <ShoppingBagIcon className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-[#5C3D2E] font-bold text-lg">{stats.purchases}</p>
            <p className="text-[#8B5A2B]/60 text-[10px]">Achetés</p>
          </div>
        </div>
        
        {filter !== 'all' && (
          <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-[#8B5A2B]/60">
              Affichage : <span className="text-[#FF6B35] font-medium">{getAddedViaLabel(filter)}</span>
            </p>
            <button 
              onClick={() => setFilter('all')}
              className="text-xs text-[#8B5A2B]/60 hover:text-[#FF6B35] transition"
            >
              Voir tout
            </button>
          </div>
        )}
      </div>

      {/* Liste des vidéos */}
      {filteredItems.length > 0 ? (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2.5">
            {filteredItems.map((item, index) => {
              const via = item.addedVia
              return (
              <div key={item.id} className="relative group">
                <Link 
                  href={item.type === 'series' ? `/series/${item.id}` : `/video/${item.id}`}
                  className="block"
                >
                  <div className="relative rounded-xl overflow-hidden bg-white border border-[#D4A855]/10 hover:border-[#FF6B35]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#8B5A2B]/10">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      {item.coverImage ? (
                        <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#F5F0E8] to-[#E8D5B5]/30 flex items-center justify-center">
                          <span className="text-2xl">🎬</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-[#5C3D2E]/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <PlayIcon className="w-8 h-8 text-white drop-shadow-lg" />
                      </div>
                      <div className="absolute top-1.5 right-1.5 bg-gradient-to-r from-[#D4A855] to-[#E5C87B] text-[#5C3D2E] text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
                        {item.price} coins
                      </div>
                      <div className="absolute top-1.5 left-1.5">
                        {item.type === 'series' ? (
                          <span className="bg-white/95 backdrop-blur-sm text-[#FF6B35] text-[8px] font-bold px-1.5 py-0.5 rounded">Série</span>
                        ) : (
                          <span className="bg-[#5C3D2E]/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">Film</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <h3 className="font-medium text-[11px] text-[#5C3D2E] line-clamp-1 group-hover:text-[#FF6B35] transition leading-tight">
                        {item.title}
                      </h3>
                      <p className="text-[9px] text-[#8B5A2B]/60 line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
                
                {/* Badge d'origine */}
                <div className="absolute -top-1 -right-1 flex items-center gap-0.5 bg-white/95 backdrop-blur-sm rounded-full px-1.5 py-0.5 shadow-sm border border-[#D4A855]/20">
                  {getAddedViaIcon(via)}
                  <span className="text-[8px] text-[#8B5A2B] ml-0.5">{getAddedViaLabel(via)}</span>
                </div>
                
                {/* Bouton supprimer */}
                {(via === 'like' || via === 'save') && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      removeFromList(item.id, via as 'like' | 'save')
                    }}
                    className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-md"
                  >
                    <TrashIcon className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 text-center border border-[#D4A855]/10 shadow-lg shadow-[#8B5A2B]/5">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-[#5C3D2E] font-medium">Votre liste est vide</p>
            <p className="text-sm text-[#8B5A2B]/60 mt-2">
              {filter !== 'all' 
                ? `Aucun élément ${getAddedViaLabel(filter).toLowerCase()} dans votre liste`
                : 'Aimez, sauvegardez ou achetez des vidéos pour les retrouver ici'
              }
            </p>
            <Link href="/" className="inline-block mt-4 px-5 py-2.5 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white rounded-xl hover:shadow-lg hover:shadow-[#FF6B35]/20 transition font-medium text-sm">
              Découvrir des vidéos
            </Link>
          </div>
        </div>
      )}

      <Footer footerTabs={footerTabs} activeFooterTab={activeFooterTab} setActiveFooterTab={setActiveFooterTab} />
    </div>
  )
}