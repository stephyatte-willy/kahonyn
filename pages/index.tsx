// pages/index.tsx - Version sans cadres blancs, fond beige total
"use client"

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { 
  ChevronDownIcon,
  XMarkIcon,
  HomeIcon,
  UserGroupIcon,
  BookmarkIcon,
  TrophyIcon,
  UserCircleIcon,
  PlayIcon,
  ShieldCheckIcon,
  SparklesIcon,
  FireIcon,
  ClockIcon
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
      <div className="min-h-screen bg-[#F5F0E8]">
        <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6B35]/20 to-[#D4A855]/20 border border-[#D4A855]/20 flex items-center justify-center animate-pulse">
                <SparklesIcon className="w-8 h-8 text-[#D4A855]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FF6B35] animate-bounce"></div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-[#FF6B35] animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 rounded-full bg-[#D4A855] animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                <div className="w-2 h-2 rounded-full bg-[#FF6B35] animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              </div>
              <p className="text-[#8B5A2B]/60 text-sm font-light tracking-widest uppercase">Chargement</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-20 relative">
      {/* Fond subtil avec texture légère */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#D4A85520_0%,transparent_50%)]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,#8B5A2B10_0%,transparent_40%)]" />
      </div>

      <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      
      {/* Catégories - fond sombre conservé */}
      <div className="relative z-10 sticky top-16 bg-[#0D0D1A]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-start lg:justify-center gap-2 overflow-x-auto py-3 scrollbar-hide" ref={scrollContainerRef}>
            {horizontalCategories.slice(0, -1).map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-300 ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-lg shadow-[#FF6B35]/20'
                    : 'bg-white/[0.04] text-[#D4A855]/70 hover:bg-white/[0.08] hover:text-[#D4A855] border border-white/[0.04]'
                }`}
              >
                <span className="mr-1.5">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
            
            <button
              onClick={() => setShowCategoryModal(true)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 ${
                showCategoryModal 
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-lg shadow-[#FF6B35]/20'
                  : 'bg-white/[0.04] text-[#D4A855]/70 hover:bg-white/[0.08] hover:text-[#D4A855] border border-white/[0.04]'
              }`}
            >
              <span>📂</span>
              <span>Catégories</span>
              <ChevronDownIcon className={`w-3 h-3 transition-transform duration-300 ${showCategoryModal ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Catégories - fond sombre conservé */}
      {showCategoryModal && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fadeIn" onClick={() => setShowCategoryModal(false)} />
          <div ref={modalRef} className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#1A1A35] to-[#202045] rounded-t-[2.5rem] z-50 animate-slideUp max-h-[80vh] overflow-hidden shadow-2xl border-t border-white/[0.06]">
            <div className="sticky top-0 bg-[#1A1A35]/95 backdrop-blur-xl p-6 border-b border-white/[0.04] flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-white">Toutes les catégories</h2>
                <p className="text-xs text-[#D4A855]/50 mt-0.5">Choisissez votre univers</p>
              </div>
              <button onClick={() => setShowCategoryModal(false)} className="p-2.5 hover:bg-white/[0.05] rounded-xl transition">
                <XMarkIcon className="w-5 h-5 text-[#D4A855]" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[70vh] p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {allCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 ${
                      activeCategory === cat.id
                        ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-lg shadow-[#FF6B35]/20'
                        : 'bg-white/[0.04] text-[#D4A855]/80 hover:bg-white/[0.08] hover:text-[#D4A855] border border-white/[0.04]'
                    }`}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="font-medium text-sm">{cat.label}</span>
                    {activeCategory === cat.id && <span className="ml-auto text-white">✦</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Section SÉRIES - Fond beige total, SANS cadre blanc */}
      {series.length > 0 && (
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
          {/* En-tête de section */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] flex items-center justify-center shadow-md">
                <PlayIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#5C3D2E]">Séries populaires</h2>
                <p className="text-[11px] text-[#8B5A2B]/60 flex items-center gap-1.5">
                  <FireIcon className="w-3 h-3" />
                  {series.length} séries disponibles
                </p>
              </div>
            </div>
            <Link href="/series" className="px-3 py-1.5 text-[11px] font-medium text-[#FF6B35] hover:bg-[#FF6B35]/5 rounded-lg transition border border-[#FF6B35]/20">
              Voir tout →
            </Link>
          </div>
          
          {/* Grille de vignettes - directement sur le fond beige */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2.5">
            {series.map((serie, index) => (
              <Link 
                key={serie.id} 
                href={`/series/${serie.id}`} 
                className="group"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="relative rounded-xl overflow-hidden bg-[#EDE4D8] hover:bg-[#E8DCCF] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#8B5A2B]/15">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {serie.coverImage ? (
                      <>
                        <img 
                          src={serie.coverImage} 
                          alt={serie.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500 ease-out" 
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#5C3D2E]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#E8DCCF] to-[#D9CBB8] flex items-center justify-center">
                        <PlayIcon className="w-7 h-7 text-[#8B5A2B]/20" />
                      </div>
                    )}
                    
                    {/* Badge épisodes */}
                    <div className="absolute top-1.5 left-1.5">
                      <span className="bg-[#F5F0E8]/95 backdrop-blur-sm text-[#FF6B35] text-[9px] font-semibold px-1.5 py-0.5 rounded-md shadow-sm">
                        {serie.totalEpisodes} ép.
                      </span>
                    </div>
                    
                    {/* Overlay play au hover */}
                    <div className="absolute inset-0 bg-[#5C3D2E]/30 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-[#FF6B35]/90 flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition duration-300">
                        <PlayIcon className="w-5 h-5 text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Infos */}
                  <div className="p-2">
                    <h3 className="font-medium text-[11px] text-[#5C3D2E] line-clamp-1 group-hover:text-[#FF6B35] transition duration-200 leading-tight">
                      {serie.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-[#8B5A2B]/50 font-medium flex items-center gap-0.5">
                        <FireIcon className="w-2.5 h-2.5" />
                        {serie.totalViews?.toLocaleString() || 0}
                      </span>
                      <span className="text-[9px] text-[#8B5A2B]/40">
                        {serie.category || 'Série'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Section FILMS - Fond beige total, SANS cadre blanc */}
      {movies.length > 0 && (
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
          {/* En-tête de section */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4A855] to-[#E5C87B] flex items-center justify-center shadow-md">
                <PlayIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#5C3D2E]">Films à l'affiche</h2>
                <p className="text-[11px] text-[#8B5A2B]/60 flex items-center gap-1.5">
                  <ClockIcon className="w-3 h-3" />
                  {movies.length} films disponibles
                </p>
              </div>
            </div>
            <Link href="/movies" className="px-3 py-1.5 text-[11px] font-medium text-[#D4A855] hover:bg-[#D4A855]/5 rounded-lg transition border border-[#D4A855]/20">
              Voir tout →
            </Link>
          </div>
          
          {/* Grille de vignettes - directement sur le fond beige */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2.5">
            {movies.map((movie, index) => (
              <Link 
                key={movie.id} 
                href={`/video/${movie.id}`} 
                className="group"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="relative rounded-xl overflow-hidden bg-[#EDE4D8] hover:bg-[#E8DCCF] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#8B5A2B]/15">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {movie.coverImage ? (
                      <>
                        <img 
                          src={movie.coverImage} 
                          alt={movie.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500 ease-out" 
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#5C3D2E]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#E8DCCF] to-[#D9CBB8] flex items-center justify-center">
                        <PlayIcon className="w-7 h-7 text-[#8B5A2B]/20" />
                      </div>
                    )}
                    
                    {/* Badge prix */}
                    <div className="absolute top-1.5 right-1.5">
                      <span className="bg-gradient-to-r from-[#D4A855] to-[#E5C87B] text-[#5C3D2E] text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm flex items-center gap-0.5">
                        🪙 {movie.price}
                      </span>
                    </div>
                    
                    {/* Overlay play au hover */}
                    <div className="absolute inset-0 bg-[#5C3D2E]/30 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-[#D4A855]/90 flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition duration-300">
                        <PlayIcon className="w-5 h-5 text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Infos */}
                  <div className="p-2">
                    <h3 className="font-medium text-[11px] text-[#5C3D2E] line-clamp-1 group-hover:text-[#D4A855] transition duration-200 leading-tight">
                      {movie.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-[#8B5A2B]/50 font-medium flex items-center gap-0.5">
                        <ClockIcon className="w-2.5 h-2.5" />
                        {movie.duration || '--'} min
                      </span>
                      <span className="text-[9px] text-[#8B5A2B]/40">
                        {movie.category || 'Film'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Aucun contenu - Fond beige total */}
      {series.length === 0 && movies.length === 0 && (
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#EDE4D8] border border-[#D4A855]/10 flex items-center justify-center mx-auto mb-5">
              <span className="text-3xl">🎬</span>
            </div>
            <h3 className="text-lg font-bold text-[#5C3D2E] mb-2">Encore un peu de patience</h3>
            <p className="text-sm text-[#8B5A2B]/60 font-light max-w-md mx-auto leading-relaxed">
              Notre équipe prépare du contenu incroyable pour vous. Revenez très bientôt !
            </p>
          </div>
        </div>
      )}

      <Footer footerTabs={footerTabs} activeFooterTab={activeFooterTab} setActiveFooterTab={setActiveFooterTab} />
    </div>
  )
}