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
      if (data && data.length > 0) {
        setAllCategories(data)
      }
    } catch (error) {
      console.error('Erreur fetchCategories:', error)
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
        <Navbar 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          categories={horizontalCategories}
          allCategories={allCategories}
        />
        <div className="flex items-center justify-center h-[70vh]">
          <div className="flex flex-col items-center gap-5">
  <div className="relative">
    <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center p-2 animate-pulse border border-[#D4A855]/20">
      <Image
        src="/logo-kahonyn.png"
        alt="Kahonyn"
        width={48}
        height={48}
        className="object-contain"
        priority
      />
    </div>
    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FF6B35] animate-bounce"></div>
  </div>
  <p className="text-[#8B5A2B]/80 text-sm font-bold">Chargement...</p>
</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-14">
      <Navbar 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        categories={horizontalCategories}
        allCategories={allCategories}
      />

      {/* Section SÉRIES */}
      {series.length > 0 && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] flex items-center justify-center shadow-md">
                <PlayIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900">Séries populaires</h2>
                <p className="text-[10px] sm:text-[11px] text-gray-700 font-bold flex items-center gap-1">
                  <FireIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {series.length} séries
                </p>
              </div>
            </div>
            <Link href="/series" className="px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-[#FF6B35] hover:bg-[#FF6B35]/10 rounded-lg transition border border-[#FF6B35]/30">
              Voir tout →
            </Link>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2">
            {series.map((serie, index) => (
              <Link 
                key={serie.id} 
                href={`/series/${serie.id}`} 
                className="group"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="relative rounded-lg overflow-hidden bg-[#EDE4D8] hover:bg-[#E8DCCF] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {serie.coverImage ? (
                      <>
                        <img 
                          src={serie.coverImage} 
                          alt={serie.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500 ease-out" 
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#E8DCCF] to-[#D9CBB8] flex items-center justify-center">
                        <PlayIcon className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="absolute top-1 left-1">
                      <span className="bg-black/70 backdrop-blur-sm text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                        {serie.totalEpisodes} ép.
                      </span>
                    </div>
                    
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FF6B35] flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition duration-300">
                        <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-1.5 sm:p-2">
                    <h3 className="font-bold text-[10px] sm:text-[11px] text-gray-900 line-clamp-1 group-hover:text-[#FF6B35] transition duration-200 leading-tight">
                      {serie.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[8px] sm:text-[9px] text-gray-600 font-bold flex items-center gap-0.5">
                        <FireIcon className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                        {serie.totalViews?.toLocaleString() || 0}
                      </span>
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-[#D4A855] to-[#E5C87B] flex items-center justify-center shadow-md">
                <PlayIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900">Films à l'affiche</h2>
                <p className="text-[10px] sm:text-[11px] text-gray-700 font-bold flex items-center gap-1">
                  <ClockIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {movies.length} films
                </p>
              </div>
            </div>
            <Link href="/movies" className="px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-[#D4A855] hover:bg-[#D4A855]/10 rounded-lg transition border border-[#D4A855]/30">
              Voir tout →
            </Link>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2">
            {movies.map((movie, index) => (
              <Link 
                key={movie.id} 
                href={`/video/${movie.id}`} 
                className="group"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="relative rounded-lg overflow-hidden bg-[#EDE4D8] hover:bg-[#E8DCCF] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {movie.coverImage ? (
                      <>
                        <img 
                          src={movie.coverImage} 
                          alt={movie.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500 ease-out" 
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#E8DCCF] to-[#D9CBB8] flex items-center justify-center">
                        <PlayIcon className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="absolute top-1 right-1">
                      <span className="bg-gradient-to-r from-[#D4A855] to-[#E5C87B] text-gray-900 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm flex items-center gap-0.5">
                        🪙 {movie.price}
                      </span>
                    </div>
                    
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#D4A855] flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition duration-300">
                        <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-1.5 sm:p-2">
                    <h3 className="font-bold text-[10px] sm:text-[11px] text-gray-900 line-clamp-1 group-hover:text-[#D4A855] transition duration-200 leading-tight">
                      {movie.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[8px] sm:text-[9px] text-gray-600 font-bold flex items-center gap-0.5">
                        <ClockIcon className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                        {movie.duration || '--'} min
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* État vide */}
      {series.length === 0 && movies.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#EDE4D8] border border-[#D4A855]/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl sm:text-3xl">🎬</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Encore un peu de patience</h3>
          <p className="text-xs sm:text-sm text-gray-600 font-bold max-w-md mx-auto">
            Notre équipe prépare du contenu incroyable pour vous. Revenez très bientôt !
          </p>
        </div>
      )}

      <Footer footerTabs={footerTabs} activeFooterTab={activeFooterTab} setActiveFooterTab={setActiveFooterTab} />
    </div>
  )
}