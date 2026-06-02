// pages/for-you.tsx
"use client"

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { 
  FilmIcon, 
  TvIcon, 
  PlayIcon,
  UserCircleIcon,
  SparklesIcon,
  HomeIcon,
  UserGroupIcon,
  BookmarkIcon,
  TrophyIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useRequireAuth } from '../hooks/useRequireAuth'
import toast from 'react-hot-toast'

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

export default function ForYouPage() {
  const { data: session } = useSession()
  const { isAuthorized, isLoading } = useRequireAuth()
  const [series, setSeries] = useState<Series[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [preferredCategory, setPreferredCategory] = useState('')
  const [activeFooterTab, setActiveFooterTab] = useState('for-you')

  useEffect(() => {
    if (!isAuthorized) return
    fetchRecommendations()
  }, [isAuthorized])

  const fetchRecommendations = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/public/recommendations')
      const data = await res.json()
      setMovies(Array.isArray(data.movies) ? data.movies : [])
      setSeries(Array.isArray(data.series) ? data.series : [])
      setPreferredCategory(data.preferredCategory || 'tendances')
    } catch (error) {
      console.error('Erreur:', error)
      setMovies([])
      setSeries([])
    } finally {
      setLoading(false)
    }
  }

  const footerTabs = [
    { id: 'home', label: 'Accueil', icon: HomeIcon, href: '/' },
    { id: 'for-you', label: 'Pour vous', icon: UserGroupIcon, href: '/for-you' },
    { id: 'my-list', label: 'Ma liste', icon: BookmarkIcon, href: '/my-list' },
    { id: 'premium', label: 'Primes', icon: TrophyIcon, href: '/premium' },
    { id: 'profile', label: 'Profil', icon: UserCircleIcon, href: '/profile' },
  ]

  // Afficher un message si non connecté
  if (!isAuthorized && !isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8]">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] px-4">
          <div className="w-20 h-20 rounded-2xl bg-[#EDE4D8] border border-[#D4A855]/20 flex items-center justify-center mb-6">
            <LockClosedIcon className="w-10 h-10 text-[#FF6B35]" />
          </div>
          <h2 className="text-xl font-bold text-[#3D2B1F] mb-2">Accès restreint</h2>
          <p className="text-sm text-[#8B5A2B]/80 text-center max-w-sm">
            Connectez-vous pour découvrir des recommandations personnalisées basées sur vos goûts
          </p>
        </div>
      </div>
    )
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8]">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-20">
      <Navbar />

      {/* En-tête */}
      <div className="sticky top-12 z-20 bg-[#0D0D1A]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] rounded-xl flex items-center justify-center shadow-md shadow-[#FF6B35]/20">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Pour vous</h1>
              <p className="text-xs text-[#D4A855]/60">
                Recommandations basées sur vos goûts ({preferredCategory})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section FILMS recommandés */}
      {movies.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[#D4A855]/10 shadow-lg shadow-[#8B5A2B]/5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] flex items-center justify-center shadow-md">
                <FilmIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#5C3D2E]">🎬 Films recommandés</h2>
                <p className="text-[11px] text-[#8B5A2B]/60">{movies.length} films</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2.5">
              {movies.map((movie, index) => (
                <Link 
                  key={movie.id} 
                  href={`/video/${movie.id}`} 
                  className="group"
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <div className="relative rounded-xl overflow-hidden bg-white border border-[#D4A855]/10 hover:border-[#FF6B35]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#8B5A2B]/10">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      {movie.coverImage ? (
                        <img src={movie.coverImage} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#F5F0E8] to-[#E8D5B5]/30 flex items-center justify-center">
                          <span className="text-2xl">🎬</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-[#5C3D2E]/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <PlayIcon className="w-8 h-8 text-white drop-shadow-lg" />
                      </div>
                      <div className="absolute top-1.5 right-1.5 bg-gradient-to-r from-[#D4A855] to-[#E5C87B] text-[#5C3D2E] text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
                        {movie.price} coins
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <h3 className="font-medium text-[11px] text-[#5C3D2E] line-clamp-1 group-hover:text-[#FF6B35] transition leading-tight">
                        {movie.title}
                      </h3>
                      <p className="text-[9px] text-[#8B5A2B]/60 line-clamp-1 mt-0.5">
                        {movie.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section SÉRIES recommandées */}
      {series.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[#D4A855]/10 shadow-lg shadow-[#8B5A2B]/5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4A855] to-[#E5C87B] flex items-center justify-center shadow-md">
                <TvIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#5C3D2E]">📺 Séries recommandées</h2>
                <p className="text-[11px] text-[#8B5A2B]/60">{series.length} séries</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2.5">
              {series.map((serie, index) => (
                <Link 
                  key={serie.id} 
                  href={`/series/${serie.id}`} 
                  className="group"
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <div className="relative rounded-xl overflow-hidden bg-white border border-[#D4A855]/10 hover:border-[#D4A855]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#8B5A2B]/10">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      {serie.coverImage ? (
                        <img src={serie.coverImage} alt={serie.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#F5F0E8] to-[#E8D5B5]/30 flex items-center justify-center">
                          <span className="text-2xl">🎬</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-[#5C3D2E]/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <PlayIcon className="w-8 h-8 text-white drop-shadow-lg" />
                      </div>
                      <div className="absolute top-1.5 left-1.5 bg-white/95 backdrop-blur-sm text-[#FF6B35] text-[9px] font-semibold px-1.5 py-0.5 rounded-md shadow-sm">
                        {serie.totalEpisodes} ép.
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <h3 className="font-medium text-[11px] text-[#5C3D2E] line-clamp-1 group-hover:text-[#D4A855] transition leading-tight">
                        {serie.title}
                      </h3>
                      <p className="text-[9px] text-[#8B5A2B]/60 line-clamp-1 mt-0.5">
                        {serie.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {movies.length === 0 && series.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-[#D4A855]/10 shadow-lg shadow-[#8B5A2B]/5">
            <div className="text-5xl mb-4">🎬</div>
            <p className="text-[#5C3D2E] font-medium">Aucune recommandation pour le moment</p>
            <p className="text-sm text-[#8B5A2B]/60 mt-2">Regardez des vidéos pour obtenir des recommandations personnalisées</p>
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