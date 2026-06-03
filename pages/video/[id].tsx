"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState, useRef } from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { 
  LockClosedIcon, 
  PlayIcon, 
  PauseIcon,
  ChevronLeftIcon,
  BookmarkIcon,
  HeartIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  HomeIcon,
  UserGroupIcon,
  TrophyIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

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
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeFooterTab, setActiveFooterTab] = useState('')
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // États pour le système de gratuité
  const [canWatch, setCanWatch] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  const [userCoins, setUserCoins] = useState(0)
  const [freeDuration, setFreeDuration] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [isFreePreview, setIsFreePreview] = useState(false)
  const [requiredCoins, setRequiredCoins] = useState(0)
  const [isOwner, setIsOwner] = useState(false)

  const footerTabs = [
    { id: 'home', label: 'Accueil', icon: HomeIcon, href: '/' },
    { id: 'for-you', label: 'Pour vous', icon: UserGroupIcon, href: '/for-you' },
    { id: 'my-list', label: 'Ma liste', icon: BookmarkIcon, href: '/my-list' },
    { id: 'premium', label: 'Primes', icon: TrophyIcon, href: '/premium' },
    { id: 'profile', label: 'Profil', icon: UserCircleIcon, href: '/profile' },
  ]

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

  // Bloquer la vidéo après le temps gratuit (20%)
  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl || !isPlayerOpen || !isFreePreview || isPurchased || isOwner) return

    const handleTimeUpdate = () => {
      if (videoEl.currentTime >= freeDuration && freeDuration > 0) {
        videoEl.pause()
        toast.error(
          `⏰ Aperçu gratuit terminé (${Math.floor(freeDuration / 60)}min ${freeDuration % 60}s). Achetez pour continuer (${requiredCoins} coins).`,
          { duration: 6000 }
        )
        // Retirer l'event listener après le blocage
        videoEl.removeEventListener('timeupdate', handleTimeUpdate)
      }
    }

    videoEl.addEventListener('timeupdate', handleTimeUpdate)
    return () => videoEl.removeEventListener('timeupdate', handleTimeUpdate)
  }, [isPlayerOpen, isFreePreview, freeDuration, isPurchased, isOwner, requiredCoins])

  const fetchVideo = async () => {
    try {
      const res = await fetch(`/api/video/${id}`)
      if (!res.ok) throw new Error('Vidéo non trouvée')
      const data = await res.json()
      setVideo(data)
      setCanWatch(data.canWatch)
      setAccessMessage(data.message || '')
      setUserCoins(data.userCoins || 0)
      setFreeDuration(data.freeDuration || 0)
      setTotalDuration(data.totalDuration || 0)
      setIsFreePreview(data.isFreePreview || false)
      setRequiredCoins(data.requiredCoins || data.price || 0)
      setIsOwner(data.isOwner || false)
      setIsPurchased(data.isPurchased || false)
    } catch (error) {
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
      const purchased = data.purchasedIds?.includes(video.id)
      setIsPurchased(purchased)
      if (purchased) setCanWatch(true)
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const fetchCounters = async () => {
    if (!video) return
    try {
      const res = await fetch(`/api/user/counters?episodeId=${video.id}`)
      if (res.ok) {
        const data = await res.json()
        setIsLiked(data.userLiked || false)
        setIsSaved(data.userSaved || false)
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleLike = async () => {
    if (!session) { toast.error('Connectez-vous pour aimer'); return }
    if (!video) return
    setIsLiked(!isLiked)
    try {
      const res = await fetch('/api/user/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId: video.id })
      })
      const data = await res.json()
      if (res.ok) setIsLiked(data.liked)
      else setIsLiked(!isLiked)
    } catch { setIsLiked(!isLiked) }
  }

  const handleSave = async () => {
    if (!session) { toast.error('Connectez-vous pour sauvegarder'); return }
    if (!video) return
    setIsSaved(!isSaved)
    try {
      const res = await fetch('/api/user/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId: video.id })
      })
      const data = await res.json()
      if (res.ok) setIsSaved(data.saved)
      else setIsSaved(!isSaved)
    } catch { setIsSaved(!isSaved) }
  }

  const handlePurchase = async () => {
    if (!session) {
      toast.error('Connectez-vous pour acheter')
      router.push('/?auth=login')
      return
    }
    if (!video) return

    if (userCoins < requiredCoins) {
      toast.error(`Solde insuffisant. Vous avez ${userCoins} coins, il vous faut ${requiredCoins} coins.`)
      return
    }

    setIsPurchasing(true)
    try {
      const res = await fetch('/api/purchase-episode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId: video.id })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Vidéo débloquée ! 🎉')
        setIsPurchased(true)
        setCanWatch(true)
        setUserCoins(prev => prev - requiredCoins)
        // Reprendre la lecture si le player est ouvert
        if (isPlayerOpen && videoRef.current) {
          videoRef.current.play()
        }
      } else {
        toast.error(data.error || 'Erreur lors de l\'achat')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
    } finally {
      setIsPurchasing(false)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Lien copié !')
    } catch { toast.error('Impossible de copier le lien') }
  }

  const handleDownload = () => {
    toast.success('Fonctionnalité VIP - Bientôt disponible')
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause()
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
      <div className="min-h-screen bg-[#F5F0E8]">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
        </div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-[#F5F0E8]">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <p className="text-gray-500">Vidéo non trouvée</p>
        </div>
      </div>
    )
  }

  if (isPlayerOpen) document.body.style.overflow = 'hidden'
  else document.body.style.overflow = 'auto'

  return (
    <>
      {!isPlayerOpen && <Navbar />}
            
      {!isPlayerOpen ? (
        // ============================================================
        // PAGE D'INFORMATION DU FILM
        // ============================================================
        <div className="min-h-screen bg-[#F5F0E8] pb-16">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button onClick={() => router.push('/')} className="inline-flex items-center gap-1 text-gray-600 hover:text-[#FF6B35] transition">
              <ChevronLeftIcon className="w-5 h-5" /> Retour
            </button>
          </div>

          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-[#D4A855]/10">
              <div className="flex flex-col md:flex-row gap-6 p-6">
                {/* Affiche */}
                <div className="w-full md:w-1/3 flex-shrink-0">
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt={video.title} className="w-full rounded-xl shadow-md aspect-[3/4] object-cover" />
                  ) : (
                    <div className="w-full aspect-[3/4] bg-gradient-to-br from-[#EDE4D8] to-[#E8DCCF] rounded-xl flex items-center justify-center text-6xl">🎬</div>
                  )}
                </div>

                {/* Infos */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>
                  <p className="text-gray-600 mt-2">{video.description || 'Aucune description'}</p>
                  
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                    <span>👁️ {(video.views || 0).toLocaleString()} vues</span>
                    <span>👤 {video.creator?.name || 'Créateur'}</span>
                    <span>⏱️ {formatDuration(video.duration)}</span>
                  </div>

                  {/* Info gratuité */}
                  {isFreePreview && !isPurchased && !isOwner && (
                    <div className="mt-4 bg-green-50 rounded-xl p-3 border border-green-200">
                      <p className="text-xs text-green-700 font-bold">
                        🎬 Aperçu gratuit de {Math.floor(freeDuration / 60)}min {freeDuration % 60}s disponible !
                      </p>
                      <p className="text-[10px] text-green-600 mt-0.5">
                        La vidéo complète dure {formatDuration(totalDuration)}
                      </p>
                    </div>
                  )}

                  {session && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Votre solde :</span>
                      <span className="font-bold text-[#FF6B35]">{userCoins} 🪙</span>
                    </div>
                  )}

                  {/* Boutons d'action */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    {/* Bouton Regarder (toujours visible pour l'aperçu gratuit) */}
                    <button 
                      onClick={() => setIsPlayerOpen(true)} 
                      className="bg-[#FF6B35] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#FF8C5A] transition flex items-center gap-2"
                    >
                      <PlayIcon className="w-5 h-5" />
                      {isFreePreview && !isPurchased && !isOwner ? 'Aperçu gratuit' : 'Regarder'}
                    </button>

                    {/* Bouton Acheter (si pas déjà acheté et pas owner) */}
                    {!isPurchased && !isOwner && video.price > 0 && (
                      <button 
                        onClick={handlePurchase} 
                        disabled={isPurchasing} 
                        className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                      >
                        {isPurchasing ? (
                          <><div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div> Achat...</>
                        ) : (
                          <>{requiredCoins > 0 ? `🪙 Acheter (${requiredCoins} coins)` : '🎁 Gratuit'}</>
                        )}
                      </button>
                    )}

                    {/* Badge débloqué */}
                    {(isPurchased || isOwner) && (
                      <span className="bg-green-100 text-green-700 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2">
                        ✅ Débloqué
                      </span>
                    )}
                  </div>

                  {/* Message si pas connecté */}
                  {!session && (
                    <p className="mt-3 text-sm text-gray-500">
                      🔑 <button onClick={() => router.push('/?auth=login')} className="text-[#FF6B35] font-bold hover:underline">Connectez-vous</button> pour acheter cette vidéo
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Footer footerTabs={footerTabs} activeFooterTab={activeFooterTab} setActiveFooterTab={setActiveFooterTab} />
        </div>
      ) : (
        // ============================================================
        // LECTEUR VIDÉO PLEIN ÉCRAN
        // ============================================================
        <div className="fixed inset-0 bg-black z-50">
          <video
            ref={videoRef}
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
            <button onClick={handleLike} className="text-white bg-black/50 rounded-full p-2.5 hover:bg-black/70 transition w-10 h-10 flex items-center justify-center">
              {isLiked ? <HeartSolidIcon className="w-5 h-5 text-red-500" /> : <HeartIcon className="w-5 h-5" />}
            </button>
            <button onClick={handleSave} className="text-white bg-black/50 rounded-full p-2.5 hover:bg-black/70 transition w-10 h-10 flex items-center justify-center">
              <BookmarkIcon className={`w-5 h-5 ${isSaved ? 'fill-[#FF6B35] text-[#FF6B35]' : ''}`} />
            </button>
            <button onClick={handleShare} className="text-white bg-black/50 rounded-full p-2.5 hover:bg-black/70 transition w-10 h-10 flex items-center justify-center">
              <ShareIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Overlay contrôles */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button onClick={() => setIsPlayerOpen(false)} className="absolute top-4 left-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition z-10">
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <div className="absolute top-4 left-20 text-white">
              <h2 className="font-semibold text-sm">{video.title}</h2>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <button onClick={togglePlayPause} className="text-white bg-black/50 rounded-full p-4 hover:bg-black/70 transition transform hover:scale-110">
                {isPlaying ? <PauseIcon className="w-10 h-10" /> : <PlayIcon className="w-10 h-10" />}
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-3">
                <span className="text-white text-xs">{formatDuration(Math.floor(videoRef.current?.currentTime || 0))}</span>
                <input type="range" min="0" max={video.duration || 100} value={videoRef.current?.currentTime || 0}
                  onChange={(e) => { if (videoRef.current) videoRef.current.currentTime = parseFloat(e.target.value) }}
                  className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#FF6B35]" />
                <span className="text-white text-xs">{formatDuration(video.duration || 0)}</span>
              </div>
            </div>
          </div>

          {/* Indicateur temps gratuit */}
          {isFreePreview && !isPurchased && !isOwner && freeDuration > 0 && (
            <div className="absolute top-16 left-0 right-0 text-center z-20">
              <span className="bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                🎬 Aperçu gratuit • {formatDuration(freeDuration)} / {formatDuration(totalDuration)}
              </span>
            </div>
          )}

          {/* Overlay d'achat après temps gratuit épuisé */}
          {isFreePreview && !isPurchased && !isOwner && videoRef.current && videoRef.current.currentTime >= freeDuration && freeDuration > 0 && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-30">
              <LockClosedIcon className="w-16 h-16 text-white/80 mb-4" />
              <h3 className="text-white text-xl font-bold mb-2">Aperçu terminé</h3>
              <p className="text-white/70 text-sm mb-2 text-center px-4">
                Vous avez regardé {formatDuration(freeDuration)} gratuitement.
              </p>
              <p className="text-white/70 text-sm mb-6 text-center px-4">
                La vidéo complète dure {formatDuration(totalDuration)}
              </p>
              {session ? (
                <button onClick={handlePurchase} disabled={isPurchasing}
                  className="bg-[#FF6B35] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#FF8C5A] transition disabled:opacity-50 text-lg">
                  {isPurchasing ? 'Achat...' : `🪙 Acheter (${requiredCoins} coins)`}
                </button>
              ) : (
                <button onClick={() => { setIsPlayerOpen(false); router.push('/?auth=login') }}
                  className="bg-[#FF6B35] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#FF8C5A] transition text-lg">
                  Se connecter pour acheter
                </button>
              )}
              <button onClick={() => setIsPlayerOpen(false)}
                className="mt-4 text-white/60 text-sm hover:text-white transition">
                Retour
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}