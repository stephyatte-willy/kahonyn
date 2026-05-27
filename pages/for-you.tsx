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
  TrophyIcon
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

export default function ForYouPage() {
  const { data: session } = useSession()
  const [series, setSeries] = useState<Series[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [preferredCategory, setPreferredCategory] = useState('')
  const [activeFooterTab, setActiveFooterTab] = useState('for-you')

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/public/recommendations')
      const data = await res.json()
      setMovies(data.movies || [])
      setSeries(data.series || [])
      setPreferredCategory(data.preferredCategory || 'tendances')
    } catch (error) {
      console.error('Erreur:', error)
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

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-kahonyn-lumiere to-kahonyn-sable">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kahonyn-energie"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-kahonyn-lumiere to-kahonyn-sable pb-20">
      <Navbar />

      {/* En-tête personnalisé */}
      <div className="sticky top-12 z-20 bg-white/80 backdrop-blur-md border-b border-kahonyn-sable/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-kahonyn-energie to-orange-600 rounded-xl flex items-center justify-center shadow-md">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-kahonyn-terre">Pour vous</h1>
              <p className="text-xs text-gray-500">
                {session 
                  ? `Recommandations basées sur vos goûts (${preferredCategory})`
                  : 'Tendances du moment'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section FILMS recommandés */}
      {movies.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-kahonyn-terre to-kahonyn-energie rounded-lg flex items-center justify-center shadow-sm">
              <FilmIcon className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-kahonyn-terre">🎬 Films recommandés</h2>
            <span className="px-2 py-0.5 bg-kahonyn-lumiere text-kahonyn-terre text-xs rounded-full border border-kahonyn-sable/50">
              {movies.length}
            </span>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {movies.map((movie, index) => (
              <Link 
                key={movie.id} 
                href={`/video/${movie.id}`} 
                className="group"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="relative bg-white rounded-xl overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-kahonyn-energie/20 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                  
                  <div className="relative aspect-video bg-gradient-to-br from-kahonyn-lumiere to-kahonyn-sable flex items-center justify-center overflow-hidden">
                    {movie.coverImage ? (
                      <img src={movie.coverImage} alt={movie.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                    ) : (
                      <span className="text-4xl group-hover:scale-110 transition duration-300">🎬</span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <PlayIcon className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                    <div className="absolute bottom-1.5 right-1.5 bg-gradient-to-r from-kahonyn-energie to-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                      {movie.price} coins
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <h3 className="font-semibold text-sm text-gray-800 line-clamp-1 group-hover:text-kahonyn-energie transition">
                      {movie.title}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-yellow-500">⭐ 4.8</span>
                      </div>
                      <span className="text-[9px] text-gray-400">{movie.totalViews?.toLocaleString()} vues</span>
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 rounded-xl border border-gray-100 group-hover:border-kahonyn-energie/30 transition-all duration-300 pointer-events-none"></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Section SÉRIES recommandées */}
      {series.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-kahonyn-terre to-kahonyn-energie rounded-lg flex items-center justify-center shadow-sm">
              <TvIcon className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-kahonyn-terre">📺 Séries recommandées</h2>
            <span className="px-2 py-0.5 bg-kahonyn-lumiere text-kahonyn-terre text-xs rounded-full border border-kahonyn-sable/50">
              {series.length}
            </span>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {series.map((serie, index) => (
              <Link 
                key={serie.id} 
                href={`/series/${serie.id}`} 
                className="group"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="relative bg-white rounded-xl overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-kahonyn-energie/20 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                  
                  <div className="relative aspect-video bg-gradient-to-br from-kahonyn-lumiere to-kahonyn-sable flex items-center justify-center overflow-hidden">
                    {serie.coverImage ? (
                      <img src={serie.coverImage} alt={serie.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                    ) : (
                      <span className="text-4xl group-hover:scale-110 transition duration-300">🎬</span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <PlayIcon className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                    <div className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                      {serie.totalEpisodes} ép.
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <h3 className="font-semibold text-sm text-gray-800 line-clamp-1 group-hover:text-kahonyn-energie transition">
                      {serie.title}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-yellow-500">⭐ 4.8</span>
                      </div>
                      <span className="text-[9px] text-gray-400">{serie.totalViews?.toLocaleString()} vues</span>
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 rounded-xl border border-gray-100 group-hover:border-kahonyn-energie/30 transition-all duration-300 pointer-events-none"></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Message si aucun contenu */}
      {movies.length === 0 && series.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-kahonyn-sable/30 shadow-md">
            <div className="text-6xl mb-4">🎬</div>
            <p className="text-gray-500">Aucune recommandation pour le moment</p>
            <p className="text-sm text-gray-400 mt-2">Regardez des vidéos pour obtenir des recommandations personnalisées</p>
            <Link href="/" className="inline-block mt-4 px-4 py-2 bg-gradient-to-r from-kahonyn-energie to-orange-500 text-white rounded-lg hover:shadow-md transition">
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