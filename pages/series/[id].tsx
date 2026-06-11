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
  BookmarkIcon, QueueListIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon,
  HeartIcon, ShareIcon, HomeIcon, UserGroupIcon, TrophyIcon,
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

  // 🆕 États pour le swipe vertical (comme TikTok)
  const [touchStartY, setTouchStartY] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [nextEpisode, setNextEpisode] = useState<Episode | null>(null)
  const [prevEpisode, setPrevEpisode] = useState<Episode | null>(null)
  const [swipingDirection, setSwipingDirection] = useState<'up' | 'down' | null>(null)

  const footerTabs = [
    { id: 'home', label: 'Accueil', icon: HomeIcon, href: '/' },
    { id: 'for-you', label: 'Pour vous', icon: UserGroupIcon, href: '/for-you' },
    { id: 'my-list', label: 'Ma liste', icon: BookmarkIcon, href: '/my-list' },
    { id: 'premium', label: 'Primes', icon: TrophyIcon, href: '/premium' },
    { id: 'profile', label: 'Profil', icon: UserCircleIcon, href: '/profile' },
  ]

  // 🆕 Charger les épisodes voisins pour le swipe
  const loadAdjacentEpisodes = () => {
    if (!selectedEpisode || !series) return
    
    const currentIndex = series.episodes.findIndex(ep => ep.id === selectedEpisode.id)
    setNextEpisode(series.episodes[currentIndex + 1] || null)
    setPrevEpisode(series.episodes[currentIndex - 1] || null)
  }

  useEffect(() => {
    if (selectedEpisode && series) {
      loadAdjacentEpisodes()
    }
  }, [selectedEpisode, series])

  // 🆕 Fonctions de swipe TikTok-like
  const handleTouchStart = (e: React.TouchEvent) => {
  setTouchStartY(e.touches[0].clientY)
  setIsSwiping(true)
}

  const handleTouchMove = (e: React.TouchEvent) => {
  if (!isSwiping) return
  
  const currentY = e.touches[0].clientY
  const diff = currentY - touchStartY // ✅ Inversé : positif = vers le bas
  const newOffset = Math.max(-window.innerHeight, Math.min(window.innerHeight, diff))
  
  setSwipeOffset(newOffset)
  
  // ✅ Détection des directions CORRIGÉE
  if (newOffset > 50) {
    setSwipingDirection('down')  // Swipe vers le BAS
  } else if (newOffset < -50) {
    setSwipingDirection('up')    // Swipe vers le HAUT
  } else {
    setSwipingDirection(null)
  }
}

  const handleTouchEnd = async () => {
  if (!isSwiping) {
    setIsSwiping(false)
    setSwipeOffset(0)
    setSwipingDirection(null)
    return
  }
  
  const threshold = window.innerHeight * 0.3 // 30% de l'écran
  
  // ✅ Actions CORRIGÉES
  if (swipeOffset > threshold && prevEpisode) {
    // Swipe vers le BAS (doigt descend) → Épisode PRÉCÉDENT
    await goToPreviousEpisode()
  } else if (swipeOffset < -threshold && nextEpisode) {
    // Swipe vers le HAUT (doigt monte) → Épisode SUIVANT
    await goToNextEpisode()
  }
  
  // Reset
  setSwipeOffset(0)
  setIsSwiping(false)
  setSwipingDirection(null)
}

  // 🆕 Navigation vers l'épisode suivant avec effet TikTok
  const goToNextEpisode = async () => {
    if (!nextEpisode) return
    
    // Sauvegarder la progression de l'épisode actuel
    if (videoRef.current && session && selectedEpisode) {
      const currentTime = videoRef.current.currentTime
      await fetch('/api/user/save-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          episodeId: selectedEpisode.id, 
          currentTime: Math.floor(currentTime),
          seriesId: series?.id
        })
      }).catch(() => {})
    }
    
    if (canWatch(nextEpisode)) {
      setSelectedEpisode(nextEpisode)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load()
          videoRef.current.play()
          setIsPlaying(true)
        }
      }, 100)
    } else {
      setPendingEpisode(nextEpisode)
      setIsUnlockModalOpen(true)
    }
  }

  // 🆕 Navigation vers l'épisode précédent avec effet TikTok
  const goToPreviousEpisode = async () => {
    if (!prevEpisode) return
    
    // Sauvegarder la progression de l'épisode actuel
    if (videoRef.current && session && selectedEpisode) {
      const currentTime = videoRef.current.currentTime
      await fetch('/api/user/save-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          episodeId: selectedEpisode.id, 
          currentTime: Math.floor(currentTime),
          seriesId: series?.id
        })
      }).catch(() => {})
    }
    
    if (canWatch(prevEpisode)) {
      setSelectedEpisode(prevEpisode)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load()
          videoRef.current.play()
          setIsPlaying(true)
        }
      }, 100)
    } else {
      setPendingEpisode(prevEpisode)
      setIsUnlockModalOpen(true)
    }
  }

  // 🆕 Gestion du swipe par souris (desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
  setTouchStartY(e.clientY)
  setIsSwiping(true)
}

const handleMouseMove = (e: React.MouseEvent) => {
  if (!isSwiping) return
  
  const currentY = e.clientY
  const diff = currentY - touchStartY // ✅ Inversé
  const newOffset = Math.max(-window.innerHeight, Math.min(window.innerHeight, diff))
  
  setSwipeOffset(newOffset)
  
  if (newOffset > 50) {
    setSwipingDirection('down')
  } else if (newOffset < -50) {
    setSwipingDirection('up')
  } else {
    setSwipingDirection(null)
  }
}

const handleMouseUp = async () => {
  if (!isSwiping) {
    setIsSwiping(false)
    setSwipeOffset(0)
    setSwipingDirection(null)
    return
  }
  
  const threshold = window.innerHeight * 0.3
  
  // ✅ Actions CORRIGÉES
  if (swipeOffset > threshold && prevEpisode) {
    await goToPreviousEpisode()
  } else if (swipeOffset < -threshold && nextEpisode) {
    await goToNextEpisode()
  }
  
  setSwipeOffset(0)
  setIsSwiping(false)
  setSwipingDirection(null)
}

  // 🆕 Précharger la vidéo suivante
  useEffect(() => {
    if (nextEpisode && nextEpisode.url && nextVideoRef.current) {
      nextVideoRef.current.load()
    }
  }, [nextEpisode])

  useEffect(() => { if (id) fetchSeries() }, [id])
  useEffect(() => { if (session && series && series.episodes.length > 0) { fetchPurchasedStatus(); fetchUserCoins() } }, [session, series])
  useEffect(() => { if (selectedEpisode) { fetchCounters(); fetchWatchHistory(selectedEpisode.id); setHasResumed(false) } }, [selectedEpisode])
  
  useEffect(() => {
    if (session) {
      checkAdAvailability()
      loadFreeEpisodesCount()
    }
  }, [session])

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
    } catch (error) {
      console.error('Erreur vérification pub:', error)
    }
  }

  useEffect(() => {
    if (showControls && isPlayerOpen) {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
      controlsTimeout.current = setTimeout(() => setShowControls(false), 3000)
    }
    return () => { if (controlsTimeout.current) clearTimeout(controlsTimeout.current) }
  }, [showControls, isPlayerOpen])
  
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume
      videoRef.current.muted = isMuted
    }
    if (nextVideoRef.current) {
      nextVideoRef.current.volume = volume
      nextVideoRef.current.muted = isMuted
    }
  }, [volume, isMuted])

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
            const FREE_BEFORE_AD = freeEpisodesBeforeAd
            
            if (!isNextEpisodeFree) {
              const freeCount = episodesWatchedFree
              
              if (freeCount >= FREE_BEFORE_AD && !forcedAdNeeded && session) {
                setForcedAdNeeded(true)
                toast('📺 Publicité avant l\'épisode suivant', { duration: 3000, icon: '📺' })
                
                setTimeout(async () => {
                  setForcedAdNeeded(false)
                  saveFreeEpisodesCount(freeCount + 1)
                  setSelectedEpisode(nextEp)
                  setTimeout(() => {
                    if (videoRef.current) {
                      videoRef.current.load()
                      videoRef.current.play()
                      setIsPlaying(true)
                    }
                  }, 500)
                }, 10000)
              } else {
                saveFreeEpisodesCount(freeCount + 1)
                setSelectedEpisode(nextEp)
                setTimeout(() => {
                  if (videoRef.current) {
                    videoRef.current.load()
                    videoRef.current.play()
                    setIsPlaying(true)
                  }
                }, 500)
              }
            } else {
              setSelectedEpisode(nextEp)
              setTimeout(() => {
                if (videoRef.current) {
                  videoRef.current.load()
                  videoRef.current.play()
                  setIsPlaying(true)
                }
              }, 500)
            }
          } else {
            setPendingEpisode(nextEp)
            setIsUnlockModalOpen(true)
          }
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
  }, [selectedEpisode, series, isPlayerOpen, episodesWatchedFree, forcedAdNeeded, session, freeEpisodesBeforeAd])

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
          try {
            await fetch('/api/user/save-progress', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ episodeId: selectedEpisode.id, currentTime: Math.floor(currentTime), seriesId: series?.id })
            })
          } catch (error) { console.error('Save progress error:', error) }
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
        if (firstEpisode) {
          setPendingEpisode(firstEpisode)
          setIsUnlockModalOpen(true)
        }
      } else if (!session) {
        toast('🔑 Connectez-vous pour regarder les épisodes gratuits', { duration: 4000, icon: '🔑' })
      }
    }, 500)
    
    return () => clearTimeout(timer)
  }, [series, router.query.autoplay, session, isPlayerOpen])

  const fetchUserCoins = async () => {
    if (!session) return
    try {
      const data = await silentFetch<{ coins: number }>('/api/user/profile')
      if (data) setUserCoins(data.coins || 0)
    } catch (error) { console.error('fetchUserCoins error:', error) }
  }

  const fetchCounters = async () => {
    if (!selectedEpisode) return
    try {
      const data = await silentFetch<{ userLiked: boolean; userSaved: boolean }>(`/api/user/counters?episodeId=${selectedEpisode.id}`)
      if (data) {
        setIsLiked(data.userLiked || false)
        setIsSaved(data.userSaved || false)
      }
    } catch (error) { console.error('fetchCounters error:', error) }
  }

  const fetchWatchHistory = async (episodeId: string) => {
    if (!session) return
    try {
      const data = await silentFetch<any[]>(`/api/user/watch-history?videoId=${episodeId}`)
      if (data && data.length > 0) setSavedProgress(data[0].progress || 0)
      else setSavedProgress(0)
    } catch (error) { console.error('fetchWatchHistory error:', error) }
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

  const goToPreviousEpisodeBtn = () => {
    if (!selectedEpisode || !series) return
    const currentIndex = series.episodes.findIndex(ep => ep.id === selectedEpisode.id)
    const prevEp = series.episodes[currentIndex - 1]
    if (prevEp && canWatch(prevEp)) setSelectedEpisode(prevEp)
  }

  const goToNextEpisodeBtn = () => {
    if (!selectedEpisode || !series) return
    const currentIndex = series.episodes.findIndex(ep => ep.id === selectedEpisode.id)
    const nextEp = series.episodes[currentIndex + 1]
    if (nextEp && canWatch(nextEp)) setSelectedEpisode(nextEp)
  }

  const hasNextEpisodeBtn = () => {
    if (!selectedEpisode || !series) return false
    const currentIndex = series.episodes.findIndex(ep => ep.id === selectedEpisode.id)
    const nextEp = series.episodes[currentIndex + 1]
    return !!(nextEp && canWatch(nextEp))
  }

  const hasPreviousEpisodeBtn = () => {
    if (!selectedEpisode || !series) return false
    const currentIndex = series.episodes.findIndex(ep => ep.id === selectedEpisode.id)
    const prevEp = series.episodes[currentIndex - 1]
    return !!(prevEp && canWatch(prevEp))
  }

  const fetchSeries = async () => {
    setLoading(true)
    try {
      const seriesData = await safeFetch<any>(`/api/public/series/${id}`, undefined, 'fetchSeries')
      
      if (!seriesData || !seriesData.id) {
        toast.error('Série non trouvée')
        return
      }

      const episodesData = await safeFetch<any[]>(`/api/public/series/${id}/episodes`, undefined, 'fetchEpisodes')
      
      let validEpisodes = Array.isArray(episodesData) ? episodesData : []
      
      if (validEpisodes.length > 1) {
        const avgDuration = validEpisodes.reduce((sum, ep) => sum + (ep.duration || 0), 0) / validEpisodes.length
        validEpisodes = validEpisodes.filter(ep => {
          const duration = ep.duration || 0
          return duration <= avgDuration * 2
        })
      }
      
      const formattedEpisodes = validEpisodes.map((ep: any, index: number) => ({
        id: ep.id,
        episodeNumber: index + 1,
        title: ep.title || `Épisode ${index + 1}`,
        description: ep.description || '',
        url: ep.url || '',
        thumbnail: ep.thumbnail || '',
        duration: ep.duration || 0,
        price: ep.price || seriesData.price || 0,
        views: ep.views || 0,
        purchases: ep.purchasesCount || 0,
        status: ep.status || 'approved',
        isFree: index < (seriesData.freeEpisodes || 1)
      }))
      
      setSeries({
        id: seriesData.id,
        title: seriesData.title || 'Sans titre',
        description: seriesData.description || '',
        coverImage: seriesData.coverImage || '',
        creator: seriesData.creator || { name: 'Créateur', phone: '' },
        totalEpisodes: formattedEpisodes.length,
        freeEpisodes: seriesData.freeEpisodes || 0,
        totalViews: seriesData.totalViews || 0,
        totalPurchases: seriesData.totalPurchases || 0,
        episodes: formattedEpisodes,
        createdAt: seriesData.createdAt || new Date().toISOString()
      })
      
      if (formattedEpisodes.length > 0) {
        setSelectedEpisode(formattedEpisodes[0])
      } else {
        toast.error('Cette série n\'a pas encore d\'épisodes disponibles')
      }
    } catch (error) {
      handleError(error, 'fetchSeries')
    } finally {
      setLoading(false)
    }
  }

  const fetchPurchasedStatus = async () => {
    if (!series?.episodes.length || !session) return
    try {
      const episodeIds = series.episodes.map(ep => ep.id).join(',')
      const data = await silentFetch<{ purchasedIds: string[] }>(`/api/user/purchased-episodes?ids=${episodeIds}`)
      if (data) setPurchasedEpisodes(new Set(data.purchasedIds || []))
    } catch (error) { console.error('fetchPurchasedStatus error:', error) }
  }

  const handlePurchase = async (episode: Episode) => {
    if (!session) { 
      toast.error('Connectez-vous pour acheter')
      router.push('/?auth=login')
      return 
    }
    if (userCoins < episode.price) {
      toast.error(`Solde insuffisant. Il vous manque ${episode.price - userCoins} coins.`)
      return
    }
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
        setIsUnlockModalOpen(false)
        setPendingEpisode(null)
        setSelectedEpisode(episode)
        setIsPlayerOpen(true)
        await fetchUserCoins()
        await fetchPurchasedStatus()
      } else {
        toast.error(data.error || 'Erreur lors de l\'achat')
      }
    } catch (error) { handleError(error, 'handlePurchase') }
    finally { setIsPurchasing(false) }
  }

  const watchAdForEpisode = async (episode: Episode) => {
    if (!session) {
      toast.error('Connectez-vous pour débloquer avec une pub')
      router.push('/?auth=login')
      return
    }

    if (remainingAds <= 0) {
      toast.error(`Limite quotidienne atteinte (${maxAdsPerDay}/5 pubs). Réessayez demain.`)
      return
    }

    setWatchingAd(true)
    
    try {
      const toastId = toast.loading('📺 Publicité en cours... 5s', { duration: 5000 })
      await new Promise(resolve => setTimeout(resolve, 5000))
      toast.dismiss(toastId)
      
      const res = await fetch('/api/ad/rewarded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId: episode.id, rewardType: 'free_episode' })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(`🎉 Épisode ${episode.episodeNumber} débloqué !`)
        await fetchPurchasedStatus()
        await checkAdAvailability()
        setIsUnlockModalOpen(false)
        setPendingEpisode(null)
        setSelectedEpisode(episode)
        setIsPlayerOpen(true)
      } else {
        toast.error(data.error || 'Erreur lors du déblocage')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
      handleError(error, 'watchAdForEpisode')
    } finally {
      setWatchingAd(false)
    }
  }

  const handlePlay = (episode: Episode) => {
    if (canWatch(episode)) {
      setSelectedEpisode(episode)
      setIsPlayerOpen(true)
    } else {
      setPendingEpisode(episode)
      setIsUnlockModalOpen(true)
    }
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
          <p className="text-sm text-[#D4A855]/70 max-w-md">
            Cette série est en cours de préparation. Revenez bientôt pour découvrir les épisodes !
          </p>
          <button onClick={() => router.push('/')} className="mt-6 px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white rounded-xl font-bold">
            Retour à l'accueil
          </button>
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
                {series.coverImage ? (
                  <img src={series.coverImage} alt={series.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🎬</div>
                )}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-xl font-bold">{series.title}</h1>
                <p className="text-white/80 text-sm mt-1">{series.description}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3 text-sm">
                  <span>🎬 {series.totalEpisodes} épisodes</span>
                  <span>🆓 {series.freeEpisodes} gratuits</span>
                  <span>👁️ {(series.totalViews || 0).toLocaleString()} vues</span>
                  {session && (
                    <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                      🪙 {userCoins} coins
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
            {!session ? (
              <div className="bg-blue-500/10 rounded-xl p-3 mb-6 border border-blue-500/20">
                <p className="text-xs text-blue-400 font-bold">🔑 Connectez-vous pour regarder les épisodes gratuits</p>
              </div>
            ) : series.freeEpisodes > 0 ? (
              <div className="bg-green-500/10 rounded-xl p-3 mb-6 border border-green-500/20">
                <p className="text-xs text-green-400 font-bold">
                  🎁 {series.freeEpisodes} premier{series.freeEpisodes > 1 ? 's' : ''} épisode{series.freeEpisodes > 1 ? 's' : ''} gratuit{series.freeEpisodes > 1 ? 's' : ''} !
                </p>
              </div>
            ) : (
              <div className="bg-amber-500/10 rounded-xl p-3 mb-6 border border-amber-500/20">
                <p className="text-xs text-amber-400 font-bold">
                  ⚠️ Tous les épisodes sont payants. Achetez des coins ou regardez une pub.
                </p>
              </div>
            )}
            
            {session && remainingAds > 0 && (
              <div className="bg-purple-500/10 rounded-xl p-2 mb-4 border border-purple-500/20 text-center">
                <p className="text-xs text-purple-400 font-bold flex items-center justify-center gap-2">
                  <TvIcon className="w-3.5 h-3.5" />
                  📺 {remainingAds}/{maxAdsPerDay} pubs disponibles aujourd&apos;hui
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] flex items-center justify-center shadow-lg shadow-[#FF6B35]/20">
                  <PlayIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Épisodes</h2>
                  <p className="text-sm text-[#D4A855]/70 font-medium">
                    {series.totalEpisodes} épisodes
                    {series.totalEpisodes !== series.episodes.length && (
                      <span className="ml-2 text-xs text-green-400">(master masqué)</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {series.episodes.map((episode) => {
                const isAccessible = canWatch(episode)
                const isFree = episode.isFree
                
                return (
                  <div
                    key={episode.id}
                    onClick={() => handlePlay(episode)}
                    className={`relative cursor-pointer rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                      isAccessible 
                        ? 'bg-[#1A1A2E] border border-[#8B5A2B]/10' 
                        : 'bg-[#1A1A2E]/80 border border-[#8B5A2B]/5'
                    }`}
                  >
                    <div className="relative aspect-video bg-[#0D0D0D] flex items-center justify-center">
                      {episode.thumbnail ? (
                        <img src={episode.thumbnail} alt={episode.title} className="w-full h-full object-cover" />
                      ) : (
                        <PlayIcon className="w-8 h-8 text-[#8B5A2B]/30" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A00]/80 via-transparent to-transparent flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <PlayIcon className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute top-2 left-2 bg-[#FF6B35] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Ép. {episode.episodeNumber}
                      </div>
                      <div className="absolute top-2 right-2">
                        {isFree ? (
                          <span className="bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">GRATUIT</span>
                        ) : isAccessible ? (
                          <span className="bg-blue-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">DÉBLOQUÉ</span>
                        ) : (
                          <span className="bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <LockClosedIcon className="w-3 h-3" />
                            {episode.price} 🪙
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="font-semibold text-xs text-white line-clamp-1">{episode.title}</p>
                      <p className="text-[10px] text-[#D4A855]/50 mt-0.5">{formatDuration(episode.duration)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {selectedEpisode && (
              <div className="max-w-4xl mx-auto py-6 space-y-6">
                <div className="bg-[#1A1A2E] rounded-2xl border border-[#8B5A2B]/10 p-5">
                  <h3 className="text-base font-bold text-white mb-3">⭐ Notez cet épisode</h3>
                  <StarRating videoId={selectedEpisode.id} />
                </div>
                <div className="bg-[#1A1A2E] rounded-2xl border border-[#8B5A2B]/10 p-5">
                  <CommentSection videoId={selectedEpisode.id} />
                </div>
              </div>
            )}
            
            <Footer footerTabs={footerTabs} activeFooterTab={activeFooterTab} setActiveFooterTab={setActiveFooterTab} />
          </div>
        </div>
      ) : (
        /* LECTEUR PLEIN ÉCRAN AVEC SWIPE TIKTOK-LIKE */
        <div 
          className="fixed inset-0 bg-black z-[9999] overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Vidéo suivante (préchargée) - apparaît pendant le swipe */}
{nextEpisode && nextEpisode.url && (
  <video
    ref={nextVideoRef}
    src={nextEpisode.url}
    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
    style={{
      transform: `translateY(${100 + (Math.abs(swipeOffset) / window.innerHeight) * 100}%)`,
      opacity: Math.min(1, Math.abs(swipeOffset) / 200),
      transition: isSwiping ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out'
    }}
    preload="auto"
  />
)}

{/* Vidéo précédente (préchargée) - apparaît pendant le swipe vers le BAS */}
{prevEpisode && prevEpisode.url && (
  <video
    src={prevEpisode.url}
    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
    style={{
      transform: `translateY(${-100 - (Math.abs(swipeOffset) / window.innerHeight) * 100}%)`,
      opacity: Math.min(1, Math.abs(swipeOffset) / 200),
      transition: isSwiping ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out'
    }}
    preload="auto"
  />
)}

{/* Vidéo courante */}
<video 
  ref={videoRef} 
  autoPlay 
  className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
  key={selectedEpisode?.url} 
  playsInline
  style={{
    transform: `translateY(${swipeOffset}px)`,
    transition: isSwiping ? 'none' : 'transform 0.3s ease-out'
  }}
>
  {selectedEpisode?.url && <source src={selectedEpisode.url} type="video/mp4" />}
</video>
          
          {/* Indicateur de direction de swipe */}
          {swipingDirection && (
            <div className={`absolute left-1/2 transform -translate-x-1/2 z-50 transition-all duration-150 ${
              swipingDirection === 'up' ? 'top-20 animate-bounce' : 'bottom-20 animate-bounce'
            }`}>
              <div className="bg-white/20 backdrop-blur-md rounded-full p-3">
                {swipingDirection === 'up' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>
            </div>
          )}
          
          {/* Indicateur de pub forcée */}
          {forcedAdNeeded && (
            <div className="absolute top-20 left-0 right-0 text-center z-30">
              <div className="bg-purple-500/80 text-white text-xs px-4 py-2 rounded-full inline-flex items-center gap-2 backdrop-blur-sm">
                <div className="animate-pulse">📺</div>
                Publicité avant l&apos;épisode suivant...
                <div className="animate-spin h-3 w-3 border-2 border-white/30 border-t-white rounded-full"></div>
              </div>
            </div>
          )}
          
          {/* Boutons latéraux */}
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
            <button onClick={() => setShowEpisodeModal(true)} className="text-white bg-black/50 rounded-full p-2.5 hover:bg-black/70 transition w-10 h-10 flex items-center justify-center">
              <QueueListIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Overlay contrôles */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}>
            <button onClick={handleClosePlayer} className="absolute top-4 left-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition z-10">
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <div className="absolute top-4 left-20 text-white">
              <h2 className="font-semibold text-sm">{selectedEpisode?.title || 'Épisode'}</h2>
              <p className="text-xs text-[#D4A855]/70">Épisode {selectedEpisode?.episodeNumber}</p>
            </div>
            
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setShowQualityMenu(!showQualityMenu); setShowVolumeSlider(false) }} className="text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition">
                  <Cog6ToothIcon className="w-5 h-5" />
                </button>
                {showQualityMenu && (
                  <div className="absolute right-0 top-12 bg-[#1A1A2E] rounded-xl shadow-2xl border border-[#8B5A2B]/10 overflow-hidden z-30 min-w-[120px]">
                    {QUALITY_OPTIONS.map((q) => (
                      <button key={q.value} onClick={(e) => { e.stopPropagation(); handleQualityChange(q.value) }} className={`w-full px-4 py-2.5 text-xs font-semibold text-left hover:bg-white/[0.04] transition flex items-center justify-between ${
                        selectedQuality === q.value ? 'text-[#FF6B35]' : 'text-white'
                      }`}>
                        {q.label}{selectedQuality === q.value && <CheckCircleIcon className="w-3.5 h-3.5 text-[#FF6B35]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="relative flex items-center">
                <button onClick={(e) => { e.stopPropagation(); setShowVolumeSlider(!showVolumeSlider); setShowQualityMenu(false) }} className="text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition">
                  {isMuted || volume === 0 ? <SpeakerXMarkIcon className="w-5 h-5" /> : <SpeakerWaveIcon className="w-5 h-5" />}
                </button>
                {showVolumeSlider && (
                  <div className="absolute right-0 top-12 bg-[#1A1A2E] rounded-xl shadow-2xl border border-[#8B5A2B]/10 p-3 z-30 flex items-center gap-3">
                    <button onClick={(e) => { e.stopPropagation(); toggleMute() }} className="text-white hover:text-[#FF6B35] transition">
                      {isMuted || volume === 0 ? <SpeakerXMarkIcon className="w-4 h-4" /> : <SpeakerWaveIcon className="w-4 h-4" />}
                    </button>
                    <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} onClick={(e) => e.stopPropagation()} className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-[#FF6B35]" />
                    <span className="text-white text-xs font-bold w-8">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Indicateur swipe info */}
            <div className="absolute bottom-20 left-0 right-0 text-center z-20 pointer-events-none">
              <div className="inline-flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="text-[10px] text-white/70">⬆️ ⬇️ Swipe pour changer d'épisode</span>
              </div>
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center gap-6">
              <button onClick={goToPreviousEpisodeBtn} disabled={!hasPreviousEpisodeBtn()} className={`text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition ${
                !hasPreviousEpisodeBtn() ? 'opacity-30 cursor-not-allowed' : ''
              }`}>
                <ChevronDoubleLeftIcon className="w-6 h-6" />
              </button>
              <button onClick={togglePlayPause} className="text-white bg-black/50 rounded-full p-4 hover:bg-black/70 transition transform hover:scale-110">
                {isPlaying ? <PauseIcon className="w-10 h-10" /> : <PlayIcon className="w-10 h-10" />}
              </button>
              <button onClick={goToNextEpisodeBtn} disabled={!hasNextEpisodeBtn()} className={`text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition ${
                !hasNextEpisodeBtn() ? 'opacity-30 cursor-not-allowed' : ''
              }`}>
                <ChevronDoubleRightIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-3">
                <span className="text-white text-xs">
                  {Math.floor((videoRef.current?.currentTime || 0) / 60)}:{Math.floor((videoRef.current?.currentTime || 0) % 60).toString().padStart(2, '0')}
                </span>
                <input type="range" min="0" max={selectedEpisode?.duration || 100} value={videoRef.current?.currentTime || 0} onChange={(e) => { if (videoRef.current) videoRef.current.currentTime = parseFloat(e.target.value) }} className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-[#FF6B35]" />
                <span className="text-white text-xs">
                  {Math.floor((selectedEpisode?.duration || 0) / 60)}:{Math.floor((selectedEpisode?.duration || 0) % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showEpisodeModal && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000]" onClick={() => setShowEpisodeModal(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0D0D0D] to-[#1A1A2E] rounded-t-3xl z-[10001] animate-slideUp max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="sticky top-0 bg-[#0D0D0D]/98 backdrop-blur-xl p-4 border-b border-[#8B5A2B]/10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <QueueListIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-base">Épisodes de {series?.title}</h2>
                  <p className="text-[#D4A855]/50 text-[10px]">{series?.episodes.length} épisodes</p>
                </div>
              </div>
              <button onClick={() => setShowEpisodeModal(false)} className="w-8 h-8 bg-white/[0.04] hover:bg-white/[0.08] rounded-full flex items-center justify-center transition-all">
                <XMarkIcon className="w-4 h-4 text-white" />
              </button>
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
                        setTimeout(() => { 
                          if (videoRef.current) { 
                            videoRef.current.load()
                            videoRef.current.play()
                          }
                        }, 100)
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
                        <p className={`text-sm font-bold ${isCurrent ? 'text-white' : 'text-white/80'}`}>
                          {ep.episodeNumber}
                        </p>
                        {!isAccessible && (
                          <p className="text-[9px] font-semibold text-amber-400 mt-1">{ep.price} 🪙</p>
                        )}
                        {isAccessible && !isCurrent && (
                          <p className="text-[8px] text-green-400 mt-1">{ep.isFree ? 'Gratuit' : 'Débloqué'}</p>
                        )}
                        {isCurrent && (
                          <p className="text-[8px] text-white/80 mt-1">En cours</p>
                        )}
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
          onClose={() => {
            setIsUnlockModalOpen(false)
            setPendingEpisode(null)
          }}
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
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  )
}