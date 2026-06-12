"use client"

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { 
  FilmIcon, TvIcon, PlayIcon, UserCircleIcon, SparklesIcon, 
  HomeIcon, UserGroupIcon, BookmarkIcon, ShieldCheckIcon, TrophyIcon, LockClosedIcon 
} from '@heroicons/react/24/outline'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useRequireAuth } from '../hooks/useRequireAuth'
// ✅ IMPORT errorHandler
import { safeFetch, silentFetch, handleError } from '../utils/errorHandler'

interface Series { 
  id: string; title: string; description: string; coverImage: string; 
  totalEpisodes: number; totalViews: number; category: string; 
  creator: { name: string; phone: string }; createdAt: string; type: 'series' 
}

interface Movie { 
  id: string; title: string; description: string; coverImage: string; 
  thumbnail?: string; duration: number; price: number; totalViews: number; 
  category: string; creator: { name: string; phone: string }; 
  createdAt: string; type: 'movie' 
}

export default function ForYouPage() {
  const { data: session } = useSession()
  const { isAuthorized, isLoading: authLoading } = useRequireAuth()
  const [series, setSeries] = useState<Series[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [preferredCategory, setPreferredCategory] = useState('')
  const [activeFooterTab, setActiveFooterTab] = useState('for-you')
  const [ratings, setRatings] = useState<Record<string, { average: number; count: number }>>({})

  useEffect(() => { 
    if (!isAuthorized) return
    fetchRecommendations() 
  }, [isAuthorized])

  // ✅ NOUVELLE VERSION de fetchRatings avec silentFetch
  const fetchRatings = async (seriesIds: string[], movieIds: string[]) => {
    try {
      const results: Record<string, { average: number; count: number }> = {}
      
      // Pour les films
      if (movieIds.length > 0) {
        await Promise.all(movieIds.map(async (id) => {
          const data = await silentFetch<{ average: number; count: number }>(`/api/ratings/${id}`)
          if (data) results[id] = { average: data.average || 0, count: data.count || 0 }
        }))
      }
      
      // Pour les séries
      if (seriesIds.length > 0) {
        await Promise.all(seriesIds.map(async (id) => {
          const data = await silentFetch<{ average: number; count: number }>(`/api/ratings/series/${id}`)
          if (data) results[id] = { average: data.average || 0, count: data.count || 0 }
        }))
      }
      
      setRatings(results)
    } catch (error) {
      handleError(error, 'fetchRatings (for-you)')
    }
  }

  // ✅ NOUVELLE VERSION de fetchRecommendations avec safeFetch
  const fetchRecommendations = async () => {
    setLoading(true)
    try {
      const data = await safeFetch<{ movies: Movie[]; series: Series[]; preferredCategory: string }>(
        '/api/public/recommendations',
        undefined,
        'fetchRecommendations'
      )
      
      if (data) {
        setMovies(Array.isArray(data.movies) ? data.movies : [])
        setSeries(Array.isArray(data.series) ? data.series : [])
        setPreferredCategory(data.preferredCategory || 'tendances')
        
        const sIds = (data.series || []).map((x: any) => x.id)
        const mIds = (data.movies || []).map((x: any) => x.id)
        if (sIds.length > 0 || mIds.length > 0) {
          fetchRatings(sIds, mIds)
        }
      } else {
        // En cas d'erreur, on garde des tableaux vides
        setMovies([])
        setSeries([])
      }
    } catch (error) {
      // Le safeFetch a déjà toasté, on reset juste les états
      setMovies([])
      setSeries([])
    } finally {
      setLoading(false)
    }
  }

  const getMovieImage = (movie: Movie): string | null => movie.coverImage || movie.thumbnail || null
  const getSeriesImage = (serie: Series): string | null => serie.coverImage || null

  const footerTabs = [
    { id: 'home', label: 'Accueil', icon: HomeIcon, href: '/' },
    { id: 'for-you', label: 'Pour vous', icon: UserGroupIcon, href: '/for-you' },
    { id: 'my-list', label: 'Ma liste', icon: BookmarkIcon, href: '/my-list' },
    { id: 'premium', label: 'Primes', icon: TrophyIcon, href: '/premium' },
    { id: 'Admin', label: 'Admin', icon: ShieldCheckIcon, href: '/admin/dashboard' },
  ]

  // Vérification d'authentification
  if (!isAuthorized && !authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1A0A00] via-[#0D0D0D] to-[#0D0D0D]">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] px-4">
          <div className="w-24 h-24 rounded-2xl bg-[#1A1A2E] border border-[#8B5A2B]/20 flex items-center justify-center mb-6 shadow-xl">
            <LockClosedIcon className="w-12 h-12 text-[#FF6B35]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Accès restreint</h2>
          <p className="text-sm text-[#D4A855]/70 text-center max-w-sm">
            Connectez-vous pour découvrir des recommandations personnalisées
          </p>
        </div>
      </div>
    )
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1A0A00] via-[#0D0D0D] to-[#0D0D0D]">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-[#1A1A2E]/80 flex items-center justify-center p-3 animate-pulse border border-[#8B5A2B]/30">
                <img src="/logo-kahonyn.png" alt="Kahonyn" className="w-14 h-14 object-contain" />
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
    <div className="min-h-screen bg-gradient-to-b from-[#1A0A00] via-[#0D0D0D] to-[#0D0D0D] pb-20">
      {/* Effet de lueur marron en haut */}
      <div className="fixed top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#8B5A2B]/10 via-[#8B5A2B]/5 to-transparent pointer-events-none z-0"></div>
      
      <Navbar hideCategories={true} />

      <div className="sticky top-12 z-20 bg-[#0D0D0D]/98 backdrop-blur-xl border-b border-[#8B5A2B]/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF6B35]/20">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#FFFFFF]">Pour vous</h2>
            </div>
          </div>
        </div>
      </div>

      {/* FILMS */}
      {movies.length > 0 && (
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div>
              <p className="text-sm text-[#D4A855]/70 font-medium">🎬 {movies.length} Films recommandés</p>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2.5">
            {movies.map((movie, index) => {
              const imageUrl = getMovieImage(movie)
              return (
                <Link key={movie.id} href={`/video/${movie.id}?autoplay=true`} className="group" style={{ animationDelay: `${index * 0.03}s` }}>
                  <div className="relative rounded-xl overflow-hidden bg-[#1A1A2E] border border-[#8B5A2B]/10 hover:border-[#FF6B35]/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#FF6B35]/10">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      {imageUrl ? (
                        <>
                          <img src={imageUrl} alt={movie.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" loading="lazy" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A00]/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#1A1A2E] to-[#2A1A0E] flex items-center justify-center">
                          <FilmIcon className="w-10 h-10 text-[#8B5A2B]/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition duration-300">
                          <PlayIcon className="w-6 h-6 text-[#FF6B35] ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="bg-gradient-to-r from-[#D4A855] to-[#E5C87B] text-[#1A0A00] text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
                          🪙 {movie.price || 0}
                        </span>
                      </div>
                    </div>
                    <div className="p-2.5">
                      <h3 className="font-semibold text-xs text-white line-clamp-1 group-hover:text-[#FF6B35] transition">
                        {movie.title}
                      </h3>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-white/50 font-medium">
                          {movie.duration ? `${Math.floor(movie.duration / 60)}min` : '--'}
                        </span>
                        {ratings[movie.id]?.average > 0 && (
                          <div className="flex items-center gap-0.5">
                            <span className="text-yellow-500 text-[10px]">⭐</span>
                            <span className="text-[10px] font-bold text-white/80">
                              {ratings[movie.id].average.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* SÉRIES */}
      {series.length > 0 && (
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div>
              <p className="text-sm text-[#D4A855]/70 font-medium">📺 {series.length} séries recommandées</p>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2.5">
            {series.map((serie, index) => {
              const imageUrl = getSeriesImage(serie)
              return (
                <Link key={serie.id} href={`/series/${serie.id}`} className="group" style={{ animationDelay: `${index * 0.03}s` }}>
                  <div className="relative rounded-xl overflow-hidden bg-[#1A1A2E] border border-[#8B5A2B]/10 hover:border-[#D4A855]/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#D4A855]/10">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      {imageUrl ? (
                        <>
                          <img src={imageUrl} alt={serie.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" loading="lazy" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A00]/80 via-transparent to-transparent opacity-60" />
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#1A1A2E] to-[#2A1A0E] flex items-center justify-center">
                          <TvIcon className="w-10 h-10 text-[#8B5A2B]/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition duration-300">
                          <PlayIcon className="w-6 h-6 text-[#D4A855] ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute top-2 left-2">
                        <span className="bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                          {serie.totalEpisodes || 0} ép.
                        </span>
                      </div>
                    </div>
                    <div className="p-2.5">
                      <h3 className="font-semibold text-xs text-white line-clamp-1 group-hover:text-[#D4A855] transition">
                        {serie.title}
                      </h3>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-white/50 font-medium">
                          {serie.totalViews?.toLocaleString() || 0} vues
                        </span>
                        {ratings[serie.id]?.average > 0 && (
                          <div className="flex items-center gap-0.5">
                            <span className="text-yellow-500 text-[10px]">⭐</span>
                            <span className="text-[10px] font-bold text-white/80">
                              {ratings[serie.id].average.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {movies.length === 0 && series.length === 0 && (
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="w-24 h-24 rounded-2xl bg-[#1A1A2E] border border-[#8B5A2B]/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🎬</span>
          </div>
          <p className="text-white font-semibold text-lg">Aucune recommandation pour le moment</p>
          <p className="text-sm text-[#D4A855]/70 mt-2">
            Regardez des vidéos pour obtenir des recommandations
          </p>
          <Link 
            href="/" 
            className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white rounded-xl font-bold hover:shadow-lg hover:shadow-[#FF6B35]/20 transition"
          >
            Découvrir des vidéos
          </Link>
        </div>
      )}

      <Footer footerTabs={footerTabs} activeFooterTab={activeFooterTab} setActiveFooterTab={setActiveFooterTab} />
    </div>
  )
}