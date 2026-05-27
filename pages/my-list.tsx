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
      case 'save': return <BookmarkIcon className="w-3 h-3 text-kahonyn-energie" />
      case 'purchase': return <ShoppingBagIcon className="w-3 h-3 text-green-500" />
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
      <div>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pb-20 text-white">
      <Navbar />
      <Toaster position="top-right" />

      {/* En-tête */}
      <div className="sticky top-12 z-20 bg-gray-900/95 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-500/20">
              <BookmarkIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Ma liste</h1>
              <p className="text-xs text-gray-400">
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
            className={`bg-gray-900/95 rounded-xl p-3 text-center cursor-pointer transition-all duration-300 ${
              filter === 'like' ? 'ring-2 ring-red-500 shadow-md shadow-red-500/20' : 'hover:bg-gray-800'
            }`}
          >
            <HeartSolidIcon className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <p className="text-white font-bold text-lg">{stats.likes}</p>
            <p className="text-gray-400 text-[10px]">Aimés</p>
          </div>
          <div 
            onClick={() => setFilter('save')}
            className={`bg-gray-900/95 rounded-xl p-3 text-center cursor-pointer transition-all duration-300 ${
              filter === 'save' ? 'ring-2 ring-amber-500 shadow-md shadow-amber-500/20' : 'hover:bg-gray-800'
            }`}
          >
            <BookmarkIcon className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-white font-bold text-lg">{stats.saves}</p>
            <p className="text-gray-400 text-[10px]">Sauvegardés</p>
          </div>
          <div 
            onClick={() => setFilter('purchase')}
            className={`bg-gray-900/95 rounded-xl p-3 text-center cursor-pointer transition-all duration-300 ${
              filter === 'purchase' ? 'ring-2 ring-green-500 shadow-md shadow-green-500/20' : 'hover:bg-gray-800'
            }`}
          >
            <ShoppingBagIcon className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-white font-bold text-lg">{stats.purchases}</p>
            <p className="text-gray-400 text-[10px]">Achetés</p>
          </div>
        </div>
        
        {filter !== 'all' && (
          <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-gray-500">
              Affichage : <span className="text-kahonyn-energie font-medium">{getAddedViaLabel(filter)}</span>
            </p>
            <button 
              onClick={() => setFilter('all')}
              className="text-xs text-gray-400 hover:text-amber-400 transition"
            >
              Voir tout
            </button>
          </div>
        )}
      </div>

      {/* Liste des vidéos */}
      {filteredItems.length > 0 ? (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredItems.map((item, index) => {
              const via = item.addedVia
              return (
              <div key={item.id} className="relative group">
                <Link 
                  href={item.type === 'series' ? `/series/${item.id}` : `/video/${item.id}`}
                  className="block"
                >
                  <div className="relative bg-gray-900 rounded-xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-1 border border-gray-800">
                    <div className="relative aspect-[4/5] bg-gray-800 flex items-center justify-center overflow-hidden">
                      {item.coverImage ? (
                        <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      ) : (
                        <span className="text-4xl">🎬</span>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <PlayIcon className="w-8 h-8 text-white drop-shadow-lg" />
                      </div>
                      <div className="absolute bottom-1.5 right-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                        {item.price} coins
                      </div>
                      <div className="absolute top-1.5 left-1.5">
                        {item.type === 'series' ? (
                          <span className="bg-gray-900/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">Série</span>
                        ) : (
                          <span className="bg-blue-500/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">Film</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-2.5">
                      <h3 className="font-semibold text-sm text-white line-clamp-1 group-hover:text-amber-400 transition">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-gray-400 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    </div>
                    
                    <div className="absolute inset-0 rounded-xl border border-gray-800 group-hover:border-amber-500/30 transition-all duration-300 pointer-events-none"></div>
                  </div>
                </Link>
                
                {/* Badge d'origine */}
                <div className="absolute -top-1 -right-1 flex items-center gap-0.5 bg-gray-900/95 backdrop-blur-sm rounded-full px-1.5 py-0.5 shadow-sm border border-gray-800">
                  {getAddedViaIcon(via)}
                  <span className="text-[8px] text-gray-300 ml-0.5">{getAddedViaLabel(via)}</span>
                </div>
                
                {/* Bouton supprimer */}
                {(via === 'like' || via === 'save') && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      removeFromList(item.id, via as 'like' | 'save')
                    }}
                    className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
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
          <div className="bg-gray-900/95 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-800 shadow-md">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-300">Votre liste est vide</p>
            <p className="text-sm text-gray-400 mt-2">
              {filter !== 'all' 
                ? `Aucun élément ${getAddedViaLabel(filter).toLowerCase()} dans votre liste`
                : 'Aimez, sauvegardez ou achetez des vidéos pour les retrouver ici'
              }
            </p>
            <Link href="/" className="inline-block mt-4 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:shadow-md transition">
              Découvrir des vidéos
            </Link>
          </div>
        </div>
      )}

      {/* Footer fixe - mode clair */}
      <Footer footerTabs={footerTabs} activeFooterTab={activeFooterTab} setActiveFooterTab={setActiveFooterTab} />
    </div>
  )
}