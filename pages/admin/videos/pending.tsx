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
  ClockIcon
} from '@heroicons/react/24/outline'
import toast, { Toaster } from 'react-hot-toast'

interface Video {
  id: string
  title: string
  description: string
  thumbnail: string
  url: string
  duration: number
  price: number           // ← AJOUTER CETTE LIGNE
  status: string
  creator: { name: string; phone: string; email: string }
  createdAt: string
}

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
  const [rejectReason, setRejectReason] = useState('')
  const [actionVideoId, setActionVideoId] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (session?.user?.role !== 'admin') {
      router.push('/')
      return
    }
    fetchPendingVideos()
  }, [session, sessionStatus, router])

  const fetchPendingVideos = async () => {
    try {
      const res = await fetch('/api/admin/pending-videos')
      const data = await res.json()
      setVideos(data)
    } catch (error) {
      toast.error('Impossible de charger les vidéos')
    } finally {
      setLoading(false)
    }
  }

  const handleViewVideo = (video: Video) => {
    setSelectedVideo(video)
    setIsViewModalOpen(true)
  }

  const handleApproveSimpleClick = (video: Video) => {
    setSelectedVideo(video)
    setSimpleVideoPrice(video.price || 100)
    setIsApproveSimpleModalOpen(true)
  }

  const confirmApproveSimple = async () => {
    if (!selectedVideo) return
    setProcessingId(selectedVideo.id)
    try {
      const res = await fetch('/api/admin/approve-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: selectedVideo.id, price: simpleVideoPrice })
      })
      if (res.ok) {
        toast.success('Vidéo approuvée avec succès !')
        fetchPendingVideos()
        setIsApproveSimpleModalOpen(false)
      } else {
        toast.error('Erreur lors de l\'approbation')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    } finally {
      setProcessingId(null)
    }
  }

  const handleCutSeriesClick = (video: Video) => {
    setSelectedVideo(video)
    setEpisodeDuration(30)
    setPricePerEpisode(100)
    setIsCutModalOpen(true)
  }

  const confirmCutSeries = async () => {
  if (!selectedVideo) return
  setProcessingId(selectedVideo.id)
  try {
    // Vérifie que l'URL est correcte
    const res = await fetch('/api/admin/split-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: selectedVideo.id,
        episodeDuration,
        pricePerEpisode
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
    console.error('Erreur:', error)
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
        toast.error('Vidéo rejetée')
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
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}min ${secs}s`
  }

  const formatDate = (dateString: string) => {
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

  return (
    <AdminLayout>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1A1A1A', color: '#FFF8F0', borderRadius: '16px' },
        success: { iconTheme: { primary: '#FF6B35', secondary: '#1A1A1A' } },
        error: { iconTheme: { primary: '#FF6B35', secondary: '#1A1A1A' } },
      }} />

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Vidéos en attente</h1>
            <p className="text-gray-500 text-sm mt-1">
              🎬 Vidéo courte → Approuver avec prix<br />
              🎞️ Film complet → Découper en épisodes
            </p>
          </div>
          <div className="bg-yellow-100 rounded-full px-4 py-2">
            <span className="text-yellow-700 font-semibold">{videos.length} en attente</span>
          </div>
        </div>

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
                      <CheckCircleIcon className="w-4 h-4" />
                      Vidéo simple
                    </button>
                    <button
                      onClick={() => handleCutSeriesClick(video)}
                      disabled={processingId === video.id}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition disabled:opacity-50"
                    >
                      <FilmIcon className="w-4 h-4" />
                      Découper
                    </button>
                    <button
                      onClick={() => handleRejectClick(video)}
                      disabled={processingId === video.id}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition disabled:opacity-50"
                    >
                      <XCircleIcon className="w-4 h-4" />
                      Rejeter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Visionnage */}
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
                <div>
                  <p className="text-gray-500">Durée</p>
                  <p className="font-medium">{formatDuration(selectedVideo.duration)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Créateur</p>
                  <p className="font-medium">{selectedVideo.creator?.name || selectedVideo.creator?.phone}</p>
                </div>
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

      {/* Modal Approbation vidéo simple */}
      {isApproveSimpleModalOpen && selectedVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fadeInUp">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Approuver la vidéo</h2>
              <p className="text-gray-600 mb-4">
                Vidéo: <span className="font-semibold">{selectedVideo.title}</span>
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix (coins)</label>
                <input
                  type="number"
                  value={simpleVideoPrice}
                  onChange={(e) => setSimpleVideoPrice(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  min={50}
                  step={50}
                />
                <p className="text-xs text-gray-400 mt-1">Le créateur recevra 70%</p>
              </div>
              <div className="flex gap-3">
                <button onClick={confirmApproveSimple} className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition">
                  Approuver
                </button>
                <button onClick={() => setIsApproveSimpleModalOpen(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Découpage */}
      {isCutModalOpen && selectedVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fadeInUp">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FilmIcon className="w-8 h-8 text-purple-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Découpage du film</h2>
              <p className="text-gray-600 mb-4">
                Film: <span className="font-semibold">{selectedVideo.title}</span>
              </p>
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
                      className={`flex-1 py-2 rounded-lg text-sm transition ${
                        episodeDuration === sec
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">≈ {Math.ceil(selectedVideo.duration / episodeDuration)} épisodes</p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CurrencyDollarIcon className="w-4 h-4 inline mr-1" />
                  Prix par épisode (coins)
                </label>
                <input
                  type="number"
                  value={pricePerEpisode}
                  onChange={(e) => setPricePerEpisode(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  min={50}
                  step={50}
                />
                <p className="text-xs text-gray-400 mt-1">Le créateur recevra 70% du montant</p>
              </div>
              <div className="flex gap-3">
                <button onClick={confirmCutSeries} className="flex-1 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition">
                  Découper et publier
                </button>
                <button onClick={() => setIsCutModalOpen(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rejet */}
      {isRejectModalOpen && selectedVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fadeInUp">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Rejeter la vidéo</h2>
              <p className="text-gray-600 mb-4">
                Vidéo: <span className="font-semibold">{selectedVideo.title}</span>
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Motif du rejet..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none mb-6"
                rows={3}
              />
              <div className="flex gap-3">
                <button onClick={confirmReject} className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition">
                  Rejeter
                </button>
                <button onClick={() => setIsRejectModalOpen(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}