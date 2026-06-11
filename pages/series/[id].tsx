"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState, useRef } from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import StarRating from '../../components/StarRating'
import CommentSection from '../../components/CommentSection'
import UnlockEpisodeModal from '../../components/UnlockEpisodeModal'
import { 
  LockClosedIcon, PlayIcon, PauseIcon, ChevronLeftIcon, CheckCircleIcon, XMarkIcon,
  BookmarkIcon, QueueListIcon, HeartIcon, ShareIcon, HomeIcon, UserGroupIcon, TrophyIcon,
  UserCircleIcon, SpeakerWaveIcon, SpeakerXMarkIcon, Cog6ToothIcon, TvIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { safeFetch, silentFetch, handleError } from '../../utils/errorHandler'
import toast from 'react-hot-toast'

interface Episode {
  id: string
  episodeNumber: number
  title: string
  description: string
  url: string
  thumbnail: string
  duration: number
  price: number
  views: number
  purchases: number
  status?: string
  isFree?: boolean
}

interface Series {
  id: string
  title: string
  description: string
  coverImage: string
  creator: { name: string; phone: string }
  totalEpisodes: number
  freeEpisodes: number
  totalViews: number
  totalPurchases: number
  episodes: Episode[]
  createdAt: string
}

const QUALITY_OPTIONS = [
  { label: 'Auto', value: 'auto' },
  { label: '1080p', value: '1080' },
  { label: '720p', value: '720' },
  { label: '480p', value: '480' },
  { label: '360p', value: '360' },
]

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
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeFooterTab, setActiveFooterTab] = useState('')
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const nextVideoRef = useRef<HTMLVideoElement>(null)
  const [userCoins, setUserCoins] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [selectedQuality, setSelectedQuality] = useState('auto')
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const [savedProgress, setSavedProgress] = useState(0)
  const [hasResumed, setHasResumed] = useState(false)
  
  // États pour la publicité
  const [remainingAds, setRemainingAds] = useState(5)
  const [maxAdsPerDay, setMaxAdsPerDay] = useState(5)
  const [watchingAd, setWatchingAd] = useState(false)
  const [forcedAdNeeded, setForcedAdNeeded] = useState(false)
  const [episodesWatchedFree, setEpisodesWatchedFree] = useState(0)
  const [freeEpisodesBeforeAd] = useState(3)
  
  // États pour la modale de déblocage
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false)
  const [pendingEpisode, setPendingEpisode] = useState<Episode | null>(null)

  // États pour le swipe TikTok-like
  const [touchStartY, setTouchStartY] = useState(0)
  const [touchStartTime, setTouchStartTime] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [nextEpisode, setNextEpisode] = useState<Episode | null>(null)
  const [prevEpisode, setPrevEpisode] = useState<Episode | null>(null)
  const [swipingDirection, setSwipingDirection] = useState<'up' | 'down' | null>(null)
  const [isChangingEpisode, setIsChangingEpisode] = useState(false)

  const footerTabs = [
    { id: 'home', label: 'Accueil', icon: HomeIcon, href: '/' },
    { id: 'for-you', label: 'Pour vous', icon: UserGroupIcon, href: '/for-you' },
    { id: 'my-list', label: 'Ma liste', icon: BookmarkIcon, href: '/my-list' },
    { id: 'premium', label: 'Primes', icon: TrophyIcon, href: '/premium' },
    { id: 'profile', label: 'Profil', icon: UserCircleIcon, href: '/profile' },
  ]

  const loadAdjacentEpisodes = () => {
    if (!selectedEpisode || !series) return
    const currentIndex = series.episodes.findIndex(ep => ep.id === selectedEpisode.id)
    setNextEpisode(series.episodes[currentIndex + 1] || null)
    setPrevEpisode(series.episodes[currentIndex - 1] || null)
  }

  useEffect(() => {
    if (selectedEpisode && series) loadAdjacentEpisodes()
  }, [selectedEpisode, series])

  // Fonctions de swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isChangingEpisode) return
    setTouchStartY(e.touches[0].clientY)
    setTouchStartTime(Date.now())
    setIsSwiping(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || isChangingEpisode) return
    const currentY = e.touches[0].clientY
    const diff = currentY - touchStartY
    const newOffset = Math.max(-120, Math.min(120, diff * 0.8))
    setSwipeOffset(newOffset)
    if (newOffset > 15) setSwipingDirection('down')
    else if (newOffset < -15) setSwipingDirection('up')
    else setSwipingDirection(null)
  }

  const handleTouchEnd = async () => {
    if (!isSwiping || isChangingEpisode) {
      setIsSwiping(false); setSwipeOffset(0); setSwipingDirection(null)
      return
    }
    const velocity = Math.abs(swipeOffset) / (Date.now() - touchStartTime || 1)
    const isFastSwipe = velocity > 0.4
    const minSwipeDistance = 25
    
    if (Math.abs(swipeOffset) > minSwipeDistance || isFastSwipe) {
      if (swipeOffset > 0 && prevEpisode) await changeToPreviousEpisode()
      else if (swipeOffset < 0 && nextEpisode) await changeToNextEpisode()
    }
    setSwipeOffset(0); setIsSwiping(false)
    setTimeout(() => setSwipingDirection(null), 200)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isChangingEpisode) return
    setTouchStartY(e.clientY)
    setTouchStartTime(Date.now())
    setIsSwiping(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSwiping || isChangingEpisode) return
    const currentY = e.clientY
    const diff = currentY - touchStartY
    const newOffset = Math.max(-120, Math.min(120, diff * 0.8))
    setSwipeOffset(newOffset)
    if (newOffset > 15) setSwipingDirection('down')
    else if (newOffset < -15) setSwipingDirection('up')
    else setSwipingDirection(null)
  }

  const handleMouseUp = async () => {
    if (!isSwiping || isChangingEpisode) {
      setIsSwiping(false); setSwipeOffset(0); setSwipingDirection(null)
      return
    }
    const velocity = Math.abs(swipeOffset) / (Date.now() - touchStartTime || 1)
    const isFastSwipe = velocity > 0.4
    const minSwipeDistance = 25
    
    if (Math.abs(swipeOffset) > minSwipeDistance || isFastSwipe) {
      if (swipeOffset > 0 && prevEpisode) await changeToPreviousEpisode()
      else if (swipeOffset < 0 && nextEpisode) await changeToNextEpisode()
    }
    setSwipeOffset(0); setIsSwiping(false)
    setTimeout(() => setSwipingDirection(null), 200)
  }

  const changeToNextEpisode = async () => {
    if (!nextEpisode || isChangingEpisode) return
    setIsChangingEpisode(true)
    if (videoRef.current && session && selectedEpisode) {
      const currentTime = videoRef.current.currentTime
      await fetch('/api/user/save-progress', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId: selectedEpisode.id, currentTime: Math.floor(currentTime), seriesId: series?.id })
      }).catch(() => {})
    }
    if (canWatch(nextEpisode)) {
      setSelectedEpisode(nextEpisode)
      setTimeout(() => {
        if (videoRef.current) { videoRef.current.load(); videoRef.current.play(); setIsPlaying(true) }
      }, 50)
    } else {
      setPendingEpisode(nextEpisode); setIsUnlockModalOpen(true)
    }
    setTimeout(() => setIsChangingEpisode(false), 300)
  }

  const changeToPreviousEpisode = async () => {
    if (!prevEpisode || isChangingEpisode) return
    setIsChangingEpisode(true)
    if (videoRef.current && session && selectedEpisode) {
      const currentTime = videoRef.current.currentTime
      await fetch('/api/user/save-progress', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId: selectedEpisode.id, currentTime: Math.floor(currentTime), seriesId: series?.id })
      }).catch(() => {})
    }
    if (canWatch(prevEpisode)) {
      setSelectedEpisode(prevEpisode)
      setTimeout(() => {
        if (videoRef.current) { videoRef.current.load(); videoRef.current.play(); setIsPlaying(true) }
      }, 50)
    } else {
      setPendingEpisode(prevEpisode); setIsUnlockModalOpen(true)
    }
    setTimeout(() => setIsChangingEpisode(false), 300)
  }

  useEffect(() => {
    if (nextEpisode && nextEpisode.url && nextVideoRef.current) nextVideoRef.current.load()
  }, [nextEpisode])

  useEffect(() => { if (id) fetchSeries() }, [id])
  useEffect(() => { if (session && series && series.episodes.length > 0) { fetchPurchasedStatus(); fetchUserCoins() } }, [session, series])
  useEffect(() => { if (selectedEpisode) { fetchCounters(); fetchWatchHistory(selectedEpisode.id); setHasResumed(false) } }, [selectedEpisode])
  useEffect(() => { if (session) { checkAdAvailability(); loadFreeEpisodesCount() } }, [session])

  const loadFreeEpisodesCount = () => {
    const today = new Date().toDateString()
    const stored = localStorage.getItem(`kahonyn_free_episodes_${today}`)
    setEpisodesWatchedFree(parseInt(stored || '0'))
  }

  const saveFreeEpisodesCount = (count: number) => {
    const today = new Date().toDateString()
    localStorage.setItem(`kahonyn_free_episodes_${today}`, String(count))
    setEpisodesWatchedFree(count)
  }

  const checkAdAvailability = async () => {
    try {
      const res = await fetch('/api/ad/rewarded')
      const data = await res.json()
      setRemainingAds(data.remainingAds || 5)
      setMaxAdsPerDay(data.maxAdsPerDay || 5)
    } catch (error) { console.error('Erreur vérification pub:', error) }
  }

  useEffect(() => {
    if (showControls && isPlayerOpen) {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
      controlsTimeout.current = setTimeout(() => setShowControls(false), 4000)
    }
    return () => { if (controlsTimeout.current) clearTimeout(controlsTimeout.current) }
  }, [showControls, isPlayerOpen])
  
  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume
    if (nextVideoRef.current) nextVideoRef.current.volume = volume
  }, [volume])

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted
    if (nextVideoRef.current) nextVideoRef.current.muted = isMuted
  }, [isMuted])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !isPlayerOpen) return
    
    const handleVideoEnd = () => {
      setIsPlaying(false)
      if (selectedEpisode && series) {
        const currentIndex = series.episodes.findIndex(ep => ep.id === selectedEpisode.id)
        const nextEp = series.episodes[currentIndex + 1]
        if (nextEp) {
          if (canWatch(nextEp)) {
            const isNextEpisodeFree = nextEp.isFree
            if (!isNextEpisodeFree) {
              const freeCount = episodesWatchedFree
              if (freeCount >= freeEpisodesBeforeAd && !forcedAdNeeded && session) {
                setForcedAdNeeded(true)
                toast('📺 Publicité avant l\'épisode suivant', { duration: 3000, icon: '📺' })
                setTimeout(async () => {
                  setForcedAdNeeded(false)
                  saveFreeEpisodesCount(freeCount + 1)
                  setSelectedEpisode(nextEp)
                  setTimeout(() => {
                    if (videoRef.current) { videoRef.current.load(); videoRef.current.play(); setIsPlaying(true) }
                  }, 500)
                }, 10000)
              } else {
                saveFreeEpisodesCount(freeCount + 1)
                setSelectedEpisode(nextEp)
                setTimeout(() => {
                  if (videoRef.current) { videoRef.current.load(); videoRef.current.play(); setIsPlaying(true) }
                }, 500)
              }
            } else {
              setSelectedEpisode(nextEp)
              setTimeout(() => {
                if (videoRef.current) { videoRef.current.load(); videoRef.current.play(); setIsPlaying(true) }
              }, 500)
            }
          } else {
            setPendingEpisode(nextEp); setIsUnlockModalOpen(true)
          }
        }
      }
    }
    
    video.addEventListener('ended', handleVideoEnd)
    video.addEventListener('play', () => setIsPlaying(true))
    video.addEventListener('pause', () => setIsPlaying(false))
    return () => {
      video.removeEventListener('ended', handleVideoEnd)
      video.removeEventListener('play', () => setIsPlaying(true))
      video.removeEventListener('pause', () => setIsPlaying(false))
    }
  }, [selectedEpisode, series, isPlayerOpen, episodesWatchedFree, forcedAdNeeded, session])

  useEffect(() => {
    if (isPlayerOpen && videoRef.current && savedProgress > 0 && !hasResumed) {
      const timer = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = savedProgress
          setHasResumed(true)
          toast.success(`⏪ Reprise à ${formatDuration(savedProgress)}`)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isPlayerOpen, savedProgress, hasResumed])

  useEffect(() => {
    if (!isPlayerOpen || !videoRef.current || !session || !selectedEpisode) return
    const saveInterval = setInterval(async () => {
      if (videoRef.current) {
        const currentTime = videoRef.current.currentTime
        if (currentTime > 0) {
          await fetch('/api/user/save-progress', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ episodeId: selectedEpisode.id, currentTime: Math.floor(currentTime), seriesId: series?.id })
          }).catch(() => {})
        }
      }
    }, 5000)
    return () => clearInterval(saveInterval)
  }, [isPlayerOpen, selectedEpisode, session, series])

  useEffect(() => {
    if (!series || series.episodes.length === 0 || isPlayerOpen) return
    const shouldAutoplay = router.query.autoplay === 'true'
    if (!shouldAutoplay) return
    const timer = setTimeout(() => {
      const firstAccessibleEpisode = series.episodes.find(ep => canWatch(ep))
      if (firstAccessibleEpisode) {
        setSelectedEpisode(firstAccessibleEpisode)
        setIsPlayerOpen(true)
        router.replace(`/series/${series.id}`, undefined, { shallow: true })
      } else if (session) {
        const firstEpisode = series.episodes[0]
        if (firstEpisode) { setPendingEpisode(firstEpisode); setIsUnlockModalOpen(true) }
      } else if (!session) {
        toast('🔑 Connectez-vous pour regarder les épisodes gratuits', { duration: 4000, icon: '🔑' })
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [series, router.query.autoplay, session, isPlayerOpen])

  const fetchUserCoins = async () => {
    if (!session) return
    const data = await silentFetch<{ coins: number }>('/api/user/profile')
    if (data) setUserCoins(data.coins || 0)
  }

  const fetchCounters = async () => {
    if (!selectedEpisode) return
    const data = await silentFetch<{ userLiked: boolean; userSaved: boolean }>(`/api/user/counters?episodeId=${selectedEpisode.id}`)
    if (data) { setIsLiked(data.userLiked || false); setIsSaved(data.userSaved || false) }
  }

  const fetchWatchHistory = async (episodeId: string) => {
    if (!session) return
    const data = await silentFetch<any[]>(`/api/user/watch-history?videoId=${episodeId}`)
    setSavedProgress(data && data.length > 0 ? data[0].progress || 0 : 0)
  }

  const handleLike = async () => {
    if (!session) { toast.error('Connectez-vous pour aimer'); return }
    if (!selectedEpisode) return
    const previousState = isLiked
    setIsLiked(!isLiked)
    try {
      const res = await fetch('/api/user/like', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId: selectedEpisode.id })
      })
      const data = await res.json()
      if (res.ok) setIsLiked(data.liked)
      else { setIsLiked(previousState); toast.error(data.error || 'Erreur') }
    } catch (error) { setIsLiked(previousState); handleError(error, 'handleLike') }
  }

  const handleSave = async () => {
    if (!session) { toast.error('Connectez-vous pour sauvegarder'); return }
    if (!selectedEpisode) return
    const previousState = isSaved
    setIsSaved(!isSaved)
    try {
      const res = await fetch('/api/user/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId: selectedEpisode.id })
      })
      const data = await res.json()
      if (res.ok) setIsSaved(data.saved)
      else { setIsSaved(previousState); toast.error(data.error || 'Erreur') }
    } catch (error) { setIsSaved(previousState); handleError(error, 'handleSave') }
  }

  const fetchSeries = async () => {
    setLoading(true)
    try {
      const seriesData = await safeFetch<any>(`/api/public/series/${id}`, undefined, 'fetchSeries')
      if (!seriesData || !seriesData.id) { toast.error('Série non trouvée'); return }
      const episodesData = await safeFetch<any[]>(`/api/public/series/${id}/episodes`, undefined, 'fetchEpisodes')
      let validEpisodes = Array.isArray(episodesData) ? episodesData : []
      if (validEpisodes.length > 1) {
        const avgDuration = validEpisodes.reduce((sum, ep) => sum + (ep.duration || 0), 0) / validEpisodes.length
        validEpisodes = validEpisodes.filter(ep => (ep.duration || 0) <= avgDuration * 2)
      }
      const formattedEpisodes = validEpisodes.map((ep: any, index: number) => ({
        id: ep.id, episodeNumber: index + 1, title: ep.title || `Épisode ${index + 1}`,
        description: ep.description || '', url: ep.url || '', thumbnail: ep.thumbnail || '',
        duration: ep.duration || 0, price: ep.price || seriesData.price || 0,
        views: ep.views || 0, purchases: ep.purchasesCount || 0, status: ep.status || 'approved',
        isFree: index < (seriesData.freeEpisodes || 1)
      }))
      setSeries({
        id: seriesData.id, title: seriesData.title || 'Sans titre', description: seriesData.description || '',
        coverImage: seriesData.coverImage || '', creator: seriesData.creator || { name: 'Créateur', phone: '' },
        totalEpisodes: formattedEpisodes.length, freeEpisodes: seriesData.freeEpisodes || 0,
        totalViews: seriesData.totalViews || 0, totalPurchases: seriesData.totalPurchases || 0,
        episodes: formattedEpisodes, createdAt: seriesData.createdAt || new Date().toISOString()
      })
      if (formattedEpisodes.length > 0) setSelectedEpisode(formattedEpisodes[0])
      else toast.error('Cette série n\'a pas encore d\'épisodes disponibles')
    } catch (error) { handleError(error, 'fetchSeries') }
    finally { setLoading(false) }
  }

  const fetchPurchasedStatus = async () => {
    if (!series?.episodes.length || !session) return
    const episodeIds = series.episodes.map(ep => ep.id).join(',')
    const data = await silentFetch<{ purchasedIds: string[] }>(`/api/user/purchased-episodes?ids=${episodeIds}`)
    if (data) setPurchasedEpisodes(new Set(data.purchasedIds || []))
  }

  const handlePurchase = async (episode: Episode) => {
    if (!session) { toast.error('Connectez-vous pour acheter'); router.push('/?auth=login'); return }
    if (userCoins < episode.price) { toast.error(`Solde insuffisant. Il vous manque ${episode.price - userCoins} coins.`); return }
    setIsPurchasing(true)
    try {
      const res = await fetch('/api/purchase-episode', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId: episode.id })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`🎉 Épisode ${episode.episodeNumber} débloqué !`)
        setPurchasedEpisodes(prev => new Set([...prev, episode.id]))
        setUserCoins(prev => prev - episode.price)
        setIsUnlockModalOpen(false); setPendingEpisode(null)
        setSelectedEpisode(episode); setIsPlayerOpen(true)
        await fetchUserCoins(); await fetchPurchasedStatus()
      } else { toast.error(data.error || 'Erreur lors de l\'achat') }
    } catch (error) { handleError(error, 'handlePurchase') }
    finally { setIsPurchasing(false) }
  }

  const watchAdForEpisode = async (episode: Episode) => {
    if (!session) { toast.error('Connectez-vous pour débloquer avec une pub'); router.push('/?auth=login'); return }
    if (remainingAds <= 0) { toast.error(`Limite quotidienne atteinte (${maxAdsPerDay}/5 pubs). Réessayez demain.`); return }
    setWatchingAd(true)
    try {
      const toastId = toast.loading('📺 Publicité en cours... 5s', { duration: 5000 })
      await new Promise(resolve => setTimeout(resolve, 5000))
      toast.dismiss(toastId)
      const res = await fetch('/api/ad/rewarded', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId: episode.id, rewardType: 'free_episode' })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`🎉 Épisode ${episode.episodeNumber} débloqué !`)
        await fetchPurchasedStatus(); await checkAdAvailability()
        setIsUnlockModalOpen(false); setPendingEpisode(null)
        setSelectedEpisode(episode); setIsPlayerOpen(true)
      } else { toast.error(data.error || 'Erreur lors du déblocage') }
    } catch (error) { toast.error('Erreur de connexion'); handleError(error, 'watchAdForEpisode') }
    finally { setWatchingAd(false) }
  }

  const handlePlay = (episode: Episode) => {
    if (canWatch(episode)) { setSelectedEpisode(episode); setIsPlayerOpen(true) }
    else { setPendingEpisode(episode); setIsUnlockModalOpen(true) }
  }

  const canWatch = (episode: Episode): boolean => {
    if ((session?.user as any)?.role === 'admin') return true
    if (purchasedEpisodes.has(episode.id)) return true
    if (episode.isFree) return true
    return false
  }

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleShare = async () => {
    try { await navigator.clipboard.writeText(window.location.href); toast.success('Lien copié !') }
    catch { toast.error('Impossible de copier le lien') }
  }

  const toggleMute = () => setIsMuted(!isMuted)
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (newVolume === 0) setIsMuted(true)
    else if (isMuted) setIsMuted(false)
  }

  const handleQualityChange = (quality: string) => {
    setSelectedQuality(quality)
    setShowQualityMenu(false)
    if (videoRef.current && selectedEpisode) {
      const currentTime = videoRef.current.currentTime
      const wasPlaying = !videoRef.current.paused
      if (quality !== 'auto') {
        const baseUrl = selectedEpisode.url.split('?')[0]
        videoRef.current.src = `${baseUrl}?quality=${quality}`
        videoRef.current.currentTime = currentTime
        if (wasPlaying) videoRef.current.play()
      }
    }
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause()
    }
    setShowControls(true)
  }

  const handleClosePlayer = () => {
    if (videoRef.current && selectedEpisode && session) {
      fetch('/api/user/save-progress', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId: selectedEpisode.id, currentTime: Math.floor(videoRef.current.currentTime), seriesId: series?.id })
      }).catch(() => {})
    }
    setIsPlayerOpen(false)
    setHasResumed(false)
    document.body.style.overflow = 'auto'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1A0A00] via-[#0D0D0D] to-[#0D0D0D]">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
        </div>
      </div>
    )
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1A0A00] via-[#0D0D0D] to-[#0D0D0D]">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <p className="text-[#D4A855]/70">Série non trouvée</p>
        </div>
      </div>
    )
  }

  if (isPlayerOpen) document.body.style.overflow = 'hidden'
  else document.body.style.overflow = 'auto'

  if (series.episodes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1A0A00] via-[#0D0D0D] to-[#0D0D0D]">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
          <div className="w-24 h-24 rounded-2xl bg-[#1A1A2E] border border-[#8B5A2B]/20 flex items-center justify-center mb-6 text-5xl">🎬</div>
          <h2 className="text-xl font-bold text-white mb-2">Aucun épisode disponible</h2>
          <p className="text-sm text-[#D4A855]/70 max-w-md">Cette série est en cours de préparation. Revenez bientôt pour découvrir les épisodes !</p>
          <button onClick={() => router.push('/')} className="mt-6 px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white rounded-xl font-bold">Retour à l'accueil</button>
        </div>
      </div>
    )
  }

  return (
    <>
      {!isPlayerOpen && <Navbar />}
      
      {!isPlayerOpen ? (
        <div className="min-h-screen bg-gradient-to-b from-[#1A0A00] via-[#0D0D0D] to-[#0D0D0D] pb-16">
          <div className="fixed top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#8B5A2B]/10 via-[#8B5A2B]/5 to-transparent pointer-events-none z-0" />
          <div className="relative z-10 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white">
            <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
              <div className="w-24 h-24 rounded-xl overflow-hidden shadow-xl flex-shrink-0 bg-white/20">
                {series.coverImage ? <img src={series.coverImage} alt={series.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">🎬</div>}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-xl font-bold">{series.title}</h1>
                <p className="text-white/80 text-sm mt-1">{series.description}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3 text-sm">
                  <span>🎬 {series.totalEpisodes} épisodes</span>
                  <span>🆓 {series.freeEpisodes} gratuits</span>
                  <span>👁️ {(series.totalViews || 0).toLocaleString()} vues</span>
                  {session && <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">🪙 {userCoins} coins</span>}
                </div>
              </div>
            </div>
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
            {!session ? (
              <div className="bg-blue-500/10 rounded-xl p-3 mb-6 border border-blue-500/20"><p className="text-xs text-blue-400 font-bold">🔑 Connectez-vous pour regarder les épisodes gratuits</p></div>
            ) : series.freeEpisodes > 0 ? (
              <div className="bg-green-500/10 rounded-xl p-3 mb-6 border border-green-500/20"><p className="text-xs text-green-400 font-bold">🎁 {series.freeEpisodes} premier{series.freeEpisodes > 1 ? 's' : ''} épisode{series.freeEpisodes > 1 ? 's' : ''} gratuit{series.freeEpisodes > 1 ? 's' : ''} !</p></div>
            ) : (
              <div className="bg-amber-500/10 rounded-xl p-3 mb-6 border border-amber-500/20"><p className="text-xs text-amber-400 font-bold">⚠️ Tous les épisodes sont payants. Achetez des coins ou regardez une pub.</p></div>
            )}
            {session && remainingAds > 0 && (
              <div className="bg-purple-500/10 rounded-xl p-2 mb-4 border border-purple-500/20 text-center"><p className="text-xs text-purple-400 font-bold flex items-center justify-center gap-2"><TvIcon className="w-3.5 h-3.5" /> 📺 {remainingAds}/{maxAdsPerDay} pubs disponibles aujourd&apos;hui</p></div>
            )}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] flex items-center justify-center shadow-lg shadow-[#FF6B35]/20"><PlayIcon className="w-4 h-4 text-white" /></div>
                <div><h2 className="text-base font-bold text-white">Épisodes</h2><p className="text-sm text-[#D4A855]/70 font-medium">{series.totalEpisodes} épisodes{series.totalEpisodes !== series.episodes.length && <span className="ml-2 text-xs text-green-400">(master masqué)</span>}</p></div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {series.episodes.map((episode) => {
                const isAccessible = canWatch(episode)
                const isFree = episode.isFree
                return (
                  <div key={episode.id} onClick={() => handlePlay(episode)} className={`relative cursor-pointer rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${isAccessible ? 'bg-[#1A1A2E] border border-[#8B5A2B]/10' : 'bg-[#1A1A2E]/80 border border-[#8B5A2B]/5'}`}>
                    <div className="relative aspect-video bg-[#0D0D0D] flex items-center justify-center">
                      {episode.thumbnail ? <img src={episode.thumbnail} alt={episode.title} className="w-full h-full object-cover" /> : <PlayIcon className="w-8 h-8 text-[#8B5A2B]/30" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A00]/80 via-transparent to-transparent flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><PlayIcon className="w-10 h-10 text-white" /></div>
                      <div className="absolute top-2 left-2 bg-[#FF6B35] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Ép. {episode.episodeNumber}</div>
                      <div className="absolute top-2 right-2">
                        {isFree ? <span className="bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">GRATUIT</span> : isAccessible ? <span className="bg-blue-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">DÉBLOQUÉ</span> : <span className="bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><LockClosedIcon className="w-3 h-3" />{episode.price} 🪙</span>}
                      </div>
                    </div>
                    <div className="p-2"><p className="font-semibold text-xs text-white line-clamp-1">{episode.title}</p><p className="text-[10px] text-[#D4A855]/50 mt-0.5">{formatDuration(episode.duration)}</p></div>
                  </div>
                )
              })}
            </div>
            {selectedEpisode && (
              <div className="max-w-4xl mx-auto py-6 space-y-6">
                <div className="bg-[#1A1A2E] rounded-2xl border border-[#8B5A2B]/10 p-5"><h3 className="text-base font-bold text-white mb-3">⭐ Notez cet épisode</h3><StarRating videoId={selectedEpisode.id} /></div>
                <div className="bg-[#1A1A2E] rounded-2xl border border-[#8B5A2B]/10 p-5"><CommentSection videoId={selectedEpisode.id} /></div>
              </div>
            )}
            <Footer footerTabs={footerTabs} activeFooterTab={activeFooterTab} setActiveFooterTab={setActiveFooterTab} />
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* LECTEUR PLEIN ÉCRAN AVEC SWIPE TIKTOK-LIKE - VERSION AMÉLIORÉE */
        /* ============================================================ */
        <div 
          className="fixed inset-0 bg-black z-[9999] overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ cursor: isSwiping ? 'grabbing' : 'grab' }}
        >
          {/* Vidéo suivante (préchargée) */}
          {nextEpisode && nextEpisode.url && (
            <video
              ref={nextVideoRef}
              src={nextEpisode.url}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{
                transform: `translateY(${Math.max(0, 100 + (Math.abs(swipeOffset) / 150) * 100)}%)`,
                opacity: Math.min(1, Math.abs(swipeOffset) / 60),
                transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1), opacity 0.2s ease-out'
              }}
              preload="auto"
            />
          )}
          
          {/* Vidéo précédente (préchargée) */}
          {prevEpisode && prevEpisode.url && (
            <video
              src={prevEpisode.url}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{
                transform: `translateY(${Math.min(0, -100 - (Math.abs(swipeOffset) / 150) * 100)}%)`,
                opacity: Math.min(1, Math.abs(swipeOffset) / 60),
                transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1), opacity 0.2s ease-out'
              }}
              preload="auto"
            />
          )}
          
          {/* Vidéo courante */}
          <video 
            ref={videoRef} 
            autoPlay 
            className="absolute inset-0 w-full h-full object-contain" 
            key={selectedEpisode?.url} 
            playsInline
            style={{
              transform: `translateY(${swipeOffset}px)`,
              transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1)'
            }}
          >
            {selectedEpisode?.url && <source src={selectedEpisode.url} type="video/mp4" />}
          </video>
          
          {/* ============================================================ */}
          {/* INTERFACE FIXE (NE DISPARAÎT PAS PENDANT LE SWIPE) */}
          {/* ============================================================ */}
          
          {/* Barre supérieure fixe */}
          <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/60 to-transparent pt-5 pb-10 pointer-events-none">
            <div className="flex items-center justify-between px-4 pointer-events-auto">
              {/* Bouton retour à gauche */}
              <button 
                onClick={handleClosePlayer} 
                className="w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/70 transition-all active:scale-95"
              >
                <ChevronLeftIcon className="w-6 h-6 text-white" />
              </button>
              
              {/* Titre de l'épisode au centre */}
              <div className="text-center">
                <h2 className="text-sm font-semibold text-white line-clamp-1 max-w-[200px]">{selectedEpisode?.title || 'Épisode'}</h2>
                <p className="text-[10px] text-white/70">Épisode {selectedEpisode?.episodeNumber}</p>
              </div>
              
              {/* Espace pour équilibrer */}
              <div className="w-10" />
            </div>
          </div>
          
          {/* Indicateur de direction de swipe (discret) */}
          {swipingDirection && (
            <div className={`absolute left-1/2 transform -translate-x-1/2 z-30 transition-all duration-150 ${
              swipingDirection === 'up' ? 'top-1/3' : 'bottom-1/3'
            }`}>
              <div className="bg-white/20 backdrop-blur-md rounded-full p-2 shadow-lg">
                {swipingDirection === 'up' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>
            </div>
          )}
          
          {/* Boutons latéraux (like, save, share, liste) */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-30">
            <button onClick={handleLike} className="text-white bg-black/50 backdrop-blur-md rounded-full p-3 hover:bg-black/70 transition-all active:scale-95 w-12 h-12 flex items-center justify-center">
              {isLiked ? <HeartSolidIcon className="w-6 h-6 text-red-500" /> : <HeartIcon className="w-6 h-6" />}
            </button>
            <button onClick={handleSave} className="text-white bg-black/50 backdrop-blur-md rounded-full p-3 hover:bg-black/70 transition-all active:scale-95 w-12 h-12 flex items-center justify-center">
              <BookmarkIcon className={`w-6 h-6 ${isSaved ? 'fill-[#FF6B35] text-[#FF6B35]' : ''}`} />
            </button>
            <button onClick={handleShare} className="text-white bg-black/50 backdrop-blur-md rounded-full p-3 hover:bg-black/70 transition-all active:scale-95 w-12 h-12 flex items-center justify-center">
              <ShareIcon className="w-6 h-6" />
            </button>
            <button onClick={() => setShowEpisodeModal(true)} className="text-white bg-black/50 backdrop-blur-md rounded-full p-3 hover:bg-black/70 transition-all active:scale-95 w-12 h-12 flex items-center justify-center">
              <QueueListIcon className="w-6 h-6" />
            </button>
          </div>
          
          {/* Contrôles du bas (progress bar, play/pause, volume, qualité) */}
          <div className={`absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/60 to-transparent pt-10 pb-4 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}>
            {/* Barre de progression */}
            <div className="px-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-white text-xs font-mono">
                  {formatDuration(Math.floor(videoRef.current?.currentTime || 0))}
                </span>
                <input 
                  type="range" 
                  min="0" 
                  max={selectedEpisode?.duration || 100} 
                  value={videoRef.current?.currentTime || 0} 
                  onChange={(e) => { if (videoRef.current) videoRef.current.currentTime = parseFloat(e.target.value) }} 
                  className="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-[#FF6B35]"
                />
                <span className="text-white text-xs font-mono">
                  {formatDuration(selectedEpisode?.duration || 0)}
                </span>
              </div>
            </div>
            
            {/* Boutons de contrôle */}
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                {/* Bouton volume */}
                <div className="relative">
                  <button 
                    onClick={toggleMute} 
                    className="text-white bg-black/50 backdrop-blur-md rounded-full p-2 hover:bg-black/70 transition-all w-9 h-9 flex items-center justify-center"
                  >
                    {isMuted || volume === 0 ? <SpeakerXMarkIcon className="w-5 h-5" /> : <SpeakerWaveIcon className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Bouton qualité */}
                <div className="relative">
                  <button 
                    onClick={() => setShowQualityMenu(!showQualityMenu)} 
                    className="text-white bg-black/50 backdrop-blur-md rounded-full p-2 hover:bg-black/70 transition-all w-9 h-9 flex items-center justify-center"
                  >
                    <Cog6ToothIcon className="w-5 h-5" />
                  </button>
                  {showQualityMenu && (
                    <div className="absolute bottom-12 left-0 bg-[#1A1A2E] rounded-xl shadow-2xl border border-[#8B5A2B]/20 overflow-hidden z-40 min-w-[120px]">
                      {QUALITY_OPTIONS.map((q) => (
                        <button 
                          key={q.value} 
                          onClick={() => handleQualityChange(q.value)} 
                          className={`w-full px-4 py-2.5 text-xs font-semibold text-left hover:bg-white/10 transition flex items-center justify-between ${
                            selectedQuality === q.value ? 'text-[#FF6B35]' : 'text-white'
                          }`}
                        >
                          {q.label}
                          {selectedQuality === q.value && <CheckCircleIcon className="w-3.5 h-3.5 text-[#FF6B35]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Bouton Play/Pause central */}
              <button 
                onClick={togglePlayPause} 
                className="text-white bg-black/50 backdrop-blur-md rounded-full p-4 hover:bg-black/70 transition-all active:scale-95 w-16 h-16 flex items-center justify-center"
              >
                {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8 ml-0.5" />}
              </button>
              
              {/* Espace pour équilibrer */}
              <div className="w-16" />
            </div>
          </div>
          
          {/* Indicateur de pub forcée */}
          {forcedAdNeeded && (
            <div className="absolute top-24 left-0 right-0 text-center z-30">
              <div className="bg-purple-500/80 text-white text-xs px-4 py-2 rounded-full inline-flex items-center gap-2 backdrop-blur-sm mx-auto w-fit">
                <div className="animate-pulse">📺</div>
                Publicité avant l&apos;épisode suivant...
                <div className="animate-spin h-3 w-3 border-2 border-white/30 border-t-white rounded-full"></div>
              </div>
            </div>
          )}
          
          {/* Indicateur de changement d'épisode */}
          {isChangingEpisode && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40">
              <div className="animate-spin rounded-full h-10 w-10 border-3 border-white/30 border-t-[#FF6B35]"></div>
            </div>
          )}
        </div>
      )}
      
      {/* Modal des épisodes */}
      {showEpisodeModal && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000]" onClick={() => setShowEpisodeModal(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0D0D0D] to-[#1A1A2E] rounded-t-3xl z-[10001] animate-slideUp max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="sticky top-0 bg-[#0D0D0D]/98 backdrop-blur-xl p-4 border-b border-[#8B5A2B]/10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg"><QueueListIcon className="w-4 h-4 text-white" /></div>
                <div><h2 className="text-white font-bold text-base">Épisodes de {series?.title}</h2><p className="text-[#D4A855]/50 text-[10px]">{series?.episodes.length} épisodes</p></div>
              </div>
              <button onClick={() => setShowEpisodeModal(false)} className="w-8 h-8 bg-white/[0.04] hover:bg-white/[0.08] rounded-full flex items-center justify-center transition-all"><XMarkIcon className="w-4 h-4 text-white" /></button>
            </div>
            <div className="overflow-y-auto max-h-[70vh] p-4">
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                {series?.episodes.map((ep) => {
                  const isAccessible = canWatch(ep)
                  const isCurrent = selectedEpisode?.id === ep.id
                  return (
                    <div key={ep.id} onClick={() => { 
                      if (isAccessible) { 
                        setSelectedEpisode(ep)
                        setShowEpisodeModal(false)
                        setTimeout(() => { if (videoRef.current) { videoRef.current.load(); videoRef.current.play() } }, 100)
                      } else {
                        setPendingEpisode(ep)
                        setIsUnlockModalOpen(true)
                        setShowEpisodeModal(false)
                      }
                    }} className={`group relative cursor-pointer rounded-xl transition-all duration-300 ${
                      isCurrent 
                        ? 'bg-gradient-to-br from-[#FF6B35] to-orange-600 shadow-lg scale-105 ring-2 ring-orange-400' 
                        : isAccessible 
                          ? 'bg-green-500/10 hover:bg-green-500/20' 
                          : 'bg-white/[0.03] hover:bg-white/[0.06]'
                    }`}>
                      <div className="aspect-square flex flex-col items-center justify-center p-2">
                        <div className={`text-2xl mb-1 transition-all ${isCurrent ? 'animate-bounce' : ''}`}>
                          {isCurrent ? '▶️' : isAccessible ? (ep.isFree ? '🆓' : '✅') : '🔒'}
                        </div>
                        <p className={`text-sm font-bold ${isCurrent ? 'text-white' : 'text-white/80'}`}>{ep.episodeNumber}</p>
                        {!isAccessible && <p className="text-[9px] font-semibold text-amber-400 mt-1">{ep.price} 🪙</p>}
                        {isAccessible && !isCurrent && <p className="text-[8px] text-green-400 mt-1">{ep.isFree ? 'Gratuit' : 'Débloqué'}</p>}
                        {isCurrent && <p className="text-[8px] text-white/80 mt-1">En cours</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {pendingEpisode && (
        <UnlockEpisodeModal
          isOpen={isUnlockModalOpen}
          onClose={() => { setIsUnlockModalOpen(false); setPendingEpisode(null) }}
          episodeNumber={pendingEpisode.episodeNumber}
          episodeTitle={pendingEpisode.title}
          episodePrice={pendingEpisode.price}
          userCoins={userCoins}
          remainingAds={remainingAds}
          maxAdsPerDay={maxAdsPerDay}
          onPurchase={() => handlePurchase(pendingEpisode)}
          onWatchAd={() => watchAdForEpisode(pendingEpisode)}
          isPurchasing={isPurchasing}
          isWatchingAd={watchingAd}
        />
      )}
      
      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </>
  )
}