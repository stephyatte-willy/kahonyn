"use client"

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { 
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
import Image from 'next/image'

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
  const [activeFooterTab, setActiveFooterTab] = useState('home')
  const [allCategories, setAllCategories] = useState<Category[]>(horizontalCategories)
  const isAdmin = session?.user?.role === 'admin'
  const [ratings, setRatings] = useState<Record<string, { average: number; count: number }>>({})

  useEffect(() => {
    fetchCategories()
    fetchContent()
  }, [])

  useEffect(() => {
    fetchContent()
  }, [activeCategory])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/public/categories')
      const data = await res.json()
      if (data && data.length > 0) setAllCategories(data)
    } catch (error) { console.error('Erreur fetchCategories:', error) }
  }
  
  const fetchRatings = async (seriesIds: string[], movieIds: string[]) => {
    try {
      const results: Record<string, { average: number; count: number }> = {}
      await Promise.all(movieIds.map(async (id) => {
        try {
          const res = await fetch(`/api/ratings/${id}`)
          if (res.ok) { const data = await res.json(); results[id] = { average: data.average || 0, count: data.count || 0 } }
        } catch (e) {}
      }))
      await Promise.all(seriesIds.map(async (id) => {
        try {
          const res = await fetch(`/api/ratings/series/${id}`)
          if (res.ok) { const data = await res.json(); results[id] = { average: data.average || 0, count: data.count || 0 } }
        } catch (e) {}
      }))
      setRatings(results)
    } catch (error) { console.error('Erreur chargement notes:', error) }
  }

  const fetchContent = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/public/videos-by-category?category=${activeCategory}`)
      const data = await res.json()
      setSeries(data.series || [])
      setMovies(data.movies || [])
      const seriesIds = (data.series || []).map((s: any) => s.id)
      const movieIds = (data.movies || []).map((m: any) => m.id)
      if (seriesIds.length > 0 || movieIds.length > 0) fetchRatings(seriesIds, movieIds)
    } catch (error) { console.error('Erreur fetchContent:', error) }
    finally { setLoading(false) }
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
      <div className="min-h-screen bg-[#0D0D0D]">
        <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} activeCategory={activeCategory} onCategoryChange={setActiveCategory} categories={horizontalCategories} allCategories={allCategories} />
        <div className="flex items-center justify-center h-[70vh]">
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-white/[0.04] flex items-center justify-center p-3 animate-pulse border border-white/[0.06]">
                <Image src="/logo-kahonyn.png" alt="Kahonyn" width={56} height={56} className="object-contain" priority />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FF6B35] animate-bounce"></div>
            </div>
            <p className="text-white/60 text-sm font-semibold">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-16">
      <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} activeCategory={activeCategory} onCategoryChange={setActiveCategory} categories={horizontalCategories} allCategories={allCategories} />

      {/* Section SÉRIES */}
      {series.length > 0 && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] flex items-center justify-center shadow-lg shadow-[#FF6B35]/20">
                <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">Séries populaires</h2>
                <p className="text-xs sm:text-sm text-white/50 font-medium flex items-center gap-1">
                  <FireIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {series.length} séries
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2.5">
            {series.map((serie, index) => (
              <Link key={serie.id} href={`/series/${serie.id}`} className="group" style={{ animationDelay: `${index * 0.03}s` }}>
                <div className="relative rounded-xl overflow-hidden bg-[#1A1A2E] border border-white/[0.04] hover:border-[#FF6B35]/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#FF6B35]/10">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {serie.coverImage ? (
                      <>
                        <img src={serie.coverImage} alt={serie.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700 ease-out" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1A1A2E] to-[#2A2A4E] flex items-center justify-center">
                        <PlayIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white/20" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className="bg-black/80 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-lg">
                        {serie.totalEpisodes} ép.
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#FF6B35] flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition duration-300">
                        <PlayIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <h3 className="font-semibold text-xs sm:text-sm text-white line-clamp-1 group-hover:text-[#FF6B35] transition duration-200">
                      {serie.title}
                    </h3>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] sm:text-xs text-white/50 font-medium flex items-center gap-1">
                        <PlayIcon className="w-3 h-3" /> {serie.totalViews?.toLocaleString() || 0}
                      </span>
                      {ratings[serie.id] && ratings[serie.id].average > 0 && (
                        <div className="flex items-center gap-0.5">
                          <span className="text-yellow-500 text-[10px]">⭐</span>
                          <span className="text-[10px] sm:text-xs font-bold text-white/80">{ratings[serie.id].average.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Section FILMS */}
      {movies.length > 0 && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#D4A855] to-[#E5C87B] flex items-center justify-center shadow-lg shadow-[#D4A855]/20">
                <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#0D0D0D]" />
                  </div>
                  <div>
                <h2 className="text-base sm:text-lg font-bold text-white">Films à l'affiche</h2>
                <p className="text-xs sm:text-sm text-white/50 font-medium flex items-center gap-1">
                  <ClockIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {movies.length} films
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2.5">
            {movies.map((movie, index) => (
              <Link key={movie.id} href={`/video/${movie.id}`} className="group" style={{ animationDelay: `${index * 0.03}s` }}>
                <div className="relative rounded-xl overflow-hidden bg-[#1A1A2E] border border-white/[0.04] hover:border-[#D4A855]/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#D4A855]/10">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {movie.coverImage ? (
                      <>
                        <img src={movie.coverImage} alt={movie.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700 ease-out" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1A1A2E] to-[#2A2A4E] flex items-center justify-center">
                        <PlayIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white/20" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className="bg-gradient-to-r from-[#D4A855] to-[#E5C87B] text-[#0D0D0D] text-[10px] sm:text-xs font-bold px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
                        🪙 {movie.price}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#D4A855] flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition duration-300">
                        <PlayIcon className="w-6 h-6 sm:w-7 sm:h-7 text-[#0D0D0D] ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <h3 className="font-semibold text-xs sm:text-sm text-white line-clamp-1 group-hover:text-[#D4A855] transition duration-200">
                      {movie.title}
                    </h3>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] sm:text-xs text-white/50 font-medium flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" /> {movie.duration || '--'} min
                      </span>
                      {ratings[movie.id] && ratings[movie.id].average > 0 && (
                        <div className="flex items-center gap-0.5">
                          <span className="text-yellow-500 text-[10px]">⭐</span>
                          <span className="text-[10px] sm:text-xs font-bold text-white/80">{ratings[movie.id].average.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {series.length === 0 && movies.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#1A1A2E] border border-white/[0.06] flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl sm:text-4xl">🎬</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Encore un peu de patience</h3>
          <p className="text-sm text-white/50 font-medium max-w-md mx-auto">Notre équipe prépare du contenu incroyable pour vous. Revenez très bientôt !</p>
        </div>
      )}

      <Footer footerTabs={footerTabs} activeFooterTab={activeFooterTab} setActiveFooterTab={setActiveFooterTab} />
    </div>
  )
}