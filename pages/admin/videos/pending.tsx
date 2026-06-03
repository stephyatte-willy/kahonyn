"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState, useRef } from 'react'
import AdminLayout from '../layout'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  EyeIcon, 
  PlayIcon, 
  XMarkIcon,
  ExclamationTriangleIcon,
  FilmIcon,
  CurrencyDollarIcon,
  ClockIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import toast, { Toaster } from 'react-hot-toast'

interface Video {
  id: string
  title: string
  description: string
  thumbnail: string
  url: string
  duration: number
  price: number
  category: string
  status: string
  creator: { name: string; phone: string; email: string }
  createdAt: string
}

const categoriesList = [
  { id: 'popular', label: '🔥 Populaires' },
  { id: 'anime', label: '🎌 Animé' },
  { id: 'unpublished', label: '✨ Inédit' },
  { id: 'ranking', label: '🏆 Classement' },
  { id: 'dubbed', label: '🎤 Doublés' },
  { id: 'vip', label: '👑 VIP' },
  { id: 'women', label: '👩 Femmes' },
  { id: 'men', label: '👨 Hommes' },
]

export default function PendingVideos() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isApproveSimpleModalOpen, setIsApproveSimpleModalOpen] = useState(false)
  const [isCutModalOpen, setIsCutModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [episodeDuration, setEpisodeDuration] = useState(30)
  const [pricePerEpisode, setPricePerEpisode] = useState(100)
  const [simpleVideoPrice, setSimpleVideoPrice] = useState(100)
  const [simpleVideoCategories, setSimpleVideoCategories] = useState<string[]>(['popular'])
  const [seriesCategories, setSeriesCategories] = useState<string[]>(['popular'])
  const [rejectReason, setRejectReason] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)

  // Initialiser les catégories quand on ouvre les modales
  useEffect(() => {
    if (isApproveSimpleModalOpen && selectedVideo) {
      setSimpleVideoPrice(selectedVideo.price || 100)
      // Convertir la catégorie existante en tableau
      const existingCats = selectedVideo.category 
        ? selectedVideo.category.split(',').filter(Boolean) 
        : ['popular']
      setSimpleVideoCategories(existingCats.length > 0 ? existingCats : ['popular'])
    }
  }, [isApproveSimpleModalOpen, selectedVideo])

  useEffect(() => {
    if (isCutModalOpen && selectedVideo) {
      setEpisodeDuration(30)
      setPricePerEpisode(100)
      const existingCats = selectedVideo.category 
        ? selectedVideo.category.split(',').filter(Boolean) 
        : ['popular']
      setSeriesCategories(existingCats.length > 0 ? existingCats : ['popular'])
    }
  }, [isCutModalOpen, selectedVideo])

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (session?.user?.role !== 'admin') {
      router.push('/')
      return
    }
    fetchPendingVideos()
  }, [session, sessionStatus, router])

  const fetchPendingVideos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pending-videos')
      const data = await res.json()
      setVideos(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Impossible de charger les vidéos')
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  // Toggle une catégorie
  const toggleCategory = (catId: string, currentCategories: string[], setCategories: (cats: string[]) => void) => {
    if (currentCategories.includes(catId)) {
      if (currentCategories.length > 1) {
        setCategories(currentCategories.filter(c => c !== catId))
      }
    } else {
      setCategories([...currentCategories, catId])
    }
  }

  const handleViewVideo = (video: Video) => {
    setSelectedVideo(video)
    setIsViewModalOpen(true)
  }

  const handleApproveSimpleClick = (video: Video) => {
    setSelectedVideo(video)
    setIsApproveSimpleModalOpen(true)
  }

  const confirmApproveSimple = async () => {
    if (!selectedVideo) return
    setProcessingId(selectedVideo.id)
    try {
      const res = await fetch('/api/admin/approve-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoId: selectedVideo.id, 
          price: simpleVideoPrice,
          categories: simpleVideoCategories
        })
      })
      if (res.ok) {
        toast.success('Vidéo approuvée avec succès !')
        fetchPendingVideos()
        setIsApproveSimpleModalOpen(false)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur lors de l\'approbation')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    } finally {
      setProcessingId(null)
    }
  }

  const handleCutSeriesClick = (video: Video) => {
    setSelectedVideo(video)
    setIsCutModalOpen(true)
  }

  const confirmCutSeries = async () => {
    if (!selectedVideo) return
    setProcessingId(selectedVideo.id)
    try {
      const res = await fetch('/api/admin/split-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: selectedVideo.id,
          episodeDuration,
          pricePerEpisode,
          categories: seriesCategories
        })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast.success(`Film découpé avec succès ! ${data.totalEpisodes} épisodes créés.`)
        fetchPendingVideos()
        setIsCutModalOpen(false)
      } else {
        toast.error(data.error || 'Erreur lors du découpage')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectClick = (video: Video) => {
    setSelectedVideo(video)
    setRejectReason('')
    setIsRejectModalOpen(true)
  }

  const confirmReject = async () => {
    if (!selectedVideo) return
    if (!rejectReason.trim()) {
      toast.error('Veuillez indiquer un motif de rejet')
      return
    }
    setProcessingId(selectedVideo.id)
    try {
      const res = await fetch('/api/admin/reject-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: selectedVideo.id, reason: rejectReason })
      })
      if (res.ok) {
        toast.success('Vidéo rejetée')
        fetchPendingVideos()
        setIsRejectModalOpen(false)
      } else {
        toast.error('Erreur lors du rejet')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    } finally {
      setProcessingId(null)
    }
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0min 0s'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}min ${secs}s`
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (sessionStatus === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </AdminLayout>
    )
  }

  if (!session || session.user?.role !== 'admin') {
    return null
  }

  return (
    <AdminLayout>
      <Toaster position="top-center" toastOptions={{
        style: { background: '#1A1A35', color: '#FFF', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold', fontSize: '14px' },
        success: { iconTheme: { primary: '#22C55E', secondary: '#1A1A35' }, duration: 2000 },
        error: { iconTheme: { primary: '#EF4444', secondary: '#1A1A35' }, duration: 2500 },
      }} />

      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Vidéos en attente</h1>
            <p className="text-gray-500 text-sm mt-1">
              🎬 Vidéo courte → Approuver avec prix et catégories<br />
              🎞️ Film complet → Découper en épisodes
            </p>
          </div>
          <div className="bg-yellow-100 rounded-full px-4 py-2">
            <span className="text-yellow-700 font-semibold">{videos.length} en attente</span>
          </div>
        </div>

        {/* Liste des vidéos */}
        {videos.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune vidéo en attente</h3>
            <p className="text-gray-500">Toutes les vidéos ont été traitées</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div key={video.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="relative h-40 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center cursor-pointer group" onClick={() => handleViewVideo(video)}>
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">🎬</span>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <PlayIcon className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration)}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 line-clamp-1">{video.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">👤 {video.creator?.name || video.creator?.phone}</p>
                  <p className="text-xs text-gray-400 mt-1">📅 {formatDate(video.createdAt)}</p>
                  
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleApproveSimpleClick(video)}
                      disabled={processingId === video.id}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition disabled:opacity-50"
                    >
                      {processingId === video.id ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
                      ) : (
                        <CheckCircleIcon className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">{processingId === video.id ? '...' : 'Simple'}</span>
                    </button>
                    <button
                      onClick={() => handleCutSeriesClick(video)}
                      disabled={processingId === video.id}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition disabled:opacity-50"
                    >
                      {processingId === video.id ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
                      ) : (
                        <FilmIcon className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">{processingId === video.id ? '...' : 'Découper'}</span>
                    </button>
                    <button
                      onClick={() => handleRejectClick(video)}
                      disabled={processingId === video.id}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition disabled:opacity-50"
                    >
                      {processingId === video.id ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
                      ) : (
                        <XCircleIcon className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">{processingId === video.id ? '...' : 'Rejeter'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODALE VISIONNAGE */}
      {/* ============================================================ */}
      {isViewModalOpen && selectedVideo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800">{selectedVideo.title}</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <video ref={videoRef} controls autoPlay className="w-full rounded-lg" style={{ maxHeight: '60vh' }}>
                <source src={selectedVideo.url} type="video/mp4" />
              </video>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-500">Durée</p><p className="font-medium">{formatDuration(selectedVideo.duration)}</p></div>
                <div><p className="text-gray-500">Créateur</p><p className="font-medium">{selectedVideo.creator?.name || selectedVideo.creator?.phone}</p></div>
              </div>
              {selectedVideo.description && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-sm">{selectedVideo.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALE APPROBATION VIDÉO SIMPLE */}
      {/* ============================================================ */}
      {isApproveSimpleModalOpen && selectedVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-800">Approuver la vidéo</h2>
              <button onClick={() => setIsApproveSimpleModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-full transition">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-gray-600">
                  Vidéo: <span className="font-semibold">{selectedVideo.title}</span>
                </p>
              </div>
              
              {/* Prix */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CurrencyDollarIcon className="w-4 h-4 inline mr-1" />
                  Prix (coins)
                </label>
                <input
                  type="number"
                  value={simpleVideoPrice}
                  onChange={(e) => setSimpleVideoPrice(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  min={0} step={50}
                />
                <p className="text-xs text-gray-400 mt-1">Le créateur recevra 70%</p>
              </div>

              {/* Catégories MULTIPLES */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TagIcon className="w-4 h-4 inline mr-1" />
                  Catégories ({simpleVideoCategories.length} sélectionnée{simpleVideoCategories.length > 1 ? 's' : ''})
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categoriesList.map((cat) => {
                    const isSelected = simpleVideoCategories.includes(cat.id)
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id, simpleVideoCategories, setSimpleVideoCategories)}
                        className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#FF6B35] text-white shadow-md border-2 border-[#FF6B35]'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                        }`}
                      >
                        {isSelected && <CheckCircleIcon className="w-3.5 h-3.5" />}
                        {cat.label.replace(/^[^\s]+\s/, '')}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">
                  Sélectionnez une ou plusieurs catégories
                </p>
              </div>
            </div>
            
            <div className="p-4 border-t flex gap-3 flex-shrink-0 bg-white">
              <button 
                onClick={confirmApproveSimple} 
                disabled={processingId === selectedVideo.id}
                className="flex-1 bg-green-500 text-white py-2.5 rounded-lg hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center gap-2 font-bold"
              >
                {processingId === selectedVideo.id ? (
                  <><div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div> Approbation...</>
                ) : 'Approuver'}
              </button>
              <button onClick={() => setIsApproveSimpleModalOpen(false)} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition font-bold">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALE DÉCOUPAGE */}
      {/* ============================================================ */}
      {isCutModalOpen && selectedVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-800">Découpage du film</h2>
              <button onClick={() => setIsCutModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-full transition">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FilmIcon className="w-8 h-8 text-purple-500" />
                </div>
                <p className="text-gray-600">
                  Film: <span className="font-semibold">{selectedVideo.title}</span>
                </p>
              </div>
              
              {/* Durée par épisode */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <ClockIcon className="w-4 h-4 inline mr-1" />
                  Durée par épisode (secondes)
                </label>
                <div className="flex gap-2">
                  {[15, 30, 45, 60].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setEpisodeDuration(sec)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
                        episodeDuration === sec
                          ? 'bg-[#FF6B35] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">≈ {Math.ceil((selectedVideo.duration || 60) / episodeDuration)} épisodes</p>
              </div>

              {/* Prix par épisode */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CurrencyDollarIcon className="w-4 h-4 inline mr-1" />
                  Prix par épisode (coins)
                </label>
                <input
                  type="number"
                  value={pricePerEpisode}
                  onChange={(e) => setPricePerEpisode(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  min={0} step={50}
                />
              </div>

              {/* Catégories MULTIPLES */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TagIcon className="w-4 h-4 inline mr-1" />
                  Catégories de la série ({seriesCategories.length} sélectionnée{seriesCategories.length > 1 ? 's' : ''})
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categoriesList.map((cat) => {
                    const isSelected = seriesCategories.includes(cat.id)
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id, seriesCategories, setSeriesCategories)}
                        className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-purple-500 text-white shadow-md border-2 border-purple-500'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                        }`}
                      >
                        {isSelected && <CheckCircleIcon className="w-3.5 h-3.5" />}
                        {cat.label.replace(/^[^\s]+\s/, '')}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">
                  Sélectionnez une ou plusieurs catégories
                </p>
              </div>
              
              <p className="text-xs text-gray-400">Le créateur recevra 70% du montant</p>
            </div>
            
            <div className="p-4 border-t flex gap-3 flex-shrink-0 bg-white">
              <button 
                onClick={confirmCutSeries} 
                disabled={processingId === selectedVideo.id}
                className="flex-1 bg-purple-500 text-white py-2.5 rounded-lg hover:bg-purple-600 transition disabled:opacity-50 flex items-center justify-center gap-2 font-bold"
              >
                {processingId === selectedVideo.id ? (
                  <><div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div> Découpage...</>
                ) : 'Découper et publier'}
              </button>
              <button onClick={() => setIsCutModalOpen(false)} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition font-bold">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALE REJET */}
      {/* ============================================================ */}
      {isRejectModalOpen && selectedVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-800">Rejeter la vidéo</h2>
              <button onClick={() => setIsRejectModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-full transition">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-gray-600">
                  Vidéo: <span className="font-semibold">{selectedVideo.title}</span>
                </p>
              </div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Motif du rejet..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                rows={4}
              />
            </div>
            
            <div className="p-4 border-t flex gap-3 flex-shrink-0 bg-white">
              <button 
                onClick={confirmReject} 
                disabled={processingId === selectedVideo.id}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-lg hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2 font-bold"
              >
                {processingId === selectedVideo.id ? (
                  <><div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div> Rejet...</>
                ) : 'Rejeter'}
              </button>
              <button onClick={() => setIsRejectModalOpen(false)} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition font-bold">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}