"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState, useRef } from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import StarRating from '../../components/StarRating'
import CommentSection from '../../components/CommentSection'
import { 
  LockClosedIcon, PlayIcon, PauseIcon, ChevronLeftIcon, CheckCircleIcon, XMarkIcon,
  BookmarkIcon, QueueListIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon,
  HeartIcon, ShareIcon, ArrowDownTrayIcon, HomeIcon, UserGroupIcon, TrophyIcon,
  UserCircleIcon, SpeakerWaveIcon, SpeakerXMarkIcon, Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

interface Episode {
  id: string; episodeNumber: number; title: string; description: string; url: string
  thumbnail: string; duration: number; price: number; views: number; purchases: number
  status?: string; isFree?: boolean
}

interface Series {
  id: string; title: string; description: string; coverImage: string
  creator: { name: string; phone: string }; totalEpisodes: number; freeEpisodes: number
  totalViews: number; totalPurchases: number; episodes: Episode[]; createdAt: string
}

const QUALITY_OPTIONS = [
  { label: 'Auto', value: 'auto' }, { label: '1080p', value: '1080' },
  { label: '720p', value: '720' }, { label: '480p', value: '480' }, { label: '360p', value: '360' },
]

export default function SeriesPage() {
  const router = useRouter(); const { id } = router.query; const { data: session } = useSession()
  const [series, setSeries] = useState<Series | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)
  const [purchasedEpisodes, setPurchasedEpisodes] = useState<Set<string>>(new Set())
  const [isPlayerOpen, setIsPlayerOpen] = useState(false); const [isPurchasing, setIsPurchasing] = useState(false)
  const [showControls, setShowControls] = useState(true); const [showEpisodeModal, setShowEpisodeModal] = useState(false)
  const [isSaved, setIsSaved] = useState(false); const [isLiked, setIsLiked] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false); const [activeFooterTab, setActiveFooterTab] = useState('')
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null); const videoRef = useRef<HTMLVideoElement>(null)
  const [userCoins, setUserCoins] = useState(0)
  const [volume, setVolume] = useState(1); const [isMuted, setIsMuted] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [selectedQuality, setSelectedQuality] = useState('auto'); const [showQualityMenu, setShowQualityMenu] = useState(false)
  const [savedProgress, setSavedProgress] = useState(0); const [hasResumed, setHasResumed] = useState(false)

  const footerTabs = [
    { id: 'home', label: 'Accueil', icon: HomeIcon, href: '/' }, { id: 'for-you', label: 'Pour vous', icon: UserGroupIcon, href: '/for-you' },
    { id: 'my-list', label: 'Ma liste', icon: BookmarkIcon, href: '/my-list' }, { id: 'premium', label: 'Primes', icon: TrophyIcon, href: '/premium' },
    { id: 'profile', label: 'Profil', icon: UserCircleIcon, href: '/profile' },
  ]

  useEffect(() => { if (id) fetchSeries() }, [id])
  useEffect(() => { if (session && series && series.episodes.length > 0) { fetchPurchasedStatus(); fetchUserCoins() } }, [session, series])
  useEffect(() => { if (selectedEpisode) { fetchCounters(); fetchWatchHistory(selectedEpisode.id); setHasResumed(false) } }, [selectedEpisode])
  useEffect(() => { if (showControls && isPlayerOpen) { if (controlsTimeout.current) clearTimeout(controlsTimeout.current); controlsTimeout.current = setTimeout(() => setShowControls(false), 3000) } return () => { if (controlsTimeout.current) clearTimeout(controlsTimeout.current) } }, [showControls, isPlayerOpen])
  useEffect(() => { if (videoRef.current) { videoRef.current.volume = volume; videoRef.current.muted = isMuted } }, [volume, isMuted])

  useEffect(() => {
    const video = videoRef.current; if (!video || !isPlayerOpen) return
    const handleVideoEnd = () => { setIsPlaying(false); if (selectedEpisode && series) { const currentIndex = series.episodes.findIndex(ep => ep.id === selectedEpisode.id); const nextEpisode = series.episodes[currentIndex + 1]; if (nextEpisode) { if (canWatch(nextEpisode)) { setSelectedEpisode(nextEpisode); setTimeout(() => { if (videoRef.current) { videoRef.current.load(); videoRef.current.play(); setIsPlaying(true) } }, 500) } else { toast.error(`🔒 Épisode ${nextEpisode.episodeNumber} nécessite ${nextEpisode.price} coins.`, { duration: 5000 }) } } } }
    const handlePlay = () => setIsPlaying(true); const handlePause = () => setIsPlaying(false)
    video.addEventListener('ended', handleVideoEnd); video.addEventListener('play', handlePlay); video.addEventListener('pause', handlePause)
    return () => { video.removeEventListener('ended', handleVideoEnd); video.removeEventListener('play', handlePlay); video.removeEventListener('pause', handlePause) }
  }, [selectedEpisode, series, isPlayerOpen])

  useEffect(() => { if (isPlayerOpen && videoRef.current && savedProgress > 0 && !hasResumed) { const timer = setTimeout(() => { if (videoRef.current) { videoRef.current.currentTime = savedProgress; setHasResumed(true); toast.success(`⏪ Reprise à ${formatDuration(savedProgress)}`, { duration: 2000 }) } }, 500); return () => clearTimeout(timer) } }, [isPlayerOpen, savedProgress, hasResumed])

  useEffect(() => { if (!isPlayerOpen || !videoRef.current || !session || !selectedEpisode) return; const saveInterval = setInterval(async () => { if (videoRef.current) { const currentTime = videoRef.current.currentTime; if (currentTime > 0) { try { await fetch('/api/user/save-progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ episodeId: selectedEpisode.id, currentTime: Math.floor(currentTime), seriesId: series?.id }) }) } catch (error) {} } } }, 5000); return () => clearInterval(saveInterval) }, [isPlayerOpen, selectedEpisode, session, series])

  const fetchUserCoins = async () => { if (!session) return; try { const res = await fetch('/api/user/profile'); if (res.ok) { const data = await res.json(); setUserCoins(data.coins || 0) } } catch (error) {} }
  const fetchCounters = async () => { if (!selectedEpisode) return; try { const res = await fetch(`/api/user/counters?episodeId=${selectedEpisode.id}`); if (res.ok) { const data = await res.json(); setIsLiked(data.userLiked || false); setIsSaved(data.userSaved || false) } } catch (error) {} }
  const fetchWatchHistory = async (episodeId: string) => { if (!session) return; try { const res = await fetch(`/api/user/watch-history?videoId=${episodeId}`); const data = await res.json(); if (data && data.length > 0) setSavedProgress(data[0].progress || 0); else setSavedProgress(0) } catch (error) {} }

  const handleLike = async () => { if (!session) { toast.error('Connectez-vous pour aimer'); return }; if (!selectedEpisode) return; setIsLiked(!isLiked); try { const res = await fetch('/api/user/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ episodeId: selectedEpisode.id }) }); const data = await res.json(); if (res.ok) setIsLiked(data.liked); else setIsLiked(!isLiked) } catch { setIsLiked(!isLiked) } }
  const handleSave = async () => { if (!session) { toast.error('Connectez-vous pour sauvegarder'); return }; if (!selectedEpisode) return; setIsSaved(!isSaved); try { const res = await fetch('/api/user/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ episodeId: selectedEpisode.id }) }); const data = await res.json(); if (res.ok) setIsSaved(data.saved); else setIsSaved(!isSaved) } catch { setIsSaved(!isSaved) } }

  const goToPreviousEpisode = () => { if (!selectedEpisode || !series) return; const currentIndex = series.episodes.findIndex(ep => ep.id === selectedEpisode.id); const prevEpisode = series.episodes[currentIndex - 1]; if (prevEpisode && canWatch(prevEpisode)) setSelectedEpisode(prevEpisode) }
  const goToNextEpisode = () => { if (!selectedEpisode || !series) return; const currentIndex = series.episodes.findIndex(ep => ep.id === selectedEpisode.id); const nextEpisode = series.episodes[currentIndex + 1]; if (nextEpisode && canWatch(nextEpisode)) setSelectedEpisode(nextEpisode) }
  const hasNextEpisode = () => { if (!selectedEpisode || !series) return false; const currentIndex = series.episodes.findIndex(ep => ep.id === selectedEpisode.id); const nextEpisode = series.episodes[currentIndex + 1]; return !!(nextEpisode && canWatch(nextEpisode)) }
  const hasPreviousEpisode = () => { if (!selectedEpisode || !series) return false; const currentIndex = series.episodes.findIndex(ep => ep.id === selectedEpisode.id); const prevEpisode = series.episodes[currentIndex - 1]; return !!(prevEpisode && canWatch(prevEpisode)) }

  const fetchSeries = async () => { setLoading(true); try { const res = await fetch(`/api/public/series/${id}`); if (!res.ok) throw new Error(`Erreur ${res.status}`); const data = await res.json(); if (!data || !data.id) throw new Error('Données invalides'); const episodes = Array.isArray(data.episodes) ? data.episodes : []; const formattedEpisodes = episodes.map((ep: any, index: number) => ({ id: ep.id || `ep-${index}`, episodeNumber: ep.episodeNumber || index + 1, title: ep.title || `Épisode ${index + 1}`, description: ep.description || '', url: ep.url || '', thumbnail: ep.thumbnail || '', duration: ep.duration || 0, price: ep.price || 0, views: ep.views || 0, purchases: ep.purchases || 0, status: ep.status || 'approved', isFree: ep.isFree || false })); setSeries({ id: data.id, title: data.title || 'Sans titre', description: data.description || '', coverImage: data.coverImage || '', creator: data.creator || { name: 'Créateur', phone: '' }, totalEpisodes: data.totalEpisodes || formattedEpisodes.length, freeEpisodes: data.freeEpisodes || 0, totalViews: data.totalViews || 0, totalPurchases: data.totalPurchases || 0, episodes: formattedEpisodes, createdAt: data.createdAt || new Date().toISOString() }); if (formattedEpisodes.length > 0) setSelectedEpisode(formattedEpisodes[0]) } catch (error) { toast.error('Impossible de charger la série') } finally { setLoading(false) } }
  const fetchPurchasedStatus = async () => { if (!series?.episodes.length || !session) return; try { const episodeIds = series.episodes.map(ep => ep.id).join(','); const res = await fetch(`/api/user/purchased-episodes?ids=${episodeIds}`); if (res.ok) { const data = await res.json(); setPurchasedEpisodes(new Set(data.purchasedIds || [])) } } catch (error) {} }

  const handlePurchase = async (episode: Episode) => { if (!session) { toast.error('Connectez-vous pour acheter'); return }; if (userCoins < episode.price) { toast.error(`Solde insuffisant. Vous avez ${userCoins} coins.`); return }; setIsPurchasing(true); try { const res = await fetch('/api/purchase-episode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ episodeId: episode.id }) }); const data = await res.json(); if (res.ok) { toast.success(`Épisode ${episode.episodeNumber} débloqué !`); setPurchasedEpisodes(prev => new Set([...prev, episode.id])); setUserCoins(prev => prev - episode.price); setSelectedEpisode(episode); setIsPlayerOpen(true) } else { toast.error(data.error || 'Erreur') } } catch { toast.error('Erreur de connexion') } finally { setIsPurchasing(false) } }

  const handlePlay = (episode: Episode) => { if (!canWatch(episode)) { handlePurchase(episode); return }; setSelectedEpisode(episode); setIsPlayerOpen(true) }
  const canWatch = (episode: Episode): boolean => { if ((session?.user as any)?.role === 'admin') return true; if (purchasedEpisodes.has(episode.id)) return true; if (episode.isFree) return true; return false }
  const formatDuration = (seconds: number) => { if (!seconds) return '0:00'; const mins = Math.floor(seconds / 60); const secs = seconds % 60; return `${mins}:${secs.toString().padStart(2, '0')}` }
  const handleShare = async () => { try { await navigator.clipboard.writeText(window.location.href); toast.success('Lien copié !') } catch { toast.error('Impossible de copier le lien') } }
  const handleDownload = () => { toast.success('Fonctionnalité VIP - Bientôt disponible') }

  const toggleMute = () => setIsMuted(!isMuted)
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => { const newVolume = parseFloat(e.target.value); setVolume(newVolume); if (newVolume === 0) setIsMuted(true); else if (isMuted) setIsMuted(false) }
  const handleQualityChange = (quality: string) => { setSelectedQuality(quality); setShowQualityMenu(false); if (videoRef.current && selectedEpisode) { const currentTime = videoRef.current.currentTime; const wasPlaying = !videoRef.current.paused; if (quality !== 'auto') { const baseUrl = selectedEpisode.url.split('?')[0]; videoRef.current.src = `${baseUrl}?quality=${quality}`; videoRef.current.currentTime = currentTime; if (wasPlaying) videoRef.current.play() } } }
  const togglePlayPause = () => { if (videoRef.current) { videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause() }; setShowControls(true) }
  const handleClosePlayer = () => { if (videoRef.current && selectedEpisode && session) { fetch('/api/user/save-progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ episodeId: selectedEpisode.id, currentTime: Math.floor(videoRef.current.currentTime), seriesId: series?.id }) }).catch(() => {}) }; setIsPlayerOpen(false); setHasResumed(false) }

  if (loading) return <div className="min-h-screen bg-[#0D0D0D]"><Navbar /><div className="flex items-center justify-center h-[80vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div></div></div>
  if (!series) return <div className="min-h-screen bg-[#0D0D0D]"><Navbar /><div className="flex items-center justify-center h-[80vh]"><p className="text-white/60">Série non trouvée</p></div></div>

  if (isPlayerOpen) document.body.style.overflow = 'hidden'; else document.body.style.overflow = 'auto'

  return (
    <>
      {!isPlayerOpen && <Navbar />}
      {!isPlayerOpen ? (
        <div className="min-h-screen bg-[#0D0D0D] pb-16">
          <div className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white">
            <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
              <div className="w-24 h-16 rounded-xl overflow-hidden shadow-xl flex-shrink-0 bg-white/20">{series.coverImage ? <img src={series.coverImage} alt={series.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">🎬</div>}</div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-xl font-bold">{series.title}</h1><p className="text-white/80 text-sm mt-1">{series.description}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3 text-sm"><span>🎬 {series.totalEpisodes} épisodes</span><span>🆓 {series.freeEpisodes} gratuits</span><span>👁️ {(series.totalViews || 0).toLocaleString()} vues</span>{session && <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">🪙 {userCoins} coins</span>}</div>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 py-8">
            {!session ? <div className="bg-blue-500/10 rounded-xl p-3 mb-6 border border-blue-500/20"><p className="text-xs text-blue-400 font-bold">🔑 Connectez-vous pour regarder les épisodes gratuits</p></div>
            : series.freeEpisodes > 0 ? <div className="bg-green-500/10 rounded-xl p-3 mb-6 border border-green-500/20"><p className="text-xs text-green-400 font-bold">🎁 {series.freeEpisodes} premier{series.freeEpisodes > 1 ? 's' : ''} épisode{series.freeEpisodes > 1 ? 's' : ''} gratuit{series.freeEpisodes > 1 ? 's' : ''} !</p></div>
            : <div className="bg-amber-500/10 rounded-xl p-3 mb-6 border border-amber-500/20"><p className="text-xs text-amber-400 font-bold">⚠️ Tous les épisodes sont payants. Achetez des coins pour continuer.</p></div>}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] flex items-center justify-center shadow-lg"><PlayIcon className="w-4 h-4 text-white" /></div><div><h2 className="text-base font-bold text-white">Épisodes</h2><p className="text-sm text-white/50 font-medium">{series.totalEpisodes} épisodes</p></div></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {series.episodes.map((episode, index) => { const isAccessible = canWatch(episode); const isFree = episode.isFree; return (
                <div key={episode.id} onClick={() => handlePlay(episode)} className={`relative cursor-pointer rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${isAccessible ? 'bg-[#1A1A2E] border border-white/[0.06]' : 'bg-[#1A1A2E]/80 border border-white/[0.03]'}`}>
                  <div className="relative aspect-video bg-[#0D0D0D] flex items-center justify-center">
                    {episode.thumbnail ? <img src={episode.thumbnail} alt={episode.title} className="w-full h-full object-cover" /> : <PlayIcon className="w-8 h-8 text-white/20" />}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><PlayIcon className="w-10 h-10 text-white" /></div>
                    <div className="absolute top-2 left-2 bg-[#FF6B35] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Ép. {episode.episodeNumber}</div>
                    <div className="absolute top-2 right-2">{isFree ? <span className="bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">GRATUIT</span> : isAccessible ? <span className="bg-blue-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">DÉBLOQUÉ</span> : <span className="bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><LockClosedIcon className="w-3 h-3" />{episode.price} 🪙</span>}</div>
                  </div>
                  <div className="p-2"><p className="font-semibold text-xs text-white line-clamp-1">{episode.title}</p><p className="text-[10px] text-white/40 mt-0.5">{formatDuration(episode.duration)}</p></div>
                </div>
              )})}
            </div>
            {selectedEpisode && <div className="max-w-4xl mx-auto py-6 space-y-6"><div className="bg-[#1A1A2E] rounded-2xl border border-white/[0.04] p-5"><h3 className="text-base font-bold text-white mb-3">⭐ Notez cet épisode</h3><StarRating videoId={selectedEpisode.id} /></div><div className="bg-[#1A1A2E] rounded-2xl border border-white/[0.04] p-5"><CommentSection videoId={selectedEpisode.id} /></div></div>}
            <Footer footerTabs={footerTabs} activeFooterTab={activeFooterTab} setActiveFooterTab={setActiveFooterTab} />
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 bg-black z-50">
          <video ref={videoRef} autoPlay className="absolute inset-0 w-full h-full object-contain" key={selectedEpisode?.url} playsInline onClick={() => setShowControls(!showControls)}>{selectedEpisode?.url && <source src={selectedEpisode.url} type="video/mp4" />}</video>
          <div className="absolute right-4 top-1/3 -translate-y-1/3 flex flex-col gap-3 z-20">
            <button onClick={handleLike} className="text-white bg-black/50 rounded-full p-2.5 hover:bg-black/70 transition w-10 h-10 flex items-center justify-center">{isLiked ? <HeartSolidIcon className="w-5 h-5 text-red-500" /> : <HeartIcon className="w-5 h-5" />}</button>
            <button onClick={handleSave} className="text-white bg-black/50 rounded-full p-2.5 hover:bg-black/70 transition w-10 h-10 flex items-center justify-center"><BookmarkIcon className={`w-5 h-5 ${isSaved ? 'fill-[#FF6B35] text-[#FF6B35]' : ''}`} /></button>
            <button onClick={handleShare} className="text-white bg-black/50 rounded-full p-2.5 hover:bg-black/70 transition w-10 h-10 flex items-center justify-center"><ShareIcon className="w-5 h-5" /></button>
            <button onClick={() => setShowEpisodeModal(true)} className="text-white bg-black/50 rounded-full p-2.5 hover:bg-black/70 transition w-10 h-10 flex items-center justify-center"><QueueListIcon className="w-5 h-5" /></button>
          </div>
          <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button onClick={handleClosePlayer} className="absolute top-4 left-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition z-10"><ChevronLeftIcon className="w-6 h-6" /></button>
            <div className="absolute top-4 left-20 text-white"><h2 className="font-semibold text-sm">{selectedEpisode?.title || 'Épisode'}</h2><p className="text-xs text-white/60">Épisode {selectedEpisode?.episodeNumber}</p></div>
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <div className="relative"><button onClick={(e) => { e.stopPropagation(); setShowQualityMenu(!showQualityMenu); setShowVolumeSlider(false) }} className="text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition"><Cog6ToothIcon className="w-5 h-5" /></button>
                {showQualityMenu && <div className="absolute right-0 top-12 bg-[#1A1A2E] rounded-xl shadow-2xl border border-white/[0.06] overflow-hidden z-30 min-w-[120px]">{QUALITY_OPTIONS.map((q) => <button key={q.value} onClick={(e) => { e.stopPropagation(); handleQualityChange(q.value) }} className={`w-full px-4 py-2.5 text-xs font-semibold text-left hover:bg-white/[0.04] transition flex items-center justify-between ${selectedQuality === q.value ? 'text-[#FF6B35]' : 'text-white'}`}>{q.label}{selectedQuality === q.value && <CheckCircleIcon className="w-3.5 h-3.5 text-[#FF6B35]" />}</button>)}</div>}
              </div>
              <div className="relative flex items-center"><button onClick={(e) => { e.stopPropagation(); setShowVolumeSlider(!showVolumeSlider); setShowQualityMenu(false) }} className="text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition">{isMuted || volume === 0 ? <SpeakerXMarkIcon className="w-5 h-5" /> : volume < 0.5 ? <SpeakerWaveIcon className="w-5 h-5 opacity-70" /> : <SpeakerWaveIcon className="w-5 h-5" />}</button>
                {showVolumeSlider && <div className="absolute right-0 top-12 bg-[#1A1A2E] rounded-xl shadow-2xl border border-white/[0.06] p-3 z-30 flex items-center gap-3"><button onClick={(e) => { e.stopPropagation(); toggleMute() }} className="text-white hover:text-[#FF6B35] transition">{isMuted || volume === 0 ? <SpeakerXMarkIcon className="w-4 h-4" /> : <SpeakerWaveIcon className="w-4 h-4" />}</button><input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} onClick={(e) => e.stopPropagation()} className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-[#FF6B35]" /><span className="text-white text-xs font-bold w-8">{Math.round((isMuted ? 0 : volume) * 100)}%</span></div>}
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center gap-6">
              <button onClick={goToPreviousEpisode} disabled={!hasPreviousEpisode()} className={`text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition ${!hasPreviousEpisode() ? 'opacity-30 cursor-not-allowed' : ''}`}><ChevronDoubleLeftIcon className="w-6 h-6" /></button>
              <button onClick={togglePlayPause} className="text-white bg-black/50 rounded-full p-4 hover:bg-black/70 transition transform hover:scale-110">{isPlaying ? <PauseIcon className="w-10 h-10" /> : <PlayIcon className="w-10 h-10" />}</button>
              <button onClick={goToNextEpisode} disabled={!hasNextEpisode()} className={`text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition ${!hasNextEpisode() ? 'opacity-30 cursor-not-allowed' : ''}`}><ChevronDoubleRightIcon className="w-6 h-6" /></button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-3">
                <span className="text-white text-xs">{Math.floor((videoRef.current?.currentTime || 0) / 60)}:{Math.floor((videoRef.current?.currentTime || 0) % 60).toString().padStart(2, '0')}</span>
                <input type="range" min="0" max={selectedEpisode?.duration || 100} value={videoRef.current?.currentTime || 0} onChange={(e) => { if (videoRef.current) videoRef.current.currentTime = parseFloat(e.target.value) }} className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-[#FF6B35]" />
                <span className="text-white text-xs">{Math.floor((selectedEpisode?.duration || 0) / 60)}:{Math.floor((selectedEpisode?.duration || 0) % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>
            {selectedEpisode && series && (() => { const currentIndex = series.episodes.findIndex(ep => ep.id === selectedEpisode.id); const nextEpisode = series.episodes[currentIndex + 1]; if (nextEpisode) { return canWatch(nextEpisode) ? <div className="absolute bottom-16 left-0 right-0 text-center text-white/50 text-xs">⏭️ Lecture auto : Épisode {nextEpisode.episodeNumber}</div> : <div className="absolute bottom-16 left-0 right-0 text-center text-amber-400 text-xs">🔒 Épisode {nextEpisode.episodeNumber} : {nextEpisode.price} coins</div> } return null })()}
          </div>
        </div>
      )}
      {showEpisodeModal && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setShowEpisodeModal(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0D0D0D] to-[#1A1A2E] rounded-t-3xl z-50 animate-slideUp max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="sticky top-0 bg-[#0D0D0D]/98 backdrop-blur-xl p-4 border-b border-white/[0.04] flex justify-between items-center">
              <div className="flex items-center gap-3"><div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg"><QueueListIcon className="w-4 h-4 text-white" /></div><div><h2 className="text-white font-bold text-base">Épisodes de {series?.title}</h2><p className="text-white/40 text-[10px]">{series?.episodes.length} épisodes</p></div></div>
              <button onClick={() => setShowEpisodeModal(false)} className="w-8 h-8 bg-white/[0.04] hover:bg-white/[0.08] rounded-full flex items-center justify-center transition-all"><XMarkIcon className="w-4 h-4 text-white" /></button>
            </div>
            <div className="overflow-y-auto max-h-[70vh] p-4"><div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
              {series?.episodes.map((ep) => { const isAccessible = canWatch(ep); const isCurrent = selectedEpisode?.id === ep.id; return (
                <div key={ep.id} onClick={() => { if (isAccessible) { setSelectedEpisode(ep); setShowEpisodeModal(false); setTimeout(() => { if (videoRef.current) { videoRef.current.load(); videoRef.current.play() } }, 100) } else { handlePurchase(ep) } }} className={`group relative cursor-pointer rounded-xl transition-all duration-300 ${isCurrent ? 'bg-gradient-to-br from-[#FF6B35] to-orange-600 shadow-lg scale-105 ring-2 ring-orange-400' : isAccessible ? 'bg-green-500/10 hover:bg-green-500/20' : 'bg-white/[0.03] hover:bg-white/[0.06]'}`}>
                  <div className="aspect-square flex flex-col items-center justify-center p-2"><div className={`text-2xl mb-1 transition-all ${isCurrent ? 'animate-bounce' : ''}`}>{isCurrent ? '▶️' : isAccessible ? (ep.isFree ? '🆓' : '✅') : '🔒'}</div><p className={`text-sm font-bold ${isCurrent ? 'text-white' : 'text-white/80'}`}>{ep.episodeNumber}</p>{!isAccessible && <p className="text-[9px] font-semibold text-amber-400 mt-1">{ep.price} 🪙</p>}{isAccessible && !isCurrent && <p className="text-[8px] text-green-400 mt-1">{ep.isFree ? 'Gratuit' : 'Débloqué'}</p>}{isCurrent && <p className="text-[8px] text-white/80 mt-1">En cours</p>}</div>
                </div>
              )})}
            </div></div>
          </div>
        </>
      )}
      <style jsx global>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } } .animate-slideUp { animation: slideUp 0.3s ease-out; }`}</style>
    </>
  )
}