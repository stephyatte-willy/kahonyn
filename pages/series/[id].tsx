"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Navbar from '../../components/Navbar'
import { 
  LockClosedIcon, 
  PlayIcon, 
  PauseIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
  XMarkIcon,
  BookmarkIcon,
  QueueListIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  HeartIcon,
  ShareIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import toast, { Toaster } from 'react-hot-toast'

interface Episode {
  id: string
  episodeNumber: number
  title: string
  description: string
  videoUrl: string
  thumbnail: string
  duration: number
  price: number
  views: number
  purchases: number
}

interface Series {
  id: string
  title: string
  description: string
  coverImage: string
  creator: { name: string; phone: string }
  totalEpisodes: number
  totalViews: number
  totalPurchases: number
  episodes: Episode[]
  createdAt: string
}

export default function SeriesPage() {
  const router = useRouter()
  const { id } = router.query
  const { data: session } = useSession()
  const [series, setSeries] = useState<Series | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)
  const [purchasedEpisodes, setPurchasedEpisodes] = useState<Set<string>>(new Set())
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showEpisodeModal, setShowEpisodeModal] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [savesCount, setSavesCount] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (id) fetchSeries()
  }, [id])

  useEffect(() => {
    if (session && series && series.episodes.length > 0) {
      fetchPurchasedStatus()
    }
  }, [session, series])

  useEffect(() => {
    if (selectedEpisode) {
      fetchCounters()
    }
  }, [selectedEpisode])

  useEffect(() => {
    if (showControls && isPlayerOpen) {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
      controlsTimeout.current = setTimeout(() => setShowControls(false), 3000)
    }
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
    }
  }, [showControls, isPlayerOpen])

  // Lecture automatique
  useEffect(() => {
    const video = videoRef.current
    if (!video || !isPlayerOpen) return

    const handleVideoEnd = () => {
      setIsPlaying(false)
      if (selectedEpisode && series) {
        const currentIndex = series.episodes.findIndex(ep => ep.id === selectedEpisode.id)
        const nextEpisode = series.episodes[currentIndex + 1]
        if (nextEpisode && canWatch(nextEpisode)) {
          setSelectedEpisode(nextEpisode)
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.load()
              videoRef.current.play()
              setIsPlaying(true)
            }
          }, 500)
          toast.success(`Lecture automatique : Épisode ${nextEpisode.episodeNumber}`)
        }
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('ended', handleVideoEnd)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    
    return () => {
      video.removeEventListener('ended', handleVideoEnd)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [selectedEpisode, series, isPlayerOpen])

  const fetchCounters = async () => {
    if (!selectedEpisode) return
    try {
      const res = await fetch(`/api/user/counters?episodeId=${selectedEpisode.id}`)
      if (res.ok) {
        const data = await res.json()
        setLikesCount(data.likesCount || 0)
        setSavesCount(data.savesCount || 0)
        setIsLiked(data.userLiked || false)
        setIsSaved(data.userSaved || false)
      }
    } catch (error) {
      console.error('Erreur chargement compteurs:', error)
    }
  }

  const goToPreviousEpisode = () => {
    if (!selectedEpisode || !series) return
    const currentIndex = series.episodes.findIndex(ep => ep.id === selectedEpisode.id)
    const prevEpisode = series.episodes[currentIndex - 1]
    if (prevEpisode && canWatch(prevEpisode)) {
      setSelectedEpisode(prevEpisode)
      toast.success(`Épisode ${prevEpisode.episodeNumber}`)
    }
  }

  const goToNextEpisode = () => {
    if (!selectedEpisode || !series) return
    const currentIndex = series.episodes.findIndex(ep => ep.id === selectedEpisode.id)
    const nextEpisode = series.episodes[currentIndex + 1]
    if (nextEpisode && canWatch(nextEpisode)) {
      setSelectedEpisode(nextEpisode)
      toast.success(`Épisode ${nextEpisode.episodeNumber}`)
    }
  }

  const hasNextEpisode = () => {
    if (!selectedEpisode || !series) return false
    const currentIndex = series.episodes.findIndex(ep => ep.id === selectedEpisode.id)
    const nextEpisode = series.episodes[currentIndex + 1]
    return nextEpisode && canWatch(nextEpisode)
  }

  const hasPreviousEpisode = () => {
    if (!selectedEpisode || !series) return false
    const currentIndex = series.episodes.findIndex(ep => ep.id === selectedEpisode.id)
    const prevEpisode = series.episodes[currentIndex - 1]
    return prevEpisode && canWatch(prevEpisode)
  }

  const fetchSeries = async () => {
    try {
      const res = await fetch(`/api/public/series/${id}`)
      const data = await res.json()
      setSeries(data)
      if (data.episodes && data.episodes.length > 0) {
        setSelectedEpisode(data.episodes[0])
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Impossible de charger la série')
    } finally {
      setLoading(false)
    }
  }

  const fetchPurchasedStatus = async () => {
    if (!series?.episodes.length) return
    if (!session) return

    try {
      const episodeIds = series.episodes.map(ep => ep.id).join(',')
      const res = await fetch(`/api/user/purchased-episodes?ids=${episodeIds}`)
      if (res.ok) {
        const data = await res.json()
        setPurchasedEpisodes(new Set(data.purchasedIds || []))
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handlePurchase = async (episode: Episode) => {
    if (!session) {
      toast.error('Connectez-vous pour acheter')
      router.push('/login')
      return
    }

    setIsPurchasing(true)
    try {
      const res = await fetch('/api/purchase-episode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId: episode.id })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast.success(`Épisode ${episode.episodeNumber} débloqué !`)
        setPurchasedEpisodes(prev => new Set([...prev, episode.id]))
        setSelectedEpisode(episode)
        setIsPlayerOpen(true)
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
    } finally {
      setIsPurchasing(false)
    }
  }

  const handlePlay = (episode: Episode) => {
    setSelectedEpisode(episode)
    setIsPlayerOpen(true)
  }

  const canWatch = (episode: Episode) => {
    return purchasedEpisodes.has(episode.id) || session?.user?.role === 'admin'
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSave = async () => {
    if (!session) {
      toast.error('Connectez-vous pour sauvegarder')
      router.push('/login')
      return
    }
    if (!selectedEpisode) return

    try {
      const res = await fetch('/api/user/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId: selectedEpisode.id })
      })
      const data = await res.json()
      if (res.ok) {
        setIsSaved(data.saved)
        setSavesCount(data.savesCount)
        toast.success(data.saved ? 'Ajouté aux favoris' : 'Retiré des favoris')
      }
    } catch (error) {
      toast.error('Erreur')
    }
  }

  const handleLike = async () => {
    if (!session) {
      toast.error('Connectez-vous pour aimer')
      router.push('/login')
      return
    }
    if (!selectedEpisode) return

    try {
      const res = await fetch('/api/user/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId: selectedEpisode.id })
      })
      const data = await res.json()
      if (res.ok) {
        setIsLiked(data.liked)
        setLikesCount(data.likesCount)
        toast.success(data.liked ? 'Vous avez aimé' : 'Like retiré')
      }
    } catch (error) {
      toast.error('Erreur')
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Lien copié dans le presse-papier')
    } catch (err) {
      toast.error('Impossible de copier le lien')
    }
  }

  const handleDownload = () => {
    toast.success('Fonctionnalité VIP - Bientôt disponible')
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }
    setShowControls(true)
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </div>
    )
  }

  if (!series) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
          <p className="text-gray-500">Série non trouvée</p>
        </div>
      </div>
    )
  }

  if (isPlayerOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = 'auto'
  }

  return (
    <>
      {!isPlayerOpen && <Navbar />}
      
      <Toaster position="top-right" />
      
      {!isPlayerOpen ? (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Link href="/" className="inline-flex items-center gap-1 text-gray-600 hover:text-orange-500 transition">
              <ChevronLeftIcon className="w-5 h-5" />
              Retour à l'accueil
            </Link>
          </div>

          <div className="bg-gradient-to-r from-amber-700 to-orange-700 text-white">
            <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col md:flex-row gap-8">
              <div className="w-24 h-16 rounded-xl overflow-hidden shadow-xl mx-auto md:mx-0 flex-shrink-0">
                {series.coverImage ? (
                  <img src={series.coverImage} alt={series.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-6xl">🎬</div>
                )}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-xl md:text-xl font-bold">{series.title}</h1>
                <span className="text-white/80 mb-1">{series.description}</span>
                <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm">
                  <span>⭐ 4.8</span>
                  <span>🎬 {series.totalEpisodes} épisodes</span>
                  <span>👁️ {(series.totalViews || 0).toLocaleString()} vues</span>
                </div>
              </div>
            </div>
          </div>

<div className="max-w-7xl mx-auto px-4 py-8">
  {/* En-tête chic */}
  <div className="flex justify-between items-center mb-8">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
        <span className="text-white text-lg">🎬</span>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Épisodes</h2>
      </div>
      <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-md">
        {series.totalEpisodes}
      </span>
    </div>
  </div>
  
  {/* Grille moderne */}
  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 lg:grid-cols-6 gap-4">
    {series.episodes.map((episode, index) => {
      const isPurchased = canWatch(episode)
      return (
        <div
          key={episode.id}
          onClick={() => handlePlay(episode)}
          className={`group relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-500 ${
            isPurchased 
              ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
              : 'bg-gradient-to-br from-gray-800 to-gray-900'
          } hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-2 border border-gray-700/50`}
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          {/* Effet de brillance au survol */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          
          {/* Miniature avec icône clap */}
          <div className="relative aspect-square bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden">
            {/* Icône clap animée */}
            <div className="text-5xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 drop-shadow-xl">
              🎬
            </div>
            
            {/* Overlay lumineux au survol */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400 flex items-center justify-center">
              <div className="transform scale-0 group-hover:scale-100 transition-transform duration-300">
                <PlayIcon className="w-10 h-10 text-white drop-shadow-xl" />
              </div>
            </div>
            
            {/* Badge durée */}
            <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
              {formatDuration(episode.duration)}
            </div>
            
            {/* Badge statut */}
            <div className="absolute top-2 right-2">
              {!isPurchased && (
                <div className="bg-black/60 backdrop-blur-sm rounded-full p-1.5">
                  <LockClosedIcon className="w-3 h-3 text-gray-300" />
                </div>
              )}
              {isPurchased && (
                <div className="bg-emerald-500/80 backdrop-blur-sm rounded-full p-1.5 animate-pulse">
                  <CheckCircleIcon className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            
            {/* Badge numéro flottant */}
            <div className="absolute top-2 left-2 bg-orange-500/80 backdrop-blur-sm rounded-full px-2 py-0.5">
              <span className="text-white text-[10px] font-bold">Épisodes {episode.episodeNumber}</span>
            </div>
          </div>
          
          {/* Informations épisode */}
          <div className="p-3 text-center">
            <div className="mt-2">
              {!isPurchased ? (
                <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 rounded-full shadow-md">
                  <span className="text-xs font-bold text-white">{episode.price}</span>
                  <span className="text-[8px] text-white/80">coins</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 backdrop-blur-sm px-3 py-1 rounded-full border border-emerald-500/30">
                  <CheckCircleIcon className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] font-medium text-emerald-400">Débloqué</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Effet de bordure lumineuse */}
          <div className="absolute inset-0 rounded-2xl border border-white/5 group-hover:border-orange-500/30 transition-all duration-300 pointer-events-none"></div>
        </div>
      )
    })}
  </div>
</div>
        </div>
      ) : (
        // ============================================================
        // LECTEUR VIDÉO SÉRIE
        // ============================================================
        <div className="fixed inset-0 bg-black z-50">
          <video
            ref={videoRef}
            controls={false}
            autoPlay
            className="absolute inset-0 w-full h-full object-contain"
            key={selectedEpisode?.videoUrl}
            playsInline
            onClick={() => setShowControls(!showControls)}
          >
            <source src={selectedEpisode?.videoUrl} type="video/mp4" />
          </video>

          {/* Boutons à droite */}
          <div className="absolute right-4 top-1/3 -translate-y-1/3 flex flex-col gap-3 z-20">
            {/* Like */}
            <div className="relative flex flex-col items-center">
              <button
                onClick={handleLike}
                className="text-white bg-black/50 rounded-full p-2.5 hover:bg-black/70 transition w-10 h-10 flex items-center justify-center"
              >
                {isLiked ? (
                  <HeartSolidIcon className="w-5 h-5 text-red-500" />
                ) : (
                  <HeartIcon className="w-5 h-5" />
                )}
              </button>
              <span className="text-white text-[10px] bg-black/50 px-1.5">
                {likesCount}
              </span>
            </div>
            
            {/* Favoris */}
            <div className="relative flex flex-col items-center">
              <button
                onClick={handleSave}
                className="text-white bg-black/50 rounded-full p-2.5 hover:bg-black/70 transition w-10 h-10 flex items-center justify-center"
              >
                <BookmarkIcon className={`w-5 h-5 ${isSaved ? 'fill-orange-500 text-orange-500' : ''}`} />
              </button>
              <span className="text-white text-[10px] bg-black/50 px-1.5">
                {savesCount}
              </span>
            </div>
            
            {/* Partager */}
            <button
              onClick={handleShare}
              className="text-white bg-black/50 rounded-full p-2.5 hover:bg-black/70 transition w-10 h-10 flex items-center justify-center"
            >
              <ShareIcon className="w-5 h-5" />
            </button>
            
            {/* Télécharger VIP */}
            <div className="relative">
              <button
                onClick={handleDownload}
                className="text-white bg-black/50 rounded-full p-2.5 hover:bg-black/70 transition w-10 h-10 flex items-center justify-center relative"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[8px] font-bold px-1 rounded-full">VIP</span>
              </button>
            </div>
            
            {/* Liste épisodes */}
            <button
              onClick={() => setShowEpisodeModal(true)}
              className="text-white bg-black/50 rounded-full p-2.5 hover:bg-black/70 transition w-10 h-10 flex items-center justify-center"
            >
              <QueueListIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Overlay contrôles */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}>
            
            <button
              onClick={() => setIsPlayerOpen(false)}
              className="absolute top-4 left-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition z-10"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>

            <div className="absolute top-4 left-20 text-white">
              <h2 className="font-semibold text-sm md:text-base">
                {selectedEpisode?.title}
              </h2>
              <p className="text-xs text-gray-300">Épisode {selectedEpisode?.episodeNumber}</p>
            </div>

            <div className="absolute inset-0 flex items-center justify-center gap-6">
              <button
                onClick={goToPreviousEpisode}
                disabled={!hasPreviousEpisode()}
                className={`text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition ${
                  !hasPreviousEpisode() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <ChevronDoubleLeftIcon className="w-6 h-6" />
              </button>
              
              <button
                onClick={togglePlayPause}
                className="text-white bg-black/50 rounded-full p-4 hover:bg-black/70 transition transform hover:scale-110"
              >
                {isPlaying ? (
                  <PauseIcon className="w-10 h-10" />
                ) : (
                  <PlayIcon className="w-10 h-10" />
                )}
              </button>
              
              <button
                onClick={goToNextEpisode}
                disabled={!hasNextEpisode()}
                className={`text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition ${
                  !hasNextEpisode() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <ChevronDoubleRightIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-3">
                <span className="text-white text-xs">
                  {Math.floor((videoRef.current?.currentTime || 0) / 60)}:
                  {Math.floor((videoRef.current?.currentTime || 0) % 60).toString().padStart(2, '0')}
                </span>
                <input
                  type="range"
                  min="0"
                  max={selectedEpisode?.duration || 100}
                  value={videoRef.current?.currentTime || 0}
                  onChange={(e) => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = parseFloat(e.target.value)
                    }
                  }}
                  className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <span className="text-white text-xs">
                  {Math.floor((selectedEpisode?.duration || 0) / 60)}:
                  {Math.floor((selectedEpisode?.duration || 0) % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {(() => {
              if (!selectedEpisode || !series) return null
              const currentIndex = series.episodes.findIndex(ep => ep.id === selectedEpisode.id)
              const nextEpisode = series.episodes[currentIndex + 1]
              if (nextEpisode && canWatch(nextEpisode)) {
                return (
                  <div className="absolute bottom-20 left-0 right-0 text-center text-gray-400 text-xs">
                    ⏭️ Lecture automatique du prochain épisode à la fin
                  </div>
                )
              }
              return null
            })()}
          </div>
        </div>
      )}

      {/* MODALE ÉPISODES - VERSION COMPACTE POUR LECTEUR */}
{/* MODALE ÉPISODES - DESIGN ULTRA MODERNE */}
{showEpisodeModal && (
  <>
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fadeIn"
      onClick={() => setShowEpisodeModal(false)}
    />
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-gray-800 rounded-t-3xl z-50 animate-slideUp max-h-[85vh] overflow-hidden shadow-2xl">
      {/* Header avec effet glass */}
      <div className="sticky top-0 bg-gradient-to-r from-gray-800/95 to-gray-900/95 backdrop-blur-xl p-4 border-b border-white/10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <QueueListIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">
                Épisodes de {series?.title}
              </h2>
              <p className="text-gray-400 text-[10px]">
                {series?.episodes.length} épisodes disponibles
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowEpisodeModal(false)}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 hover:rotate-90"
          >
            <XMarkIcon className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
      
      {/* Grille ultra compacte et moderne */}
      <div className="overflow-y-auto max-h-[70vh] p-4">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
          {series?.episodes.map((ep, idx) => {
            const isPurchased = canWatch(ep)
            const isCurrent = selectedEpisode?.id === ep.id
            return (
              <div
                key={ep.id}
                onClick={() => {
                  setSelectedEpisode(ep)
                  setShowEpisodeModal(false)
                  setTimeout(() => {
                    if (videoRef.current) {
                      videoRef.current.load()
                      videoRef.current.play()
                    }
                  }, 100)
                }}
                className={`group relative cursor-pointer rounded-xl transition-all duration-300 ${
                  isCurrent
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30 scale-105'
                    : isPurchased
                    ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 hover:from-green-500/30 hover:to-green-600/20'
                    : 'bg-white/5 hover:bg-white/10'
                } ${isCurrent ? 'ring-2 ring-orange-400' : ''}`}
              >
                {/* Contenu épisode */}
                <div className="aspect-square flex flex-col items-center justify-center p-2">
                  {/* Icône animée */}
                  <div className={`text-2xl mb-1 transition-all duration-300 group-hover:scale-110 ${
                    isCurrent ? 'animate-bounce' : ''
                  }`}>
                    {isCurrent ? '▶️' : isPurchased ? '✅' : '🔒'}
                  </div>
                  
                  {/* Numéro d'épisode */}
                  <p className={`text-sm font-bold ${
                    isCurrent ? 'text-white' : 'text-gray-200'
                  }`}>
                    {ep.episodeNumber}
                  </p>
                  
                  {/* Prix ou statut */}
                  {!isPurchased && !isCurrent && (
                    <p className="text-[9px] font-semibold text-orange-400 mt-1">
                      {ep.price}
                    </p>
                  )}
                  {isPurchased && !isCurrent && (
                    <p className="text-[8px] text-green-400 mt-1">Débloqué</p>
                  )}
                  {isCurrent && (
                    <p className="text-[8px] text-white/80 mt-1">En cours</p>
                  )}
                </div>
                
                {/* Effet de lueur au survol */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                
                {/* Badge "En cours" flottant */}
                {isCurrent && (
                  <div className="absolute -top-1 -right-1">
                    <div className="relative">
                      <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-75"></div>
                      <div className="relative bg-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                        LIVE
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Pied de page avec info */}
      <div className="p-3 border-t border-white/10 bg-gray-900/50">
        <p className="text-gray-400 text-[10px] text-center">
          Cliquez sur un épisode pour le regarder
        </p>
      </div>
    </div>
  </>
)}

      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  )
}