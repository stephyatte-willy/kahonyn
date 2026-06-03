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
  FilmIcon,
  PlayIcon,
  TagIcon,
  CurrencyDollarIcon,
  CheckCircleIcon
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
  description?: string
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

export default function AllVideos() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [series, setSeries] = useState<Series[]>([])
  const [simpleVideos, setSimpleVideos] = useState<SimpleVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  
  const [selectedVideo, setSelectedVideo] = useState<SimpleVideo | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false)
  const [actionVideo, setActionVideo] = useState<SimpleVideo | null>(null)
  const [actionSeries, setActionSeries] = useState<Series | null>(null)
  const [saving, setSaving] = useState(false)
  
  const [isEditVideoModalOpen, setIsEditVideoModalOpen] = useState(false)
  const [editingVideo, setEditingVideo] = useState<SimpleVideo | null>(null)
  const [editingVideoCategories, setEditingVideoCategories] = useState<string[]>(['popular'])
  
  const [isEditSeriesModalOpen, setIsEditSeriesModalOpen] = useState(false)
  const [editingSeries, setEditingSeries] = useState<Series | null>(null)
  const [editingSeriesCategories, setEditingSeriesCategories] = useState<string[]>(['popular'])
  
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null)
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false)
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('')
  
  const videoRef = useRef<HTMLVideoElement>(null)

  const parseCategories = (catString: string | undefined): string[] => {
    if (!catString) return ['popular']
    return catString.split(',').filter(Boolean)
  }

  const toggleCategory = (catId: string, current: string[], setter: (cats: string[]) => void) => {
    if (current.includes(catId)) {
      if (current.length > 1) setter(current.filter(c => c !== catId))
    } else {
      setter([...current, catId])
    }
  }

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
    if (session?.user?.role !== 'admin') { router.push('/'); return }
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
      toast.error('Impossible de charger les vidéos')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // VIDÉOS SIMPLES
  // ============================================================
  const handleView = (video: SimpleVideo) => { setSelectedVideo(video); setIsViewModalOpen(true) }
  const handleEditVideo = (video: SimpleVideo) => { setEditingVideo({ ...video }); setEditingVideoCategories(parseCategories(video.category)); setIsEditVideoModalOpen(true) }
  const handleSaveVideoEdit = async () => {
    if (!editingVideo) return; setSaving(true)
    try {
      const categoryString = editingVideoCategories.join(',')
      const res = await fetch('/api/admin/update-video', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingVideo.id, title: editingVideo.title, description: editingVideo.description, price: editingVideo.price, status: editingVideo.status, categories: editingVideoCategories, category: categoryString }) })
      if (res.ok) { toast.success('Vidéo modifiée'); setIsEditVideoModalOpen(false); fetchVideos() } else { toast.error('Erreur') }
    } catch { toast.error('Erreur réseau') } finally { setSaving(false) }
  }

  const handleDeleteClick = (video: SimpleVideo) => { setActionVideo(video); setIsDeleteModalOpen(true) }
  const confirmDelete = async () => {
    if (!actionVideo) return; setSaving(true)
    try {
      const res = await fetch('/api/admin/delete-video', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoId: actionVideo.id }) })
      if (res.ok) { toast.success('Vidéo supprimée'); setIsDeleteModalOpen(false); setActionVideo(null); fetchVideos() } else { toast.error('Erreur') }
    } catch { toast.error('Erreur réseau') } finally { setSaving(false) }
  }

  const handleArchiveClick = (video: SimpleVideo) => { setActionVideo(video); setIsArchiveModalOpen(true) }
  const confirmArchive = async () => {
    if (!actionVideo) return; setSaving(true)
    try {
      const res = await fetch('/api/admin/update-video-status', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoId: actionVideo.id, status: 'archived' }) })
      if (res.ok) { toast.success('Vidéo archivée'); setIsArchiveModalOpen(false); setActionVideo(null); fetchVideos() } else { toast.error('Erreur') }
    } catch { toast.error('Erreur réseau') } finally { setSaving(false) }
  }

  const handleRestoreClick = (video: SimpleVideo) => { setActionVideo(video); setIsRestoreModalOpen(true) }
  const confirmRestore = async () => {
    if (!actionVideo) return; setSaving(true)
    try {
      const res = await fetch('/api/admin/update-video-status', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoId: actionVideo.id, status: 'approved' }) })
      if (res.ok) { toast.success('Vidéo restaurée'); setIsRestoreModalOpen(false); setActionVideo(null); fetchVideos() } else { toast.error('Erreur') }
    } catch { toast.error('Erreur réseau') } finally { setSaving(false) }
  }

  // ============================================================
  // SÉRIES
  // ============================================================
  const handleViewSeries = (serie: Series) => { setSelectedSeries(serie); const episodes = serie.episodes || []; const firstEpisode = episodes.length > 0 ? episodes[0] : null; setSelectedEpisode(firstEpisode); setCurrentVideoUrl(firstEpisode?.url || ''); setIsSeriesModalOpen(true) }
  const handleEditSeries = (serie: Series) => { const avgPrice = serie.episodes && serie.episodes.length > 0 ? serie.episodes[0].price : 100; setEditingSeries({ ...serie, price: avgPrice }); setEditingSeriesCategories(parseCategories(serie.category)); setIsEditSeriesModalOpen(true) }
  const handleSaveSeriesEdit = async () => {
    if (!editingSeries) return; setSaving(true)
    try {
      const categoryString = editingSeriesCategories.join(',')
      const updateRes = await fetch('/api/admin/update-series', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingSeries.id, title: editingSeries.title, description: editingSeries.description, price: editingSeries.price, status: editingSeries.status, categories: editingSeriesCategories, category: categoryString }) })
      const updateData = await updateRes.json()
      if (!updateRes.ok) throw new Error(updateData.error || 'Erreur')
      toast.success('Série modifiée'); setIsEditSeriesModalOpen(false); fetchVideos()
    } catch (error: any) { toast.error(error.message || 'Erreur') } finally { setSaving(false) }
  }

  const handleDeleteSeriesClick = (serie: Series) => { setActionSeries(serie); setIsDeleteModalOpen(true) }
  const confirmDeleteSeries = async () => { if (!actionSeries) return; setSaving(true); try { const res = await fetch('/api/admin/manage-series', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seriesId: actionSeries.id, action: 'delete' }) }); if (res.ok) { toast.success('Série supprimée'); setIsDeleteModalOpen(false); setActionSeries(null); fetchVideos() } else { toast.error('Erreur') } } catch { toast.error('Erreur réseau') } finally { setSaving(false) } }

  const handleArchiveSeriesClick = (serie: Series) => { setActionSeries(serie); setIsArchiveModalOpen(true) }
  const confirmArchiveSeries = async () => { if (!actionSeries) return; setSaving(true); try { const res = await fetch('/api/admin/manage-series', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seriesId: actionSeries.id, action: 'archive' }) }); if (res.ok) { toast.success('Série archivée'); setIsArchiveModalOpen(false); setActionSeries(null); fetchVideos() } else { toast.error('Erreur') } } catch { toast.error('Erreur réseau') } finally { setSaving(false) } }

  const handleRestoreSeriesClick = (serie: Series) => { setActionSeries(serie); setIsRestoreModalOpen(true) }
  const confirmRestoreSeries = async () => { if (!actionSeries) return; setSaving(true); try { const res = await fetch('/api/admin/manage-series', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seriesId: actionSeries.id, action: 'restore' }) }); if (res.ok) { toast.success('Série restaurée'); setIsRestoreModalOpen(false); setActionSeries(null); fetchVideos() } else { toast.error('Erreur') } } catch { toast.error('Erreur réseau') } finally { setSaving(false) } }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', archived: 'bg-gray-100 text-gray-700' }
    const labels: Record<string, string> = { pending: 'En attente', approved: 'Approuvée', rejected: 'Rejetée', archived: 'Archivée' }
    return <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${badges[status] || 'bg-gray-100'}`}>{labels[status] || status}</span>
  }

  const formatDuration = (seconds: number) => { if (!seconds) return '0min 0s'; const mins = Math.floor(seconds / 60); const secs = seconds % 60; return `${mins}min ${secs}s` }
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const truncateText = (text: string, maxLength: number = 30) => !text ? '—' : text.length > maxLength ? text.substring(0, maxLength) + '...' : text

  if (sessionStatus === 'loading' || loading) {
    return <AdminLayout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div></AdminLayout>
  }
  if (!session || session.user?.role !== 'admin') return null

  return (
    <AdminLayout>
      <Toaster position="top-center" toastOptions={{ style: { background: '#1A1A35', color: '#FFF', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold', fontSize: '14px' }, success: { iconTheme: { primary: '#22C55E', secondary: '#1A1A35' }, duration: 2000 }, error: { iconTheme: { primary: '#EF4444', secondary: '#1A1A35' }, duration: 2500 } }} />

      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div><h1 className="text-2xl font-bold text-gray-800">Toutes les vidéos</h1><p className="text-gray-500 text-sm mt-1">Gérez l'ensemble des vidéos et séries</p></div>
          <button onClick={fetchVideos} className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"><ArrowPathIcon className="w-4 h-4" />Actualiser</button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative"><MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Rechercher par titre ou créateur..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" /></div>
            <div className="flex gap-2">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-4 py-2 border rounded-lg"><option value="all">Tous les types</option><option value="series">Séries</option><option value="simple">Vidéos simples</option></select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg"><option value="all">Tous les statuts</option><option value="pending">En attente</option><option value="approved">Approuvées</option><option value="archived">Archivées</option></select>
              <button onClick={resetFilters} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"><XMarkIcon className="w-4 h-4" />Réinitialiser</button>
            </div>
          </div>
        </div>

        {/* Séries */}
        {(typeFilter === 'all' || typeFilter === 'series') && filteredSeries.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2"><FilmIcon className="w-5 h-5 text-purple-500" />Séries ({filteredSeries.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSeries.map((serie) => {
                const totalEpisodes = serie.episodes.length
                const totalCoins = serie.episodes.reduce((sum, ep) => sum + ep.price, 0)
                return (
                  <div key={serie.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                    <div className="relative h-40 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center cursor-pointer group" onClick={() => handleViewSeries(serie)}>
                      {serie.thumbnail ? <img src={serie.thumbnail} alt={serie.title} className="w-full h-full object-cover" /> : <span className="text-5xl">🎬</span>}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"><PlayIcon className="w-12 h-12 text-white" /></div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 line-clamp-1">{serie.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">👤 {serie.creator?.name || serie.creator?.phone}</p>
                      <div className="flex justify-between items-center mt-2"><div className="flex gap-3 text-xs text-gray-500"><span>🎬 {totalEpisodes} ép.</span><span>💰 {totalCoins} coins</span></div>{getStatusBadge(serie.status)}</div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => handleViewSeries(serie)} className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition"><EyeIcon className="w-4 h-4 inline mr-1" /></button>
                        <button onClick={() => handleEditSeries(serie)} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition"><PencilIcon className="w-4 h-4 inline mr-1" /></button>
                        {serie.status === 'archived' ? (
                          <button onClick={() => handleRestoreSeriesClick(serie)} className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition">Restaurer</button>
                        ) : (
                          <button onClick={() => handleArchiveSeriesClick(serie)} className="flex-1 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition"><ArchiveBoxIcon className="w-4 h-4 inline mr-1" /></button>
                        )}
                        <button onClick={() => handleDeleteSeriesClick(serie)} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition"><TrashIcon className="w-4 h-4 inline mr-1" /></button>
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
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2"><VideoCameraIcon className="w-5 h-5 text-green-500" />Vidéos simples ({filteredSimpleVideos.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSimpleVideos.map((video) => (
                <div key={video.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                  <div className="relative h-40 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center cursor-pointer group" onClick={() => handleView(video)}>
                    {video.thumbnail ? <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" /> : <span className="text-5xl">🎬</span>}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"><PlayIcon className="w-12 h-12 text-white" /></div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 line-clamp-1">{video.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">👤 {video.creator?.name || video.creator?.phone}</p>
                    <div className="flex justify-between items-center mt-2"><span className="text-orange-500 font-bold">{video.price} coins</span>{getStatusBadge(video.status)}</div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleView(video)} className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition"><EyeIcon className="w-4 h-4 inline mr-1" />Voir</button>
                      <button onClick={() => handleEditVideo(video)} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition"><PencilIcon className="w-4 h-4 inline mr-1" />Modifier</button>
                      {video.status === 'archived' ? (
                        <button onClick={() => handleRestoreClick(video)} className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition">Restaurer</button>
                      ) : (
                        <button onClick={() => handleArchiveClick(video)} className="flex-1 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition"><ArchiveBoxIcon className="w-4 h-4 inline mr-1" />Archiver</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredSeries.length === 0 && filteredSimpleVideos.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center"><VideoCameraIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Aucune vidéo trouvée</p></div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODALE VISIONNAGE VIDÉO */}
      {/* ============================================================ */}
      {isViewModalOpen && selectedVideo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b"><h2 className="text-xl font-bold">{selectedVideo.title}</h2><button onClick={() => setIsViewModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><XMarkIcon className="w-6 h-6" /></button></div>
            <div className="p-4">
              <video ref={videoRef} controls autoPlay className="w-full rounded-lg" style={{ maxHeight: '60vh' }}><source src={selectedVideo.url} type="video/mp4" /></video>
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div><p className="text-gray-500">Durée</p><p className="font-medium">{formatDuration(selectedVideo.duration)}</p></div>
                <div><p className="text-gray-500">Prix</p><p className="font-medium text-orange-500">{selectedVideo.price} coins</p></div>
                <div><p className="text-gray-500">Catégorie</p><p className="font-medium">{selectedVideo.category}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALE SÉRIE */}
      {/* ============================================================ */}
      {isSeriesModalOpen && selectedSeries && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A35] rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/10">
            <div className="flex justify-between items-center p-4 border-b border-white/10 flex-shrink-0"><div><h2 className="text-lg font-bold text-white">{selectedSeries.title}</h2><p className="text-sm text-white/60">{selectedSeries.creator?.name || selectedSeries.creator?.phone} • {(selectedSeries.episodes || []).length} épisodes</p></div><button onClick={() => setIsSeriesModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition"><XMarkIcon className="w-5 h-5 text-white" /></button></div>
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              <div className="md:w-2/3 p-4 bg-black flex flex-col items-center justify-center">
                {currentVideoUrl ? (
                  <video key={currentVideoUrl} controls autoPlay className="w-full rounded-lg" style={{ maxHeight: '55vh' }}><source src={currentVideoUrl} type="video/mp4" /></video>
                ) : (
                  <div className="text-center text-white/50"><PlayIcon className="w-16 h-16 mx-auto mb-4" /><p className="font-bold">Sélectionnez un épisode</p></div>
                )}
              </div>
              <div className="md:w-1/3 p-4 bg-gray-900/50 overflow-y-auto max-h-[calc(90vh-120px)]">
                <h3 className="font-bold text-white mb-3">Épisodes ({(selectedSeries.episodes || []).length})</h3>
                <div className="space-y-2">
                  {(selectedSeries.episodes || []).map((episode: any) => {
                    const isCurrent = selectedEpisode?.id === episode.id
                    return (
                      <div key={episode.id} onClick={() => { if (episode.url) { setSelectedEpisode(episode); setCurrentVideoUrl(episode.url) } }} className={`p-3 rounded-lg cursor-pointer transition flex items-center gap-3 ${isCurrent ? 'bg-[#FF6B35]/20 border border-[#FF6B35]/50' : 'bg-white/5 hover:bg-white/10 border border-white/5'}`}>
                        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">{episode.thumbnail ? <img src={episode.thumbnail} alt="" className="w-full h-full object-cover" /> : <PlayIcon className="w-5 h-5 text-gray-400" />}</div>
                        <div className="flex-1 min-w-0"><p className="font-bold text-xs text-white truncate">Épisode {episode.episodeNumber}</p><div className="flex justify-between items-center mt-1"><span className="text-[10px] text-white/40">{formatDuration(episode.duration)}</span><span className="text-[10px] font-bold text-[#FF6B35]">{episode.price} coins</span></div></div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALE ÉDITION VIDÉO SIMPLE */}
      {/* ============================================================ */}
      {isEditVideoModalOpen && editingVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10"><h2 className="text-lg font-bold text-gray-800">Modifier la vidéo</h2><button onClick={() => setIsEditVideoModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-full transition"><XMarkIcon className="w-5 h-5 text-gray-500" /></button></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Titre</label><input type="text" value={editingVideo.title} onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={editingVideo.description || ''} onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1"><CurrencyDollarIcon className="w-4 h-4 inline mr-1" />Prix (coins)</label><input type="number" value={editingVideo.price} onChange={(e) => setEditingVideo({ ...editingVideo, price: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" min={0} step={10} /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2"><TagIcon className="w-4 h-4 inline mr-1" />Catégories ({editingVideoCategories.length} sélectionnée{editingVideoCategories.length > 1 ? 's' : ''})</label>
                <div className="grid grid-cols-2 gap-2">
                  {categoriesList.map((cat) => {
                    const isSelected = editingVideoCategories.includes(cat.id)
                    return (
                      <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id, editingVideoCategories, setEditingVideoCategories)} className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${isSelected ? 'bg-[#FF6B35] text-white shadow-md border-2 border-[#FF6B35]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'}`}>
                        {isSelected && <CheckCircleIcon className="w-3.5 h-3.5" />}{cat.label.replace(/^[^\s]+\s/, '')}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Statut</label><select value={editingVideo.status} onChange={(e) => setEditingVideo({ ...editingVideo, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"><option value="pending">En attente</option><option value="approved">Approuvée</option><option value="archived">Archivée</option></select></div>
              <div className="flex gap-3 pt-4 border-t"><button onClick={handleSaveVideoEdit} disabled={saving} className="flex-1 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white py-2.5 rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2 font-bold">{saving ? <><div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>Sauvegarde...</> : 'Sauvegarder'}</button><button onClick={() => setIsEditVideoModalOpen(false)} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition font-bold">Annuler</button></div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALE ÉDITION SÉRIE */}
      {/* ============================================================ */}
      {isEditSeriesModalOpen && editingSeries && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10"><h2 className="text-lg font-bold text-gray-800">Modifier la série</h2><button onClick={() => setIsEditSeriesModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-full transition"><XMarkIcon className="w-5 h-5 text-gray-500" /></button></div>
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-4">Tous les épisodes seront mis à jour avec ces informations</p>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Titre</label><input type="text" value={editingSeries.title || ''} onChange={(e) => setEditingSeries({ ...editingSeries, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={editingSeries.description || ''} onChange={(e) => setEditingSeries({ ...editingSeries, description: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1"><CurrencyDollarIcon className="w-4 h-4 inline mr-1" />Prix par épisode (coins)</label><input type="number" value={editingSeries.price || 0} onChange={(e) => setEditingSeries({ ...editingSeries, price: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" min={0} step={10} /><p className="text-xs text-gray-400 mt-1">S'applique à TOUS les épisodes</p></div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2"><TagIcon className="w-4 h-4 inline mr-1" />Catégories ({editingSeriesCategories.length} sélectionnée{editingSeriesCategories.length > 1 ? 's' : ''})</label>
                  <div className="grid grid-cols-2 gap-2">
                    {categoriesList.map((cat) => {
                      const isSelected = editingSeriesCategories.includes(cat.id)
                      return (
                        <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id, editingSeriesCategories, setEditingSeriesCategories)} className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${isSelected ? 'bg-purple-500 text-white shadow-md border-2 border-purple-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'}`}>
                          {isSelected && <CheckCircleIcon className="w-3.5 h-3.5" />}{cat.label.replace(/^[^\s]+\s/, '')}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">S'applique à TOUS les épisodes</p>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Statut</label><select value={editingSeries.status || 'approved'} onChange={(e) => setEditingSeries({ ...editingSeries, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"><option value="pending">En attente</option><option value="approved">Approuvée</option><option value="archived">Archivée</option></select></div>
              </div>
              <div className="flex gap-3 pt-6 border-t mt-6"><button onClick={handleSaveSeriesEdit} disabled={saving} className="flex-1 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white py-2.5 rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2 font-bold">{saving ? <><div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>Sauvegarde...</> : 'Sauvegarder'}</button><button onClick={() => setIsEditSeriesModalOpen(false)} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition font-bold">Annuler</button></div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALE SUPPRESSION */}
      {/* ============================================================ */}
      {isDeleteModalOpen && (actionVideo || actionSeries) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><ExclamationTriangleIcon className="w-8 h-8 text-red-500" /></div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Confirmer la suppression</h2>
              <p className="text-gray-600 mb-6">
                {actionSeries 
                  ? `Êtes-vous sûr de vouloir supprimer la série "${truncateText(actionSeries.title, 40)}" et TOUS ses épisodes ?`
                  : `Êtes-vous sûr de vouloir supprimer la vidéo "${truncateText(actionVideo!.title, 40)}" ?`
                }
              </p>
              <div className="flex gap-3">
                <button onClick={actionSeries ? confirmDeleteSeries : confirmDelete} disabled={saving} className="flex-1 bg-red-500 text-white py-2.5 rounded-lg hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2 font-bold">
                  {saving ? <><div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>Suppression...</> : 'Supprimer'}
                </button>
                <button onClick={() => { setIsDeleteModalOpen(false); setActionVideo(null); setActionSeries(null) }} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition font-bold">Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALE ARCHIVAGE */}
      {/* ============================================================ */}
      {isArchiveModalOpen && (actionVideo || actionSeries) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4"><ArchiveBoxIcon className="w-8 h-8 text-amber-500" /></div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Archiver</h2>
              <p className="text-gray-600 mb-6">
                {actionSeries 
                  ? `Archiver la série "${truncateText(actionSeries.title, 40)}" et TOUS ses épisodes ? Ils ne seront plus visibles.`
                  : `Archiver la vidéo "${truncateText(actionVideo!.title, 40)}" ? Elle ne sera plus visible.`
                }
              </p>
              <div className="flex gap-3">
                <button onClick={actionSeries ? confirmArchiveSeries : confirmArchive} disabled={saving} className="flex-1 bg-amber-500 text-white py-2.5 rounded-lg hover:bg-amber-600 transition disabled:opacity-50 flex items-center justify-center gap-2 font-bold">
                  {saving ? <><div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>Archivage...</> : 'Archiver'}
                </button>
                <button onClick={() => { setIsArchiveModalOpen(false); setActionVideo(null); setActionSeries(null) }} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition font-bold">Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALE RESTAURATION */}
      {/* ============================================================ */}
      {isRestoreModalOpen && (actionVideo || actionSeries) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><ArchiveBoxXMarkIcon className="w-8 h-8 text-green-500" /></div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Restaurer</h2>
              <p className="text-gray-600 mb-6">
                {actionSeries 
                  ? `Restaurer la série "${truncateText(actionSeries.title, 40)}" et TOUS ses épisodes ?`
                  : `Restaurer la vidéo "${truncateText(actionVideo!.title, 40)}" ?`
                }
              </p>
              <div className="flex gap-3">
                <button onClick={actionSeries ? confirmRestoreSeries : confirmRestore} disabled={saving} className="flex-1 bg-green-500 text-white py-2.5 rounded-lg hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center gap-2 font-bold">
                  {saving ? <><div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>Restauration...</> : 'Restaurer'}
                </button>
                <button onClick={() => { setIsRestoreModalOpen(false); setActionVideo(null); setActionSeries(null) }} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition font-bold">Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}