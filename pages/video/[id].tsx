"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState, useRef } from 'react'
import Navbar from '../../components/Navbar'
import { 
  LockClosedIcon, 
  PlayIcon, 
  PauseIcon,
  ChevronLeftIcon,
  BookmarkIcon,
  HeartIcon,
  ShareIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import toast, { Toaster } from 'react-hot-toast'

interface Video {
  id: string
  title: string
  description: string
  url: string
  thumbnail: string
  duration: number
  price: number
  views: number
  purchases: number
  status: string
  creator: { name: string; phone: string }
}

export default function VideoPage() {
  const router = useRouter()
  const { id } = router.query
  const { data: session } = useSession()
  const [video, setVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPurchased, setIsPurchased] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isSaved, setIsSaved] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [savesCount, setSavesCount] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (id) fetchVideo()
  }, [id])

  useEffect(() => {
    if (session && video) {
      checkPurchaseStatus()
      fetchCounters()
    }
  }, [session, video])

  useEffect(() => {
    if (showControls && isPlayerOpen) {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
      controlsTimeout.current = setTimeout(() => setShowControls(false), 3000)
    }
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
    }
  }, [showControls, isPlayerOpen])

  // Gestion de l'état de lecture
  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl || !isPlayerOpen) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    videoEl.addEventListener('play', handlePlay)
    videoEl.addEventListener('pause', handlePause)
    
    return () => {
      videoEl.removeEventListener('play', handlePlay)
      videoEl.removeEventListener('pause', handlePause)
    }
  }, [isPlayerOpen])

  const fetchVideo = async () => {
    try {
      const res = await fetch(`/api/videos/${id}`)
      const data = await res.json()
      setVideo(data)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Impossible de charger la vidéo')
    } finally {
      setLoading(false)
    }
  }

  const checkPurchaseStatus = async () => {
    if (!video) return
    try {
      const res = await fetch(`/api/user/purchased-episodes?ids=${video.id}`)
      const data = await res.json()
      setIsPurchased(data.purchasedIds?.includes(video.id))
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const fetchCounters = async () => {
    if (!video) return
    try {
      const res = await fetch(`/api/user/counters?episodeId=${video.id}`)
      const data = await res.json()
      setLikesCount(data.likesCount || 0)
      setSavesCount(data.savesCount || 0)
      setIsLiked(data.userLiked || false)
      setIsSaved(data.userSaved || false)
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handlePurchase = async () => {
    if (!session) {
      toast.error('Connectez-vous pour acheter')
      router.push('/login')
      return
    }
    if (!video) return

    setIsPurchasing(true)
    try {
      const res = await fetch('/api/purchase-episode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId: video.id })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Vidéo débloquée !')
        setIsPurchased(true)
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
    } finally {
      setIsPurchasing(false)
    }
  }

  const handleSave = async () => {
    if (!session) {
      toast.error('Connectez-vous pour sauvegarder')
      router.push('/login')
      return
    }
    if (!video) return

    try {
      const res = await fetch('/api/user/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId: video.id })
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
    if (!video) return

    try {
      const res = await fetch('/api/user/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId: video.id })
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

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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

  if (!video) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500">Vidéo non trouvée</p>
        </div>
      </div>
    )
  }

  const canWatch = isPurchased || session?.user?.role === 'admin'

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
        // Interface info vidéo
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button onClick={() => router.push('/')} className="inline-flex items-center gap-1 text-gray-600 hover:text-orange-500 transition">
              <ChevronLeftIcon className="w-5 h-5" />
              Retour
            </button>
          </div>

          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row gap-6 p-6">
                <div className="w-full md:w-1/3">
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt={video.title} className="w-full rounded-lg shadow-md" />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center text-6xl">🎬</div>
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-800">{video.title}</h1>
                  <p className="text-gray-600 mt-2">{video.description || 'Aucune description'}</p>
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                    <span>⭐ 4.8</span>
                    <span>👁️ {(video.views || 0).toLocaleString()} vues</span>
                    <span>👤 {video.creator?.name || 'Créateur'}</span>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => setIsPlayerOpen(true)}
                      className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition"
                    >
                      Regarder maintenant
                    </button>
                    {!canWatch && (
                      <button
                        onClick={handlePurchase}
                        disabled={isPurchasing}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                      >
                        Acheter {video.price} coins
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ============================================================
        // LECTEUR VIDÉO
        // ============================================================
        <div className="fixed inset-0 bg-black z-50">
          <video
            ref={videoRef}
            controls={false}
            autoPlay
            className="absolute inset-0 w-full h-full object-contain"
            key={video.url}
            playsInline
            onClick={() => setShowControls(!showControls)}
          >
            <source src={video.url} type="video/mp4" />
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
                {video.title}
              </h2>
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
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
                  max={video.duration || 100}
                  value={videoRef.current?.currentTime || 0}
                  onChange={(e) => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = parseFloat(e.target.value)
                    }
                  }}
                  className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <span className="text-white text-xs">
                  {Math.floor((video.duration || 0) / 60)}:
                  {Math.floor((video.duration || 0) % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Overlay d'achat si non débloqué */}
          {!canWatch && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30">
              <LockClosedIcon className="w-12 h-12 text-white mb-4" />
              <p className="text-white text-center mb-4">Achetez cette vidéo pour la regarder</p>
              <button
                onClick={handlePurchase}
                disabled={isPurchasing}
                className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition"
              >
                Acheter {video.price} coins
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}