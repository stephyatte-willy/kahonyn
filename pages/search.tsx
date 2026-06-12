// pages/search.tsx
"use client"

import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { 
  MagnifyingGlassIcon, PlayIcon, FilmIcon, TvIcon, 
  XMarkIcon, ClockIcon, EyeIcon, LockClosedIcon,
  HomeIcon, UserGroupIcon, BookmarkIcon, TrophyIcon, UserCircleIcon
} from '@heroicons/react/24/outline'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

interface SearchResult {
  id: string
  title: string
  description: string
  coverImage: string
  type: 'series' | 'movie'
  price: number
  duration?: number
  totalEpisodes?: number
  views: number
  relevance: number
}

export default function SearchPage() {
  const router = useRouter()
  const { q } = router.query
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [filter, setFilter] = useState<'all' | 'series' | 'movie'>('all')
  const [sortBy, setSortBy] = useState<'relevance' | 'views' | 'price_asc' | 'price_desc'>('relevance')
  const [totalResults, setTotalResults] = useState(0)

  // Charger l'historique des recherches
  useEffect(() => {
    const saved = localStorage.getItem('kahonyn_recent_searches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Effectuer la recherche quand le paramètre change
  useEffect(() => {
    if (q && typeof q === 'string') {
      setSearchTerm(q)
      performSearch(q)
      saveRecentSearch(q)
    }
  }, [q, filter, sortBy])

  const performSearch = async (term: string) => {
    if (!term.trim()) {
      setResults([])
      setTotalResults(0)
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}&filter=${filter}&sort=${sortBy}`)
      const data = await res.json()
      
      if (data.results) {
        setResults(data.results)
        setTotalResults(data.total || data.results.length)
      } else {
        setResults([])
        setTotalResults(0)
      }
    } catch (error) {
      console.error('Erreur recherche:', error)
      toast.error('Erreur lors de la recherche')
      setResults([])
      setTotalResults(0)
    } finally {
      setLoading(false)
    }
  }

  const saveRecentSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('kahonyn_recent_searches', JSON.stringify(updated))
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('kahonyn_recent_searches')
    toast.success('Historique effacé')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return
    router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`)
  }

  const handleQuickSearch = (term: string) => {
    setSearchTerm(term)
    router.push(`/search?q=${encodeURIComponent(term)}`)
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-- min'
    const mins = Math.floor(seconds / 60)
    return `${mins} min`
  }

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
    if (views >= 1000) return `${(views / 1000).toFixed(1)}k`
    return views.toString()
  }

  const popularSearches = [
    'Action', 'Romance', 'Comédie', 'Drame', 'Tendances', 'Nouveautés',
    'Animation', 'Horreur', 'Science-fiction', 'Aventure'
  ]

  const footerTabs = [
    { id: 'home', label: 'Accueil', icon: HomeIcon, href: '/' },
    { id: 'for-you', label: 'Pour vous', icon: UserGroupIcon, href: '/for-you' },
    { id: 'my-list', label: 'Ma liste', icon: BookmarkIcon, href: '/my-list' },
    { id: 'premium', label: 'Primes', icon: TrophyIcon, href: '/premium' },
    { id: 'profile', label: 'Profil', icon: UserCircleIcon, href: '/profile' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A0A00] via-[#0D0D0D] to-[#0D0D0D]">
      <Navbar 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        hideCategories={true}
      />
      
      <div className="pt-24 pb-20 max-w-7xl mx-auto px-4">
        
        {/* Barre de recherche principale */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une série, un film... (minimum 1 caractère)"
              className="w-full px-5 py-4 pl-14 bg-[#1A1A2E] border border-[#8B5A2B]/20 rounded-2xl text-white placeholder-white/40 focus:ring-2 focus:ring-[#FF6B35]/50 focus:border-[#FF6B35] outline-none transition-all text-base"
              autoFocus
            />
            <MagnifyingGlassIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </form>
        </div>

        {/* Filtres et tris */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white'
                  : 'bg-[#1A1A2E] text-white/60 hover:text-white border border-[#8B5A2B]/20'
              }`}
            >
              Tous ({totalResults})
            </button>
            <button
              onClick={() => setFilter('series')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filter === 'series'
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white'
                  : 'bg-[#1A1A2E] text-white/60 hover:text-white border border-[#8B5A2B]/20'
              }`}
            >
              Séries
            </button>
            <button
              onClick={() => setFilter('movie')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filter === 'movie'
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white'
                  : 'bg-[#1A1A2E] text-white/60 hover:text-white border border-[#8B5A2B]/20'
              }`}
            >
              Films
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-[#1A1A2E] border border-[#8B5A2B]/20 rounded-xl text-white text-sm focus:ring-2 focus:ring-[#FF6B35]/50 outline-none"
          >
            <option value="relevance">Pertinence</option>
            <option value="views">Plus vus</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>
        </div>

        {/* Résultats */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35]"></div>
          </div>
        ) : q ? (
          <>
            {totalResults === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto bg-[#1A1A2E] rounded-2xl flex items-center justify-center mb-4">
                  <MagnifyingGlassIcon className="w-10 h-10 text-white/30" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Aucun résultat trouvé</h3>
                <p className="text-sm text-white/50">
                  Essayez avec d'autres mots-clés ou parcourez nos catégories
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-white/60 text-sm">
                    {totalResults} résultat{totalResults > 1 ? 's' : ''} pour "{q}"
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {results.map((result) => (
                    <Link
                      key={`${result.type}-${result.id}`}
                      href={result.type === 'series' ? `/series/${result.id}?autoplay=true` : `/video/${result.id}?autoplay=true`}
                      className="group"
                    >
                      <div className="relative rounded-xl overflow-hidden bg-[#1A1A2E] border border-[#8B5A2B]/10 hover:border-[#FF6B35]/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                        <div className="relative aspect-[3/4] overflow-hidden">
                          {result.coverImage ? (
                            <>
                              <img 
                                src={result.coverImage} 
                                alt={result.title} 
                                className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A00]/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                            </>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#1A1A2E] to-[#2A1A0E] flex items-center justify-center">
                              {result.type === 'series' ? (
                                <TvIcon className="w-10 h-10 text-[#8B5A2B]/30" />
                              ) : (
                                <FilmIcon className="w-10 h-10 text-[#8B5A2B]/30" />
                              )}
                            </div>
                          )}
                          
                          <div className="absolute top-2 left-2">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                              result.type === 'series' 
                                ? 'bg-purple-500/90 text-white' 
                                : 'bg-blue-500/90 text-white'
                            }`}>
                              {result.type === 'series' ? 'Série' : 'Film'}
                            </span>
                          </div>
                          
                          <div className="absolute top-2 right-2">
                            <span className="bg-gradient-to-r from-[#D4A855] to-[#E5C87B] text-[#1A0A00] text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
                              🪙 {result.price}
                            </span>
                          </div>
                          
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition duration-300">
                              <PlayIcon className="w-6 h-6 text-[#FF6B35] ml-0.5" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-2.5">
                          <h3 className="font-semibold text-xs text-white line-clamp-1 group-hover:text-[#FF6B35] transition">
                            {result.title}
                          </h3>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[10px] text-white/50 font-medium flex items-center gap-1">
                              <EyeIcon className="w-3 h-3" />
                              {formatViews(result.views)}
                            </span>
                            {result.type === 'movie' && result.duration && (
                              <span className="text-[10px] text-white/50 font-medium flex items-center gap-1">
                                <ClockIcon className="w-3 h-3" />
                                {formatDuration(result.duration)}
                              </span>
                            )}
                            {result.type === 'series' && result.totalEpisodes && (
                              <span className="text-[10px] text-white/50 font-medium">
                                {result.totalEpisodes} ép.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="space-y-8">
            {/* Recherches récentes */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-white/70">Recherches récentes</h3>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-white/40 hover:text-[#FF6B35] transition"
                  >
                    Effacer
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickSearch(term)}
                      className="px-4 py-2 bg-[#1A1A2E] rounded-full text-sm text-white/70 hover:text-white hover:bg-[#FF6B35]/20 transition border border-[#8B5A2B]/20"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions populaires */}
            <div>
              <h3 className="text-sm font-semibold text-white/70 mb-3">Suggestions populaires</h3>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickSearch(term)}
                    className="px-4 py-2 bg-gradient-to-r from-[#FF6B35]/10 to-[#FF8C5A]/10 rounded-full text-sm text-white/80 hover:text-white hover:from-[#FF6B35]/20 hover:to-[#FF8C5A]/20 transition border border-[#FF6B35]/20"
                  >
                    🔥 {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Catégories */}
            <div>
              <h3 className="text-sm font-semibold text-white/70 mb-3">Explorer par catégorie</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: 'Populaires', icon: '🔥', color: 'from-orange-500 to-red-500' },
                  { name: 'Animé', icon: '🎌', color: 'from-pink-500 to-purple-500' },
                  { name: 'Inédit', icon: '✨', color: 'from-blue-500 to-cyan-500' },
                  { name: 'Classement', icon: '🏆', color: 'from-yellow-500 to-amber-500' },
                  { name: 'Doublés', icon: '🎤', color: 'from-green-500 to-emerald-500' },
                  { name: 'VIP', icon: '👑', color: 'from-purple-500 to-indigo-500' },
                  { name: 'Femmes', icon: '👩', color: 'from-pink-500 to-rose-500' },
                  { name: 'Hommes', icon: '👨', color: 'from-blue-500 to-sky-500' },
                ].map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => handleQuickSearch(cat.name)}
                    className={`p-4 rounded-xl bg-gradient-to-br ${cat.color} text-white text-center hover:scale-105 transition-all duration-300 shadow-lg`}
                  >
                    <span className="text-2xl mb-1 block">{cat.icon}</span>
                    <span className="text-sm font-bold">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer 
        footerTabs={footerTabs}
        activeFooterTab=""
        setActiveFooterTab={() => {}}
      />
    </div>
  )
}