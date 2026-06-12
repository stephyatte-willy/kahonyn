"use client"

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { HomeIcon, UserGroupIcon, BookmarkIcon, TrophyIcon, VideoCameraIcon, FilmIcon, UserCircleIcon, PlayIcon, ShieldCheckIcon, FireIcon, ClockIcon } from '@heroicons/react/24/outline'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Image from 'next/image'


// ✅ 1. IMPORTER errorHandler
import { safeFetch, silentFetch, handleError } from '../utils/errorHandler'

interface Series { id: string; title: string; description: string; coverImage: string; totalEpisodes: number; totalViews: number; category: string; creator: { name: string; phone: string }; createdAt: string; type: 'series' }
interface Movie { id: string; title: string; description: string; coverImage: string; duration: number; price: number; totalViews: number; category: string; creator: { name: string; phone: string }; createdAt: string; type: 'movie' }
interface Category { id: string; label: string; icon: string }

const horizontalCategories = [
  { id: 'popular', label: 'Populaires', icon: '🔥' }, { id: 'anime', label: 'Animé', icon: '🎌' }, { id: 'unpublished', label: 'Inédit', icon: '✨' },
  { id: 'ranking', label: 'Classement', icon: '🏆' }, { id: 'dubbed', label: 'Doublés', icon: '🎤' }, { id: 'vip', label: 'VIP', icon: '👑' },
  { id: 'women', label: 'Femmes', icon: '👩' }, { id: 'men', label: 'Hommes', icon: '👨' },
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
  const isAdmin = (session?.user as any)?.role === 'admin'
  const [ratings, setRatings] = useState<Record<string, { average: number; count: number }>>({})

  useEffect(() => { fetchCategories(); fetchContent() }, [])
  useEffect(() => { fetchContent() }, [activeCategory])

  // ✅ 2. NOUVELLE VERSION de fetchCategories avec safeFetch
  const fetchCategories = async () => {
    const data = await safeFetch<Category[]>('/api/public/categories', undefined, 'fetchCategories')
    if (data && data.length > 0) {
      setAllCategories(data)
    }
  }
  
  // ✅ 3. NOUVELLE VERSION de fetchRatings (utilise silentFetch car pas besoin de toast pour chaque note)
  const fetchRatings = async (seriesIds: string[], movieIds: string[]) => {
    try {
      const results: Record<string, { average: number; count: number }> = {}
      
      // Pour les films
      await Promise.all(movieIds.map(async (id) => {
        const data = await silentFetch<{ average: number; count: number }>(`/api/ratings/${id}`)
        if (data) results[id] = { average: data.average || 0, count: data.count || 0 }
      }))
      
      // Pour les séries
      await Promise.all(seriesIds.map(async (id) => {
        const data = await silentFetch<{ average: number; count: number }>(`/api/ratings/series/${id}`)
        if (data) results[id] = { average: data.average || 0, count: data.count || 0 }
      }))
      
      setRatings(results)
    } catch (error) {
      // On utilise handleError mais on ne bloque pas l'affichage
      handleError(error, 'fetchRatings')
    }
  }

  // ✅ 4. NOUVELLE VERSION de fetchContent avec safeFetch
  const fetchContent = async () => {
    setLoading(true)
    try {
      const data = await safeFetch<{ series: Series[]; movies: Movie[] }>(
        `/api/public/videos-by-category?category=${activeCategory}`,
        undefined,
        'fetchContent'
      )
      
      if (data) {
        setSeries(data.series || [])
        setMovies(data.movies || [])
        
        const sIds = (data.series || []).map((s: any) => s.id)
        const mIds = (data.movies || []).map((m: any) => m.id)
        if (sIds.length > 0 || mIds.length > 0) {
          fetchRatings(sIds, mIds)
        }
      } else {
        // En cas d'erreur, on garde les tableaux vides
        setSeries([])
        setMovies([])
      }
    } finally {
      setLoading(false)
    }
  }

  const footerTabs = isAdmin 
    ? [{ id: 'home', label: 'Accueil', icon: HomeIcon, href: '/' }, { id: 'for-you', label: 'Pour vous', icon: UserGroupIcon, href: '/for-you' }, { id: 'my-list', label: 'Ma liste', icon: BookmarkIcon, href: '/my-list' }, { id: 'premium', label: 'Primes', icon: TrophyIcon, href: '/premium' }, { id: 'admin', label: 'Admin', icon: ShieldCheckIcon, href: '/admin/dashboard' }]
    : [{ id: 'home', label: 'Accueil', icon: HomeIcon, href: '/' }, { id: 'for-you', label: 'Pour vous', icon: UserGroupIcon, href: '/for-you' }, { id: 'my-list', label: 'Ma liste', icon: BookmarkIcon, href: '/my-list' }, { id: 'premium', label: 'Primes', icon: TrophyIcon, href: '/premium' }, { id: 'profile', label: 'Profil', icon: UserCircleIcon, href: '/profile' }]
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1A0A00] via-[#0D0D0D] to-[#0D0D0D]">
        <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} activeCategory={activeCategory} onCategoryChange={setActiveCategory} categories={horizontalCategories} allCategories={allCategories} />
        <div className="flex items-center justify-center h-[70vh]">
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-[#1A1A2E]/80 flex items-center justify-center p-3 animate-pulse border border-[#8B5A2B]/30">
                <Image src="/logo-kahonyn.png" alt="Kahonyn" width={56} height={56} className="object-contain" priority />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FF6B35] animate-bounce"></div>
            </div>
            <p className="text-[#D4A855]/80 text-sm font-semibold">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A0A00] via-[#0D0D0D] to-[#0D0D0D] pb-16">
      {/* Effet de lueur marron en haut */}
      <div className="fixed top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#8B5A2B]/10 via-[#8B5A2B]/5 to-transparent pointer-events-none z-0"></div>
      
      <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} activeCategory={activeCategory} onCategoryChange={setActiveCategory} categories={horizontalCategories} allCategories={allCategories} />

      {/* Section SÉRIES */}
      {series.length > 0 && (
        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] flex items-center justify-center shadow-lg shadow-[#FF6B35]/20">
                <FilmIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#FFFFFF]">Séries populaires</h2>
                <p className="text-xs sm:text-sm text-[#D4A855]/70 font-medium flex items-center gap-1"><FireIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {series.length} séries</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2.5">
            {series.map((serie, index) => (
                <Link key={serie.id} href={`/series/${serie.id}?autoplay=true`} className="group">
                <div className="relative rounded-xl overflow-hidden bg-[#1A1A2E] border border-[#8B5A2B]/10 hover:border-[#FF6B35]/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#FF6B35]/10">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {serie.coverImage ? (
                      <>
                        <img src={serie.coverImage} alt={serie.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700 ease-out" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A00]/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1A1A2E] to-[#2A1A0E] flex items-center justify-center"><PlayIcon className="w-8 h-8 sm:w-10 sm:h-10 text-[#8B5A2B]/30" /></div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className="bg-black/80 backdrop-blur-md text-white text-[10px] sm:text-xs px-2 py-1 rounded-lg">{serie.totalEpisodes} ép</span>
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#FF6B35] flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition duration-300"><PlayIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white ml-0.5" /></div>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <h3 className="font-semibold text-xs sm:text-sm text-white line-clamp-1 group-hover:text-[#FF6B35] transition duration-200">{serie.title}</h3>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] sm:text-xs text-white/50 font-medium flex items-center gap-1"><PlayIcon className="w-3 h-3" /> {serie.totalViews?.toLocaleString() || 0}</span>
                      {ratings[serie.id]?.average > 0 && (
                        <div className="flex items-center gap-0.5"><span className="text-yellow-500 text-[10px]">⭐</span><span className="text-[10px] sm:text-xs font-bold text-white/80">{ratings[serie.id].average.toFixed(1)}</span></div>
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
        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#D4A855] to-[#E5C87B] flex items-center justify-center shadow-lg shadow-[#D4A855]/20">
                <VideoCameraIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#1A0A00]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">Films à l'affiche</h2>
                <p className="text-xs sm:text-sm text-[#D4A855]/70 font-medium flex items-center gap-1"><ClockIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {movies.length} films</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2.5">
            {movies.map((movie, index) => (
               <Link key={movie.id} href={`/video/${movie.id}?autoplay=true`} className="group">
                <div className="relative rounded-xl overflow-hidden bg-[#1A1A2E] border border-[#8B5A2B]/10 hover:border-[#D4A855]/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#D4A855]/10">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {movie.coverImage ? (
                      <>
                        <img src={movie.coverImage} alt={movie.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700 ease-out" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A00]/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1A1A2E] to-[#2A1A0E] flex items-center justify-center"><PlayIcon className="w-8 h-8 sm:w-10 sm:h-10 text-[#8B5A2B]/30" /></div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className="bg-gradient-to-r from-[#D4A855] to-[#E5C87B] text-[#1A0A00] text-[10px] sm:text-xs font-bold px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">🪙 {movie.price}</span>
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#D4A855] flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition duration-300"><PlayIcon className="w-6 h-6 sm:w-7 sm:h-7 text-[#1A0A00] ml-0.5" /></div>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <h3 className="font-semibold text-xs sm:text-sm text-white line-clamp-1 group-hover:text-[#D4A855] transition duration-200">{movie.title}</h3>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] sm:text-xs text-white/50 font-medium flex items-center gap-1"><ClockIcon className="w-3 h-3" /> {movie.duration || '--'} min</span>
                      {ratings[movie.id]?.average > 0 && (
                        <div className="flex items-center gap-0.5"><span className="text-yellow-500 text-[10px]">⭐</span><span className="text-[10px] sm:text-xs font-bold text-white/80">{ratings[movie.id].average.toFixed(1)}</span></div>
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
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#1A1A2E] border border-[#8B5A2B]/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl sm:text-4xl">🎬</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Encore un peu de patience</h3>
          <p className="text-sm text-[#D4A855]/60 font-medium max-w-md mx-auto">Notre équipe prépare du contenu incroyable pour vous. Revenez très bientôt !</p>
        </div>
      )}

      <Footer footerTabs={footerTabs} activeFooterTab={activeFooterTab} setActiveFooterTab={setActiveFooterTab} />
    </div>
  )
}