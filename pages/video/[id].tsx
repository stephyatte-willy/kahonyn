"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState, useRef } from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import StarRating from '../../components/StarRating'
import CommentSection from '../../components/CommentSection'
import { 
  LockClosedIcon, PlayIcon, PauseIcon, ChevronLeftIcon, BookmarkIcon, HeartIcon,
  ShareIcon, ArrowDownTrayIcon, HomeIcon, UserGroupIcon, TrophyIcon, UserCircleIcon,
  SpeakerWaveIcon, SpeakerXMarkIcon, Cog6ToothIcon, CheckCircleIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

interface Video {
  id: string; title: string; description: string; url: string; thumbnail: string
  duration: number; price: number; views: number; purchases: number; status: string
  creator: { name: string; phone: string }
}

const QUALITY_OPTIONS = [
  { label: 'Auto', value: 'auto' }, { label: '1080p', value: '1080' },
  { label: '720p', value: '720' }, { label: '480p', value: '480' }, { label: '360p', value: '360' },
]

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
  const [canWatch, setCanWatch] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  const [userCoins, setUserCoins] = useState(0)
  const [freeDuration, setFreeDuration] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [isFreePreview, setIsFreePreview] = useState(false)
  const [requiredCoins, setRequiredCoins] = useState(0)
  const [isOwner, setIsOwner] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [selectedQuality, setSelectedQuality] = useState('auto')
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const [savedProgress, setSavedProgress] = useState(0)
  const [hasResumed, setHasResumed] = useState(false)

  const footerTabs = [
    { id: 'home', label: 'Accueil', icon: HomeIcon, href: '/' },
    { id: 'for-you', label: 'Pour vous', icon: UserGroupIcon, href: '/for-you' },
    { id: 'my-list', label: 'Ma liste', icon: BookmarkIcon, href: '/my-list' },
    { id: 'premium', label: 'Primes', icon: TrophyIcon, href: '/premium' },
    { id: 'profile', label: 'Profil', icon: UserCircleIcon, href: '/profile' },
  ]

  useEffect(() => { if (id) fetchVideo() }, [id])
  useEffect(() => { if (session && video) { checkPurchaseStatus(); fetchCounters() } }, [session, video])

  useEffect(() => {
    if (showControls && isPlayerOpen) { controlsTimeout.current = setTimeout(() => setShowControls(false), 3000) }
    return () => { if (controlsTimeout.current) clearTimeout(controlsTimeout.current) }
  }, [showControls, isPlayerOpen])

  useEffect(() => {
    const videoEl = videoRef.current; if (!videoEl || !isPlayerOpen) return
    const hP = () => setIsPlaying(true); const hPa = () => setIsPlaying(false)
    videoEl.addEventListener('play', hP); videoEl.addEventListener('pause', hPa)
    return () => { videoEl.removeEventListener('play', hP); videoEl.removeEventListener('pause', hPa) }
  }, [isPlayerOpen])

  useEffect(() => { if (videoRef.current) { videoRef.current.volume = volume; videoRef.current.muted = isMuted } }, [volume, isMuted])

  useEffect(() => {
    const videoEl = videoRef.current; if (!videoEl || !isPlayerOpen || !isFreePreview || isPurchased || isOwner) return
    const hTU = () => { if (videoEl.currentTime >= freeDuration && freeDuration > 0) { videoEl.pause(); toast.error(`⏰ Aperçu gratuit terminé. Achetez pour continuer (${requiredCoins} coins).`, { duration: 6000 }); videoEl.removeEventListener('timeupdate', hTU) } }
    videoEl.addEventListener('timeupdate', hTU); return () => videoEl.removeEventListener('timeupdate', hTU)
  }, [isPlayerOpen, isFreePreview, freeDuration, isPurchased, isOwner, requiredCoins])

  useEffect(() => {
    if (isPlayerOpen && videoRef.current && savedProgress > 0 && !hasResumed) {
      const t = setTimeout(() => { if (videoRef.current) { videoRef.current.currentTime = savedProgress; setHasResumed(true); toast.success(`⏪ Reprise à ${formatDuration(savedProgress)}`, { duration: 2000 }) } }, 500)
      return () => clearTimeout(t)
    }
  }, [isPlayerOpen, savedProgress, hasResumed])

  useEffect(() => {
    if (!isPlayerOpen || !videoRef.current || !session) return
    const si = setInterval(async () => { if (videoRef.current && video) { const ct = videoRef.current.currentTime; if (ct > 0) { try { await fetch('/api/user/save-progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ episodeId: video.id, currentTime: Math.floor(ct) }) }) } catch (e) {} } } }, 5000)
    return () => clearInterval(si)
  }, [isPlayerOpen, video, session])

  const fetchVideo = async () => {
    try {
      const res = await fetch(`/api/video/${id}`); if (!res.ok) throw new Error('Vidéo non trouvée')
      const data = await res.json(); setVideo(data); setCanWatch(data.canWatch); setAccessMessage(data.message || '')
      setUserCoins(data.userCoins || 0); setFreeDuration(data.freeDuration || 0); setTotalDuration(data.totalDuration || 0)
      setIsFreePreview(data.isFreePreview || false); setRequiredCoins(data.requiredCoins || data.price || 0)
      setIsOwner(data.isOwner || false); setIsPurchased(data.isPurchased || false); await fetchWatchHistory()
    } catch { toast.error('Impossible de charger la vidéo') } finally { setLoading(false) }
  }

  const fetchWatchHistory = async () => { if (!session || !id) return; try { const r = await fetch(`/api/user/watch-history?videoId=${id}`); const d = await r.json(); if (d?.length > 0) setSavedProgress(d[0].progress || 0) } catch (e) {} }

  const checkPurchaseStatus = async () => { if (!video) return; try { const r = await fetch(`/api/user/purchased-episodes?ids=${video.id}`); const d = await r.json(); const p = d.purchasedIds?.includes(video.id); setIsPurchased(p); if (p) setCanWatch(true) } catch (e) {} }

  const fetchCounters = async () => { if (!video) return; try { const r = await fetch(`/api/user/counters?episodeId=${video.id}`); if (r.ok) { const d = await r.json(); setIsLiked(d.userLiked || false); setIsSaved(d.userSaved || false) } } catch (e) {} }

  const handleLike = async () => { if (!session) { toast.error('Connectez-vous'); return }; if (!video) return; setIsLiked(!isLiked); try { const r = await fetch('/api/user/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ episodeId: video.id }) }); const d = await r.json(); if (r.ok) setIsLiked(d.liked); else setIsLiked(!isLiked) } catch { setIsLiked(!isLiked) } }

  const handleSave = async () => { if (!session) { toast.error('Connectez-vous'); return }; if (!video) return; setIsSaved(!isSaved); try { const r = await fetch('/api/user/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ episodeId: video.id }) }); const d = await r.json(); if (r.ok) setIsSaved(d.saved); else setIsSaved(!isSaved) } catch { setIsSaved(!isSaved) } }

  const handlePurchase = async () => { if (!session) { toast.error('Connectez-vous'); router.push('/?auth=login'); return }; if (!video) return; if (userCoins < requiredCoins) { toast.error(`Solde insuffisant.`); return }; setIsPurchasing(true); try { const r = await fetch('/api/purchase-episode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ episodeId: video.id }) }); const d = await r.json(); if (r.ok) { toast.success('Vidéo débloquée ! 🎉'); setIsPurchased(true); setCanWatch(true); setUserCoins(p => p - requiredCoins); if (isPlayerOpen && videoRef.current) videoRef.current.play() } else toast.error(d.error || 'Erreur') } catch { toast.error('Erreur de connexion') } finally { setIsPurchasing(false) } }

  const handleShare = async () => { try { await navigator.clipboard.writeText(window.location.href); toast.success('Lien copié !') } catch { toast.error('Impossible de copier') } }

  const toggleMute = () => setIsMuted(!isMuted)
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => { const v = parseFloat(e.target.value); setVolume(v); if (v === 0) setIsMuted(true); else if (isMuted) setIsMuted(false) }

  const handleQualityChange = (quality: string) => { setSelectedQuality(quality); setShowQualityMenu(false); if (videoRef.current && video) { const ct = videoRef.current.currentTime; const wp = !videoRef.current.paused; if (quality !== 'auto') { videoRef.current.src = `${video.url.split('?')[0]}?quality=${quality}`; videoRef.current.currentTime = ct; if (wp) videoRef.current.play() } } }

  const togglePlayPause = () => { if (videoRef.current) { videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause() }; setShowControls(true) }

  const handleClosePlayer = () => { if (videoRef.current && video && session) { fetch('/api/user/save-progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ episodeId: video.id, currentTime: Math.floor(videoRef.current.currentTime) }) }).catch(() => {}) }; setIsPlayerOpen(false); setHasResumed(false) }

  const formatDuration = (s: number) => { if (!s) return '0:00'; const m = Math.floor(s / 60); const sec = s % 60; return `${m}:${sec.toString().padStart(2, '0')}` }

  if (loading) return <div className="min-h-screen bg-[#0D0D0D]"><Navbar /><div className="flex items-center justify-center h-[80vh]"><div className="flex flex-col items-center gap-5"><div className="relative"><div className="w-20 h-20 rounded-2xl bg-white/[0.04] flex items-center justify-center p-3 animate-pulse border border-white/[0.06]"><img src="/logo-kahonyn.png" alt="Kahonyn" className="w-14 h-14 object-contain" /></div><div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FF6B35] animate-bounce"></div></div><p className="text-white/60 text-sm font-semibold">Chargement...</p></div></div></div>
  if (!video) return <div className="min-h-screen bg-[#0D0D0D]"><Navbar /><div className="flex items-center justify-center h-[80vh]"><p className="text-white/50">Vidéo non trouvée</p></div></div>

  if (isPlayerOpen) document.body.style.overflow = 'hidden'
  else document.body.style.overflow = 'auto'

  return (
    <>
      {!isPlayerOpen && <Navbar />}
      {!isPlayerOpen ? (
        <div className="min-h-screen bg-[#0D0D0D] pb-16">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button onClick={() => router.push('/')} className="inline-flex items-center gap-1 text-white/60 hover:text-[#FF6B35] transition"><ChevronLeftIcon className="w-5 h-5" />Retour</button>
          </div>
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-[#1A1A2E] rounded-2xl border border-white/[0.04] overflow-hidden">
              <div className="flex flex-col md:flex-row gap-6 p-6">
                <div className="w-full md:w-1/3 flex-shrink-0">
                  {video.thumbnail ? <img src={video.thumbnail} alt={video.title} className="w-full rounded-xl aspect-[3/4] object-cover" /> : <div className="w-full aspect-[3/4] bg-white/[0.04] rounded-xl flex items-center justify-center text-6xl">🎬</div>}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-white">{video.title}</h1>
                  <p className="text-white/50 mt-2">{video.description || 'Aucune description'}</p>
                  <div className="flex items-center gap-4 mt-4 text-sm text-white/40"><span>👁️ {(video.views || 0).toLocaleString()} vues</span><span>👤 {video.creator?.name || 'Créateur'}</span><span>⏱️ {formatDuration(video.duration)}</span></div>
                  {isFreePreview && !isPurchased && !isOwner && <div className="mt-4 bg-green-500/10 rounded-xl p-3 border border-green-500/20"><p className="text-xs text-green-400 font-semibold">🎬 Aperçu gratuit de {Math.floor(freeDuration / 60)}min disponible !</p></div>}
                  {savedProgress > 0 && <div className="mt-4 bg-blue-500/10 rounded-xl p-3 border border-blue-500/20"><p className="text-xs text-blue-400 font-semibold">⏪ Vous avez regardé {formatDuration(savedProgress)}</p></div>}
                  {session && <div className="mt-3 flex items-center gap-2 text-sm"><span className="text-white/50">Votre solde :</span><span className="font-bold text-[#FF6B35]">{userCoins} 🪙</span></div>}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button onClick={() => setIsPlayerOpen(true)} className="bg-[#FF6B35] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#FF8C5A] transition flex items-center gap-2"><PlayIcon className="w-5 h-5" />{isFreePreview && !isPurchased && !isOwner ? 'Aperçu gratuit' : 'Regarder'}</button>
                    {!isPurchased && !isOwner && video.price > 0 && <button onClick={handlePurchase} disabled={isPurchasing} className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 transition disabled:opacity-50">{isPurchasing ? 'Achat...' : `🪙 Acheter (${requiredCoins} coins)`}</button>}
                    {(isPurchased || isOwner) && <span className="bg-green-500/10 text-green-400 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2">✅ Débloqué</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            <div className="bg-[#1A1A2E] rounded-2xl border border-white/[0.04] p-5"><h3 className="text-base font-bold text-white mb-3">⭐ Notez cette vidéo</h3><StarRating videoId={video.id} /></div>
            <div className="bg-[#1A1A2E] rounded-2xl border border-white/[0.04] p-5"><CommentSection videoId={video.id} /></div>
          </div>
          <Footer footerTabs={footerTabs} activeFooterTab={activeFooterTab} setActiveFooterTab={setActiveFooterTab} />
        </div>
      ) : (
        <div className="fixed inset-0 bg-black z-50">
          <video ref={videoRef} autoPlay className="absolute inset-0 w-full h-full object-contain" key={video.url} playsInline onClick={() => setShowControls(!showControls)}><source src={video.url} type="video/mp4" /></video>
          <div className="absolute right-4 top-1/3 -translate-y-1/3 flex flex-col gap-3 z-20">
            <button onClick={handleLike} className="text-white bg-black/50 rounded-full p-2.5 hover:bg-black/70 transition w-10 h-10 flex items-center justify-center">{isLiked ? <HeartSolidIcon className="w-5 h-5 text-red-500" /> : <HeartIcon className="w-5 h-5" />}</button>
            <button onClick={handleSave} className="text-white bg-black/50 rounded-full p-2.5 hover:bg-black/70 transition w-10 h-10 flex items-center justify-center"><BookmarkIcon className={`w-5 h-5 ${isSaved ? 'fill-[#FF6B35] text-[#FF6B35]' : ''}`} /></button>
            <button onClick={handleShare} className="text-white bg-black/50 rounded-full p-2.5 hover:bg-black/70 transition w-10 h-10 flex items-center justify-center"><ShareIcon className="w-5 h-5" /></button>
          </div>
          <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button onClick={handleClosePlayer} className="absolute top-4 left-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition z-10"><ChevronLeftIcon className="w-6 h-6" /></button>
            <div className="absolute top-4 left-20 text-white"><h2 className="font-semibold text-sm">{video.title}</h2></div>
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setShowQualityMenu(!showQualityMenu); setShowVolumeSlider(false) }} className="text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition"><Cog6ToothIcon className="w-5 h-5" /></button>
                {showQualityMenu && <div className="absolute right-0 top-12 bg-[#1A1A2E] rounded-xl shadow-2xl border border-white/10 overflow-hidden z-30 min-w-[120px]">{QUALITY_OPTIONS.map(q => <button key={q.value} onClick={(e) => { e.stopPropagation(); handleQualityChange(q.value) }} className={`w-full px-4 py-2.5 text-xs font-bold text-left hover:bg-white/10 transition flex items-center justify-between ${selectedQuality === q.value ? 'text-[#FF6B35]' : 'text-white'}`}>{q.label}{selectedQuality === q.value && <CheckCircleIcon className="w-3.5 h-3.5 text-[#FF6B35]" />}</button>)}</div>}
              </div>
              <div className="relative flex items-center">
                <button onClick={(e) => { e.stopPropagation(); setShowVolumeSlider(!showVolumeSlider); setShowQualityMenu(false) }} className="text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition">{isMuted || volume === 0 ? <SpeakerXMarkIcon className="w-5 h-5" /> : volume < 0.5 ? <SpeakerWaveIcon className="w-5 h-5 opacity-70" /> : <SpeakerWaveIcon className="w-5 h-5" />}</button>
                {showVolumeSlider && <div className="absolute right-0 top-12 bg-[#1A1A2E] rounded-xl shadow-2xl border border-white/10 p-3 z-30 flex items-center gap-3"><button onClick={(e) => { e.stopPropagation(); toggleMute() }} className="text-white hover:text-[#FF6B35] transition">{isMuted || volume === 0 ? <SpeakerXMarkIcon className="w-4 h-4" /> : <SpeakerWaveIcon className="w-4 h-4" />}</button><input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} onClick={(e) => e.stopPropagation()} className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-[#FF6B35]" /><span className="text-white text-xs font-bold w-8">{Math.round((isMuted ? 0 : volume) * 100)}%</span></div>}
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center"><button onClick={togglePlayPause} className="text-white bg-black/50 rounded-full p-4 hover:bg-black/70 transition transform hover:scale-110">{isPlaying ? <PauseIcon className="w-10 h-10" /> : <PlayIcon className="w-10 h-10" />}</button></div>
            <div className="absolute bottom-0 left-0 right-0 p-4"><div className="flex items-center gap-3"><span className="text-white text-xs">{formatDuration(Math.floor(videoRef.current?.currentTime || 0))}</span><input type="range" min="0" max={video.duration || 100} value={videoRef.current?.currentTime || 0} onChange={(e) => { if (videoRef.current) videoRef.current.currentTime = parseFloat(e.target.value) }} className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#FF6B35]" /><span className="text-white text-xs">{formatDuration(video.duration || 0)}</span></div></div>
          </div>
          {isFreePreview && !isPurchased && !isOwner && freeDuration > 0 && <div className="absolute top-16 left-0 right-0 text-center z-20"><span className="bg-black/60 text-white text-xs px-3 py-1 rounded-full">🎬 Aperçu gratuit • {formatDuration(freeDuration)} / {formatDuration(totalDuration)}</span></div>}
          {isFreePreview && !isPurchased && !isOwner && videoRef.current && videoRef.current.currentTime >= freeDuration && freeDuration > 0 && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-30">
              <LockClosedIcon className="w-16 h-16 text-white/80 mb-4" /><h3 className="text-white text-xl font-bold mb-2">Aperçu terminé</h3><p className="text-white/70 text-sm mb-6 text-center px-4">La vidéo complète dure {formatDuration(totalDuration)}</p>
              {session ? <button onClick={handlePurchase} disabled={isPurchasing} className="bg-[#FF6B35] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#FF8C5A] transition disabled:opacity-50 text-lg">{isPurchasing ? 'Achat...' : `🪙 Acheter (${requiredCoins} coins)`}</button> : <button onClick={() => { setIsPlayerOpen(false); router.push('/?auth=login') }} className="bg-[#FF6B35] text-white px-8 py-3 rounded-xl font-bold text-lg">Se connecter pour acheter</button>}
              <button onClick={() => setIsPlayerOpen(false)} className="mt-4 text-white/60 text-sm hover:text-white transition">Retour</button>
            </div>
          )}
        </div>
      )}
    </>
  )
}