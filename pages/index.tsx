"use client"

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { 
  MagnifyingGlassIcon,
  ChevronDownIcon,
  XMarkIcon,
  HomeIcon,
  UserGroupIcon,
  BookmarkIcon,
  TrophyIcon,
  UserCircleIcon,
  FilmIcon,
  TvIcon,
  PlayIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

interface Series {
  id: string
  title: string
  description: string
  coverImage: string
  totalEpisodes: number
  totalViews: number
  category: string
  creator: { name: string; phone: string }
  createdAt: string
  type: 'series'
}

interface Movie {
  id: string
  title: string
  description: string
  coverImage: string
  duration: number
  price: number
  totalViews: number
  category: string
  creator: { name: string; phone: string }
  createdAt: string
  type: 'movie'
}

interface Category {
  id: string
  label: string
  icon: string
}

const horizontalCategories = [
  { id: 'popular', label: 'Populaires', icon: '🔥' },
  { id: 'anime', label: 'Animé', icon: '🎌' },
  { id: 'unpublished', label: 'Inédit', icon: '✨' },
  { id: 'ranking', label: 'Classement', icon: '🏆' },
  { id: 'dubbed', label: 'Doublés', icon: '🎤' },
  { id: 'vip', label: 'VIP', icon: '👑' },
  { id: 'women', label: 'Femmes', icon: '👩' },
  { id: 'men', label: 'Hommes', icon: '👨' },
]

export default function Home() {
  const { data: session } = useSession()
  const [series, setSeries] = useState<Series[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('popular')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [activeFooterTab, setActiveFooterTab] = useState('home')
  const modalRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => {
    fetchCategories()
    fetchContent()
  }, [])

  useEffect(() => {
    fetchContent()
  }, [activeCategory])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowCategoryModal(false)
      }
    }
    if (showCategoryModal) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCategoryModal])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/public/categories')
      const data = await res.json()
      setAllCategories(data)
    } catch (error) {
      setAllCategories(horizontalCategories)
    }
  }

  const fetchContent = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/public/videos-by-category?category=${activeCategory}`)
      const data = await res.json()
      setSeries(data.series || [])
      setMovies(data.movies || [])
    } catch (error) {
      console.error('Erreur fetchContent:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategorySelect = (categoryId: string) => {
    setActiveCategory(categoryId)
    setShowCategoryModal(false)
  }

  const footerTabs = isAdmin 
    ? [
        { id: 'home', label: 'Accueil', icon: HomeIcon, href: '/' },
        { id: 'for-you', label: 'Pour vous', icon: UserGroupIcon, href: '/for-you' },
        { id: 'my-list', label: 'Ma liste', icon: BookmarkIcon, href: '/my-list' },
        { id: 'premium', label: 'Primes', icon: TrophyIcon, href: '/premium' },
        { id: 'admin', label: 'Admin', icon: ShieldCheckIcon, href: '/admin/videos/pending' },
      ]
    : [
        { id: 'home', label: 'Accueil', icon: HomeIcon, href: '/' },
        { id: 'for-you', label: 'Pour vous', icon: UserGroupIcon, href: '/for-you' },
        { id: 'my-list', label: 'Ma liste', icon: BookmarkIcon, href: '/my-list' },
        { id: 'premium', label: 'Primes', icon: TrophyIcon, href: '/premium' },
        { id: 'profile', label: 'Profil', icon: UserCircleIcon, href: '/profile' },
      ]

  if (loading) {
    return (
      <div>
        <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pb-20">
      <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Onglets catégories - design sombre */}
      <div className="sticky top-16 z-20 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative">
            <div 
              ref={scrollContainerRef}
              className="flex items-center justify-start lg:justify-center gap-1 overflow-x-auto py-3 scrollbar-hide"
              style={{ scrollBehavior: 'smooth' }}
            >
              {horizontalCategories.slice(0, -1).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                    activeCategory === cat.id
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-amber-400'
                  }`}
                >
                  <span className="mr-1">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
              
              <div className="flex-shrink-0 sticky right-0 bg-gradient-to-l from-gray-900 via-gray-900 to-transparent pl-4">
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 flex items-center gap-1 ${
                    showCategoryModal 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-amber-400'
                  }`}
                >
                  <span>📂 Catégories</span>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${showCategoryModal ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Catégories - sombre */}
      {showCategoryModal && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-fadeIn" onClick={() => setShowCategoryModal(false)} />
          <div ref={modalRef} className="fixed bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl z-50 animate-slideUp max-h-[80vh] overflow-hidden shadow-2xl border-t border-gray-800">
            <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">📂 Toutes les catégories</h2>
              <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-gray-800 rounded-full transition">
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[70vh] p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {allCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                      activeCategory === cat.id
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-amber-400'
                    }`}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="font-medium">{cat.label}</span>
                    {activeCategory === cat.id && <span className="ml-auto text-white">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Section SÉRIES - design sombre chic */}
      {series.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
              <TvIcon className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">📺 Séries</h2>
            <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded-full">
              {series.length}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {series.map((serie, index) => (
              <Link 
                key={serie.id} 
                href={`/series/${serie.id}`} 
                className="group"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-1 transition-all duration-300">
                  <div className="relative aspect-[4/5] bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                    {serie.coverImage ? (
                      <>
                        <img src={serie.coverImage} alt={serie.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">🎬</div>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded-full">
                      {serie.totalEpisodes} ép.
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                      <PlayIcon className="w-10 h-10 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <div className="p-2.5">
                    <h3 className="font-semibold text-sm text-white line-clamp-1 group-hover:text-amber-400 transition">
                      {serie.title}
                    </h3>
                    <p className="text-[11px] text-gray-400 line-clamp-2 mt-1">
                      {serie.description}
                    </p>
                  </div>
                  <div className="absolute inset-0 rounded-xl border border-gray-700 group-hover:border-amber-500/30 transition-all duration-300 pointer-events-none"></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Section FILMS - design sombre chic */}
      {movies.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
              <FilmIcon className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">🎬 Films</h2>
            <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded-full">
              {movies.length}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {movies.map((movie, index) => (
              <Link 
                key={movie.id} 
                href={`/video/${movie.id}`} 
                className="group"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-1 transition-all duration-300">
                  <div className="relative aspect-[4/5] bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                    {movie.coverImage ? (
                      <>
                        <img src={movie.coverImage} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">🎬</div>
                    )}
                    <div className="absolute bottom-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
                      {movie.price} coins
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                      <PlayIcon className="w-10 h-10 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <div className="p-2.5">
                    <h3 className="font-semibold text-sm text-white line-clamp-1 group-hover:text-amber-400 transition">
                      {movie.title}
                    </h3>
                    <p className="text-[11px] text-gray-400 line-clamp-2 mt-1">
                      {movie.description}
                    </p>
                  </div>
                  <div className="absolute inset-0 rounded-xl border border-gray-700 group-hover:border-amber-500/30 transition-all duration-300 pointer-events-none"></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Aucun contenu */}
      {series.length === 0 && movies.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-800">
            <div className="text-6xl mb-4">🎬</div>
            <p className="text-gray-400">Aucun contenu dans cette catégorie</p>
            <p className="text-sm text-gray-500 mt-2">Revenez plus tard pour découvrir nos séries et films</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer footerTabs={footerTabs} activeFooterTab={activeFooterTab} setActiveFooterTab={setActiveFooterTab} />

      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}