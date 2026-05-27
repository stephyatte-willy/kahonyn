"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState, useRef } from 'react'
import AdminLayout from '../layout'
import { 
  EyeIcon, 
  PencilIcon, 
  TrashIcon, 
  ArchiveBoxIcon, 
  ArrowPathIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  VideoCameraIcon,
  ArchiveBoxXMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  FilmIcon,
  PlayIcon,
  TagIcon,
  DocumentTextIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import toast, { Toaster } from 'react-hot-toast'

interface Episode {
  id: string
  title: string
  episodeNumber: number
  duration: number
  price: number
  url: string
  thumbnail: string
  views: number
  purchases: number
  status: string
  description?: string   // ← AJOUTER CETTE LIGNE
}

interface Series {
  id: string
  title: string
  description: string
  thumbnail: string
  url: string
  duration: number
  price: number
  views: number
  purchases: number
  status: string
  category: string
  isSeries: boolean
  parentId: string | null
  episodeNumber: number | null
  creatorId: string
  createdAt: string
  updatedAt: string
  creator: { name: string; phone: string; email: string }
  episodes: Episode[]
}

interface SimpleVideo {
  id: string
  title: string
  description: string
  thumbnail: string
  url: string
  duration: number
  price: number
  views: number
  purchases: number
  status: string
  category: string
  isSeries: boolean
  parentId: string | null
  episodeNumber: number | null
  creatorId: string
  createdAt: string
  updatedAt: string
  creator: { name: string; phone: string; email: string }
}

// Catégories disponibles
const categories = [
  { id: 'popular', label: '🔥 Populaires', icon: '🔥' },
  { id: 'anime', label: '🎌 Animé', icon: '🎌' },
  { id: 'unpublished', label: '✨ Inédit', icon: '✨' },
  { id: 'ranking', label: '🏆 Classement', icon: '🏆' },
  { id: 'dubbed', label: '🎤 Doublés', icon: '🎤' },
  { id: 'vip', label: '👑 VIP', icon: '👑' },
  { id: 'women', label: '👩 Femmes', icon: '👩' },
  { id: 'men', label: '👨 Hommes', icon: '👨' },
]

export default function AllVideos() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [series, setSeries] = useState<Series[]>([])
  const [simpleVideos, setSimpleVideos] = useState<SimpleVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  
  // États pour les modales
  const [selectedVideo, setSelectedVideo] = useState<SimpleVideo | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false)
  const [actionVideo, setActionVideo] = useState<SimpleVideo | null>(null)
  const [actionSeries, setActionSeries] = useState<Series | null>(null)
  const [saving, setSaving] = useState(false)
  
  // États pour la modal d'édition vidéo simple
  const [isEditVideoModalOpen, setIsEditVideoModalOpen] = useState(false)
  const [editingVideo, setEditingVideo] = useState<SimpleVideo | null>(null)
  
  // États pour la modal d'édition série
  const [isEditSeriesModalOpen, setIsEditSeriesModalOpen] = useState(false)
  const [editingSeries, setEditingSeries] = useState<Series | null>(null)
  
  // États pour la modal série
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null)
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false)
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('')
  
  const videoRef = useRef<HTMLVideoElement>(null)

  const resetFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setTypeFilter('all')
  }

  const filteredSeries = series.filter(serie => {
    const matchesSearch = searchTerm === '' || 
      serie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (serie.creator?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || serie.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredSimpleVideos = simpleVideos.filter(video => {
    const matchesSearch = searchTerm === '' || 
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (video.creator?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || video.status === statusFilter
    return matchesSearch && matchesStatus
  })

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (session?.user?.role !== 'admin') {
      router.push('/')
      return
    }
    fetchVideos()
  }, [session, sessionStatus, router])

  const fetchVideos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/all-videos')
      if (!res.ok) throw new Error('Erreur chargement')
      const data = await res.json()
      setSeries(data.series || [])
      setSimpleVideos(data.simpleVideos || [])
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Impossible de charger les vidéos')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // GESTION DES VIDÉOS SIMPLES
  // ============================================================
  const handleView = (video: SimpleVideo) => {
    setSelectedVideo(video)
    setIsViewModalOpen(true)
  }

  const handleEditVideo = (video: SimpleVideo) => {
    setEditingVideo({ ...video })
    setIsEditVideoModalOpen(true)
  }

  const handleSaveVideoEdit = async () => {
    if (!editingVideo) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/update-video', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingVideo.id,
          title: editingVideo.title,
          description: editingVideo.description,
          price: editingVideo.price,
          status: editingVideo.status,
          category: editingVideo.category
        })
      })
      if (res.ok) {
        toast.success('Vidéo modifiée avec succès')
        setIsEditVideoModalOpen(false)
        fetchVideos()
      } else {
        toast.error('Erreur lors de la modification')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (video: SimpleVideo) => {
    setActionVideo(video)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!actionVideo) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/delete-video', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: actionVideo.id })
      })
      if (res.ok) {
        toast.success('Vidéo supprimée avec succès')
        setIsDeleteModalOpen(false)
        setActionVideo(null)
        fetchVideos()
      } else {
        toast.error('Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  const handleArchiveClick = (video: SimpleVideo) => {
    setActionVideo(video)
    setIsArchiveModalOpen(true)
  }

  const confirmArchive = async () => {
    if (!actionVideo) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/update-video-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: actionVideo.id, status: 'archived' })
      })
      if (res.ok) {
        toast.success('Vidéo archivée avec succès')
        setIsArchiveModalOpen(false)
        setActionVideo(null)
        fetchVideos()
      } else {
        toast.error('Erreur')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  const handleRestoreClick = (video: SimpleVideo) => {
    setActionVideo(video)
    setIsRestoreModalOpen(true)
  }

  const confirmRestore = async () => {
    if (!actionVideo) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/update-video-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: actionVideo.id, status: 'approved' })
      })
      if (res.ok) {
        toast.success('Vidéo restaurée avec succès')
        setIsRestoreModalOpen(false)
        setActionVideo(null)
        fetchVideos()
      } else {
        toast.error('Erreur')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  // ============================================================
  // GESTION DES SÉRIES (EN BLOC)
  // ============================================================
  const handleViewSeries = (serie: Series) => {
    setSelectedSeries(serie)
    setSelectedEpisode(serie.episodes[0] || null)
    setCurrentVideoUrl(serie.episodes[0]?.url || '')
    setIsSeriesModalOpen(true)
  }

  const handlePlayEpisode = (episode: Episode) => {
    setSelectedEpisode(episode)
    setCurrentVideoUrl(episode.url)
  }

  const handleEditSeries = (serie: Series) => {
  const avgPrice = serie.episodes.length > 0 ? serie.episodes[0].price : 100
  setEditingSeries({ ...serie, price: avgPrice })
  setIsEditSeriesModalOpen(true)
}

  const handleSaveSeriesEdit = async () => {
    if (!editingSeries) return
    setSaving(true)
    try {
      // 1. Mettre à jour la série master
      const masterRes = await fetch('/api/admin/update-video', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSeries.id,
          title: editingSeries.title,
          description: editingSeries.description,
          category: editingSeries.category,
          status: editingSeries.status
        })
      })
      
      if (!masterRes.ok) throw new Error('Erreur mise à jour série')
      
      // 2. Mettre à jour tous les épisodes (prix)
      const episodesRes = await fetch('/api/admin/update-series-episodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seriesId: editingSeries.id,
          price: editingSeries.price,
          status: editingSeries.status,
          category: editingSeries.category
        })
      })
      
      if (!episodesRes.ok) throw new Error('Erreur mise à jour épisodes')
      
      toast.success('Série et ses épisodes modifiés avec succès')
      setIsEditSeriesModalOpen(false)
      fetchVideos()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la modification')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSeriesClick = (serie: Series) => {
    setActionSeries(serie)
    setIsDeleteModalOpen(true)
  }

  const confirmDeleteSeries = async () => {
    if (!actionSeries) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/manage-series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seriesId: actionSeries.id, action: 'delete' })
      })
      if (res.ok) {
        toast.success('Série et ses épisodes supprimés')
        setIsDeleteModalOpen(false)
        setActionSeries(null)
        fetchVideos()
      } else {
        toast.error('Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  const handleArchiveSeriesClick = (serie: Series) => {
    setActionSeries(serie)
    setIsArchiveModalOpen(true)
  }

  const confirmArchiveSeries = async () => {
    if (!actionSeries) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/manage-series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seriesId: actionSeries.id, action: 'archive' })
      })
      if (res.ok) {
        toast.success('Série et ses épisodes archivés')
        setIsArchiveModalOpen(false)
        setActionSeries(null)
        fetchVideos()
      } else {
        toast.error('Erreur')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  const handleRestoreSeriesClick = (serie: Series) => {
    setActionSeries(serie)
    setIsRestoreModalOpen(true)
  }

  const confirmRestoreSeries = async () => {
    if (!actionSeries) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/manage-series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seriesId: actionSeries.id, action: 'restore' })
      })
      if (res.ok) {
        toast.success('Série et ses épisodes restaurés')
        setIsRestoreModalOpen(false)
        setActionSeries(null)
        fetchVideos()
      } else {
        toast.error('Erreur')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      archived: 'bg-gray-100 text-gray-700'
    }
    const labels: Record<string, string> = {
      pending: 'En attente',
      approved: 'Approuvée',
      rejected: 'Rejetée',
      archived: 'Archivée'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${badges[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    )
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0min 0s'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}min ${secs}s`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const truncateText = (text: string, maxLength: number = 30) => {
    if (!text) return '—'
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
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
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1A1A1A', color: '#FFF8F0', borderRadius: '16px' },
        success: { iconTheme: { primary: '#FF6B35', secondary: '#1A1A1A' } },
        error: { iconTheme: { primary: '#FF6B35', secondary: '#1A1A1A' } },
      }} />
      
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Toutes les vidéos</h1>
            <p className="text-gray-500 text-sm mt-1">Gérez l'ensemble des vidéos et séries</p>
          </div>
          <button onClick={fetchVideos} className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition">
            <ArrowPathIcon className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par titre ou créateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="all">Tous les types</option>
                <option value="series">Séries (groupées)</option>
                <option value="simple">Vidéos simples</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvées</option>
                <option value="archived">Archivées</option>
              </select>
              <button onClick={resetFilters} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition flex items-center gap-2">
                <XMarkIcon className="w-4 h-4" />
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Séries (groupées) */}
        {(typeFilter === 'all' || typeFilter === 'series') && filteredSeries.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FilmIcon className="w-5 h-5 text-purple-500" />
              Séries ({filteredSeries.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSeries.map((serie) => {
                const totalEpisodes = serie.episodes.length
                const totalCoins = serie.episodes.reduce((sum, ep) => sum + ep.price, 0)
                return (
                  <div key={serie.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                    <div className="relative h-40 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center cursor-pointer group" onClick={() => handleViewSeries(serie)}>
                      {serie.thumbnail ? (
                        <img src={serie.thumbnail} alt={serie.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-5xl">🎬</span>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <PlayIcon className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 line-clamp-1">{serie.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">👤 {serie.creator?.name || serie.creator?.phone}</p>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex gap-3 text-xs text-gray-500">
                          <span>🎬 {totalEpisodes} épisodes</span>
                          <span>💰 {totalCoins} coins</span>
                        </div>
                        {getStatusBadge(serie.status)}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => handleViewSeries(serie)} className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition">
                          <EyeIcon className="w-4 h-4 inline mr-1" title="Voir" />
                        </button>
                        <button onClick={() => handleEditSeries(serie)} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition">
                          <PencilIcon className="w-4 h-4 inline mr-1" title="Modifier" />
                        </button>
                        {serie.status === 'archived' ? (
                          <button onClick={() => handleRestoreSeriesClick(serie)} className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition">
                          </button>
                        ) : (
                          <button onClick={() => handleArchiveSeriesClick(serie)} className="flex-1 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition">
                            <ArchiveBoxIcon className="w-4 h-4 inline mr-1" title="Archiver" />
                          </button>
                        )}
                        <button onClick={() => handleDeleteSeriesClick(serie)} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition">
                          <TrashIcon className="w-4 h-4 inline mr-1" title="Supprimer" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Vidéos simples */}
        {(typeFilter === 'all' || typeFilter === 'simple') && filteredSimpleVideos.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <VideoCameraIcon className="w-5 h-5 text-green-500" />
              Vidéos simples ({filteredSimpleVideos.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSimpleVideos.map((video) => (
                <div key={video.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                  <div className="relative h-40 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center cursor-pointer group" onClick={() => handleView(video)}>
                    {video.thumbnail ? (
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl">🎬</span>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <PlayIcon className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 line-clamp-1">{video.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">👤 {video.creator?.name || video.creator?.phone}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-orange-500 font-bold">{video.price} coins</span>
                      {getStatusBadge(video.status)}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleView(video)} className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition">
                        <EyeIcon className="w-4 h-4 inline mr-1" />
                        Voir
                      </button>
                      <button onClick={() => handleEditVideo(video)} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition">
                        <PencilIcon className="w-4 h-4 inline mr-1" />
                        Modifier
                      </button>
                      {video.status === 'archived' ? (
                        <button onClick={() => handleRestoreClick(video)} className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition">
                          Restaurer
                        </button>
                      ) : (
                        <button onClick={() => handleArchiveClick(video)} className="flex-1 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition">
                          <ArchiveBoxIcon className="w-4 h-4 inline mr-1" />
                          Archiver
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aucun résultat */}
        {filteredSeries.length === 0 && filteredSimpleVideos.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center">
            <VideoCameraIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune vidéo trouvée</p>
            {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
              <button onClick={resetFilters} className="mt-3 text-orange-500 hover:underline">
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODALE VISIONNAGE VIDÉO */}
      {/* ============================================================ */}
      {isViewModalOpen && selectedVideo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">{selectedVideo.title}</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <video ref={videoRef} controls autoPlay className="w-full rounded-lg" style={{ maxHeight: '60vh' }}>
                <source src={selectedVideo.url} type="video/mp4" />
              </video>
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div><p className="text-gray-500">Durée</p><p className="font-medium">{formatDuration(selectedVideo.duration)}</p></div>
                <div><p className="text-gray-500">Prix</p><p className="font-medium text-orange-500">{selectedVideo.price} coins</p></div>
                <div><p className="text-gray-500">Catégorie</p><p className="font-medium">{selectedVideo.category}</p></div>
                <div><p className="text-gray-500">Vues</p><p className="font-medium">{selectedVideo.views?.toLocaleString() || 0}</p></div>
                <div><p className="text-gray-500">Achats</p><p className="font-medium">{selectedVideo.purchases?.toLocaleString() || 0}</p></div>
                <div><p className="text-gray-500">Statut</p><p className="font-medium">{getStatusBadge(selectedVideo.status)}</p></div>
              </div>
              {selectedVideo.description && (
                <div className="mt-4 pt-3 border-t"><p className="text-gray-600 text-sm">{selectedVideo.description}</p></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALE ÉDITION VIDÉO SIMPLE */}
      {/* ============================================================ */}
      {isEditVideoModalOpen && editingVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">Modifier la vidéo</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Titre</label><input type="text" value={editingVideo.title} onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={editingVideo.description || ''} onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Prix (coins)</label><input type="number" value={editingVideo.price} onChange={(e) => setEditingVideo({ ...editingVideo, price: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" min={30} step={10} /></div>
              <div><label className="block text-sm font-medium mb-1">Catégorie</label><select value={editingVideo.category} onChange={(e) => setEditingVideo({ ...editingVideo, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg">{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Statut</label><select value={editingVideo.status} onChange={(e) => setEditingVideo({ ...editingVideo, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="pending">En attente</option><option value="approved">Approuvée</option><option value="archived">Archivée</option></select></div>
              <div className="flex gap-3 pt-4"><button onClick={handleSaveVideoEdit} disabled={saving} className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600">{saving ? 'Sauvegarde...' : 'Sauvegarder'}</button><button onClick={() => setIsEditVideoModalOpen(false)} className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300">Annuler</button></div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALE ÉDITION SÉRIE */}
      {/* ============================================================ */}
      {isEditSeriesModalOpen && editingSeries && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">Modifier la série</h2>
            <p className="text-sm text-gray-500 mb-4">Tous les épisodes seront mis à jour avec ces informations</p>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Titre</label><input type="text" value={editingSeries.title} onChange={(e) => setEditingSeries({ ...editingSeries, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={editingSeries.description || ''} onChange={(e) => setEditingSeries({ ...editingSeries, description: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Prix par épisode (coins)</label><input type="number" value={editingSeries.price} onChange={(e) => setEditingSeries({ ...editingSeries, price: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" min={30} step={10} /><p className="text-xs text-gray-400 mt-1">Ce prix s'appliquera à TOUS les épisodes</p></div>
              <div><label className="block text-sm font-medium mb-1">Catégorie</label><select value={editingSeries.category} onChange={(e) => setEditingSeries({ ...editingSeries, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg">{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}</select><p className="text-xs text-gray-400 mt-1">Cette catégorie s'appliquera à TOUS les épisodes</p></div>
              <div><label className="block text-sm font-medium mb-1">Statut</label><select value={editingSeries.status} onChange={(e) => setEditingSeries({ ...editingSeries, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="pending">En attente</option><option value="approved">Approuvée</option><option value="archived">Archivée</option></select><p className="text-xs text-gray-400 mt-1">Ce statut s'appliquera à TOUS les épisodes</p></div>
              <div className="flex gap-3 pt-4"><button onClick={handleSaveSeriesEdit} disabled={saving} className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600">{saving ? 'Sauvegarde...' : 'Sauvegarder'}</button><button onClick={() => setIsEditSeriesModalOpen(false)} className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300">Annuler</button></div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALE SUPPRESSION (unique pour vidéos et séries) */}
      {/* ============================================================ */}
      {isDeleteModalOpen && (actionVideo || actionSeries) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fadeInUp">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Confirmer la suppression</h2>
              <p className="text-gray-600 mb-6">
                {actionSeries 
                  ? `Êtes-vous sûr de vouloir supprimer la série "${truncateText(actionSeries.title, 40)}" et TOUS ses épisodes ?`
                  : `Êtes-vous sûr de vouloir supprimer la vidéo "${truncateText(actionVideo!.title, 40)}" ?`
                }
              </p>
              <div className="flex gap-3">
                <button onClick={actionSeries ? confirmDeleteSeries : confirmDelete} disabled={saving} className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition">
                  {saving ? 'Suppression...' : 'Supprimer'}
                </button>
                <button onClick={() => { setIsDeleteModalOpen(false); setActionVideo(null); setActionSeries(null); }} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALE ARCHIVAGE (unique pour vidéos et séries) */}
      {/* ============================================================ */}
      {isArchiveModalOpen && (actionVideo || actionSeries) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fadeInUp">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArchiveBoxIcon className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Archiver</h2>
              <p className="text-gray-600 mb-6">
                {actionSeries 
                  ? `Archiver la série "${truncateText(actionSeries.title, 40)}" et TOUS ses épisodes ? Ils ne seront plus visibles.`
                  : `Archiver la vidéo "${truncateText(actionVideo!.title, 40)}" ? Elle ne sera plus visible.`
                }
              </p>
              <div className="flex gap-3">
                <button onClick={actionSeries ? confirmArchiveSeries : confirmArchive} disabled={saving} className="flex-1 bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600 transition">
                  {saving ? 'Archivage...' : 'Archiver'}
                </button>
                <button onClick={() => { setIsArchiveModalOpen(false); setActionVideo(null); setActionSeries(null); }} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALE RESTAURATION (unique pour vidéos et séries) */}
      {/* ============================================================ */}
      {isRestoreModalOpen && (actionVideo || actionSeries) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fadeInUp">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArchiveBoxXMarkIcon className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Restaurer</h2>
              <p className="text-gray-600 mb-6">
                {actionSeries 
                  ? `Restaurer la série "${truncateText(actionSeries.title, 40)}" et TOUS ses épisodes ?`
                  : `Restaurer la vidéo "${truncateText(actionVideo!.title, 40)}" ?`
                }
              </p>
              <div className="flex gap-3">
                <button onClick={actionSeries ? confirmRestoreSeries : confirmRestore} disabled={saving} className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition">
                  {saving ? 'Restauration...' : 'Restaurer'}
                </button>
                <button onClick={() => { setIsRestoreModalOpen(false); setActionVideo(null); setActionSeries(null); }} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALE SÉRIE - Visionnage des épisodes avec lecture auto */}
      {/* ============================================================ */}
      {isSeriesModalOpen && selectedSeries && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* En-tête */}
            <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedSeries.title}</h2>
                <p className="text-sm text-gray-500">Créateur: {selectedSeries.creator?.name || selectedSeries.creator?.phone}</p>
              </div>
              <button onClick={() => setIsSeriesModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            {/* Contenu principal avec vidéo et épisodes */}
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              {/* Zone vidéo à gauche */}
              <div className="md:w-2/3 p-4 bg-black flex flex-col">
                <video 
                  key={currentVideoUrl}
                  ref={videoRef}
                  controls 
                  autoPlay
                  className="w-full rounded-lg"
                  style={{ maxHeight: '50vh' }}
                  onEnded={() => {
                    // Lecture automatique : passer à l'épisode suivant
                    if (selectedEpisode && selectedSeries) {
                      const currentIndex = selectedSeries.episodes.findIndex(ep => ep.id === selectedEpisode.id)
                      const nextEpisode = selectedSeries.episodes[currentIndex + 1]
                      if (nextEpisode) {
                        setSelectedEpisode(nextEpisode)
                        setCurrentVideoUrl(nextEpisode.url)
                        toast.success(`Lecture automatique : Épisode ${nextEpisode.episodeNumber}`)
                      }
                    }
                  }}
                >
                  <source src={currentVideoUrl} type="video/mp4" />
                </video>
                {selectedEpisode && (
                  <div className="mt-3 text-white">
                    <h3 className="font-semibold">Épisode {selectedEpisode.episodeNumber} - {selectedEpisode.title}</h3>
                    <p className="text-sm text-gray-300 line-clamp-2">
                      {selectedEpisode.description || 'Aucune description'}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Liste des épisodes à droite */}
              <div className="md:w-1/3 p-4 bg-gray-50 overflow-y-auto max-h-[calc(90vh-120px)]">
                <h3 className="font-semibold text-gray-800 mb-3 sticky top-0 bg-gray-50 py-2">
                  Épisodes ({selectedSeries.episodes.length})
                </h3>
                <div className="space-y-2">
                  {selectedSeries.episodes.map((episode) => {
                    const isCurrent = selectedEpisode?.id === episode.id
                    return (
                      <div
                        key={episode.id}
                        onClick={() => {
                          setSelectedEpisode(episode)
                          setCurrentVideoUrl(episode.url)
                          toast.success(`Épisode ${episode.episodeNumber}`)
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition flex items-center gap-3 ${
                          isCurrent
                            ? 'bg-orange-100 border border-orange-500'
                            : 'bg-white hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                          {episode.thumbnail ? (
                            <img src={episode.thumbnail} alt={episode.title} className="w-full h-full object-cover" />
                          ) : (
                            <PlayIcon className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">Épisode {episode.episodeNumber}</p>
                            {isCurrent && (
                              <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full">En cours</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1">{episode.title}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-400">{formatDuration(episode.duration)}</span>
                            <span className="text-xs font-semibold text-orange-500">{episode.price} coins</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {/* Indicateur de lecture automatique */}
                {selectedEpisode && (() => {
                  const currentIndex = selectedSeries.episodes.findIndex(ep => ep.id === selectedEpisode.id)
                  const nextEpisode = selectedSeries.episodes[currentIndex + 1]
                  if (nextEpisode) {
                    return (
                      <div className="mt-4 p-2 bg-gray-100 rounded-lg text-center text-xs text-gray-500">
                        ⏭️ Lecture automatique de l'épisode {nextEpisode.episodeNumber} à la fin
                      </div>
                    )
                  }
                  return null
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}