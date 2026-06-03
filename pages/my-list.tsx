"use client"

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { 
  PlayIcon,
  UserCircleIcon,
  BookmarkIcon,
  ShoppingBagIcon,
  TrashIcon,
  HomeIcon,
  UserGroupIcon,
  TrophyIcon,
  LockClosedIcon,
  FilmIcon,
  TvIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useRequireAuth } from '../hooks/useRequireAuth'
import toast from 'react-hot-toast'

// Types
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
  const { isAuthorized, isLoading: authLoading } = useRequireAuth()
  const [items, setItems] = useState<ListItem[]>([])
  const [stats, setStats] = useState<Stats>({ likes: 0, saves: 0, purchases: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'like' | 'save' | 'purchase'>('all')
  const [activeFooterTab, setActiveFooterTab] = useState('my-list')

  useEffect(() => {
    if (!isAuthorized) return
    fetchMyList()
  }, [isAuthorized])

  const fetchMyList = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/user/my-list')
      if (!res.ok) throw new Error('Erreur réseau')
      const data = await res.json()
      setItems(Array.isArray(data.items) ? data.items : [])
      setStats(data.stats || { likes: 0, saves: 0, purchases: 0, total: 0 })
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Impossible de charger votre liste', { duration: 2500 })
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const removeFromList = async (itemId: string, type: 'like' | 'save') => {
    try {
      const res = await fetch('/api/user/remove-from-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          episodeId: itemId,
          itemId: itemId,
          type 
        })
      })
      if (res.ok) {
        toast.success('Retiré de votre liste', { duration: 2000 })
        fetchMyList()
      } else {
        toast.error('Erreur lors de la suppression', { duration: 2500 })
      }
    } catch (error) {
      toast.error('Erreur réseau', { duration: 2500 })
    }
  }

  const filteredItems = filter === 'all' 
    ? items 
    : items.filter(item => item.addedVia === filter)

  // Séparer les séries et les films
  const seriesItems = filteredItems.filter(item => item.type === 'series')
  const movieItems = filteredItems.filter(item => item.type === 'movie')

  const getAddedViaIcon = (via: string) => {
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

  // ==================== AFFICHAGE : NON CONNECTÉ ====================
  if (!isAuthorized && !authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8]">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] px-4">
          <div className="w-20 h-20 rounded-2xl bg-white/80 border border-[#D4A855]/20 flex items-center justify-center mb-6 shadow-sm">
            <LockClosedIcon className="w-10 h-10 text-[#FF6B35]" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Accès restreint</h2>
          <p className="text-sm text-gray-600 text-center max-w-sm">
            Connectez-vous pour accéder à votre liste personnelle
          </p>
        </div>
      </div>
    )
  }

  // ==================== AFFICHAGE : CHARGEMENT ====================
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8]">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
        </div>
      </div>
    )
  }

  // ==================== RENDU D'UNE GRILLE ====================
  // ==================== RENDU D'UNE GRILLE ====================
const renderGrid = (title: string, IconComponent: React.ElementType, data: ListItem[], accentColor: string) => {
  if (data.length === 0) return null

  return (
    <div className="mb-8">
      {/* Titre de section */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${accentColor} flex items-center justify-center shadow-md`}>
          <IconComponent className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <p className="text-[11px] text-gray-600 font-bold">{data.length} élément{data.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Grille */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2.5">
        {data.map((item) => (
          <div key={`${item.id}-${item.addedVia}`} className="relative group">
            <Link 
              href={item.type === 'series' ? `/series/${item.id}` : `/video/${item.id}`}
              className="block"
            >
              <div className="relative rounded-xl overflow-hidden bg-white border border-[#D4A855]/10 hover:border-[#FF6B35]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                <div className="relative aspect-[3/4] overflow-hidden bg-[#EDE4D8]">
                  {item.coverImage ? (
                    <img 
                      src={item.coverImage} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {item.type === 'series' ? (
                        <FilmIcon className="w-10 h-10 text-gray-400" />
                      ) : (
                        <PlayIcon className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <PlayIcon className="w-8 h-8 text-white drop-shadow-lg" />
                  </div>
                  
                  {/* Badge type */}
                  <div className="absolute top-1.5 left-1.5">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                      item.type === 'series' 
                        ? 'bg-purple-500/90 text-white' 
                        : 'bg-blue-500/90 text-white'
                    }`}>
                      {item.type === 'series' ? (
                        <><FilmIcon className="w-2.5 h-2.5" /> Série</>
                      ) : (
                        <><PlayIcon className="w-2.5 h-2.5" /> Film</>
                      )}
                    </span>
                  </div>
                  
                  {/* Prix (seulement pour les achats) */}
                  {item.addedVia === 'purchase' && (
                    <div className="absolute top-1.5 right-1.5">
                      <span className="bg-gradient-to-r from-[#D4A855] to-[#E5C87B] text-gray-900 text-[8px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
                        {item.price} 🪙
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="p-2">
                  <h3 className="font-bold text-[11px] text-gray-900 line-clamp-1 group-hover:text-[#FF6B35] transition leading-tight">
                    {item.title}
                  </h3>
                </div>
              </div>
            </Link>
            
            {/* Badge origine */}
            <div className="absolute -top-1 -right-1 flex items-center gap-1 bg-white rounded-full px-1.5 py-0.5 shadow-sm border border-[#D4A855]/20 z-10">
              {getAddedViaIcon(item.addedVia)}
              <span className="text-[8px] text-gray-700 font-bold">{getAddedViaLabel(item.addedVia)}</span>
            </div>
            
            {/* Bouton supprimer */}
            {(item.addedVia === 'like' || item.addedVia === 'save') && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  removeFromList(item.id, item.addedVia as 'like' | 'save')
                }}
                className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-md z-10"
                title="Retirer de la liste"
              >
                <TrashIcon className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

  // ==================== AFFICHAGE : NORMAL ====================
  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-20">
      <Navbar />

      {/* En-tête */}
      <div className="sticky top-12 z-20 bg-[#0D0D1A]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] rounded-xl flex items-center justify-center shadow-md shadow-[#FF6B35]/20">
              <BookmarkIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Ma liste</h1>
              <p className="text-xs text-[#D4A855]/60">
                {stats.total} élément{stats.total !== 1 ? 's' : ''} • 
                {seriesItems.length} série{seriesItems.length !== 1 ? 's' : ''} • 
                {movieItems.length} film{movieItems.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres statistiques */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => setFilter(filter === 'like' ? 'all' : 'like')}
            className={`bg-white/90 backdrop-blur-sm rounded-xl p-3 text-center transition-all duration-300 border ${
              filter === 'like' ? 'ring-2 ring-red-400 shadow-md border-red-200' : 'border-[#D4A855]/10 hover:shadow-md'
            }`}
          >
            <HeartSolidIcon className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <p className="text-gray-900 font-bold text-lg">{stats.likes}</p>
            <p className="text-gray-600 text-[10px] font-bold">Aimés</p>
          </button>
          
          <button 
            onClick={() => setFilter(filter === 'save' ? 'all' : 'save')}
            className={`bg-white/90 backdrop-blur-sm rounded-xl p-3 text-center transition-all duration-300 border ${
              filter === 'save' ? 'ring-2 ring-[#FF6B35] shadow-md border-[#FF6B35]/20' : 'border-[#D4A855]/10 hover:shadow-md'
            }`}
          >
            <BookmarkIcon className="w-5 h-5 text-[#FF6B35] mx-auto mb-1" />
            <p className="text-gray-900 font-bold text-lg">{stats.saves}</p>
            <p className="text-gray-600 text-[10px] font-bold">Sauvegardés</p>
          </button>
          
          <button 
            onClick={() => setFilter(filter === 'purchase' ? 'all' : 'purchase')}
            className={`bg-white/90 backdrop-blur-sm rounded-xl p-3 text-center transition-all duration-300 border ${
              filter === 'purchase' ? 'ring-2 ring-green-500 shadow-md border-green-200' : 'border-[#D4A855]/10 hover:shadow-md'
            }`}
          >
            <ShoppingBagIcon className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-gray-900 font-bold text-lg">{stats.purchases}</p>
            <p className="text-gray-600 text-[10px] font-bold">Achetés</p>
          </button>
        </div>
        
        {filter !== 'all' && (
          <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-gray-600 font-bold">
              Filtre : <span className="text-[#FF6B35]">{getAddedViaLabel(filter)}</span>
            </p>
            <button 
              onClick={() => setFilter('all')}
              className="text-xs text-gray-600 font-bold hover:text-[#FF6B35] transition"
            >
              ✕ Réinitialiser
            </button>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {filteredItems.length > 0 ? (
          <>
            {/* Section SÉRIES */}
            {renderGrid('Séries', FilmIcon, seriesItems, 'from-purple-500 to-purple-700')}
            
            {/* Section FILMS */}
            {renderGrid('Films', PlayIcon, movieItems, 'from-blue-500 to-blue-700')}
          </>
        ) : (
          /* Liste vide */
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 text-center border border-[#D4A855]/10 shadow-sm mt-6">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-900 font-bold text-lg">Votre liste est vide</p>
            <p className="text-sm text-gray-600 mt-2">
              {filter !== 'all' 
                ? `Aucun élément ${getAddedViaLabel(filter).toLowerCase()}`
                : 'Aimez, sauvegardez ou achetez des vidéos pour les retrouver ici'
              }
            </p>
            <Link 
              href="/" 
              className="inline-block mt-4 px-5 py-2.5 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white rounded-xl font-bold hover:shadow-lg transition text-sm"
            >
              Découvrir des vidéos
            </Link>
          </div>
        )}
      </div>

      <Footer 
        footerTabs={footerTabs} 
        activeFooterTab={activeFooterTab} 
        setActiveFooterTab={setActiveFooterTab} 
      />
    </div>
  )
}