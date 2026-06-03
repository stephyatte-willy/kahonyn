"use client"

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import ProfileLayout from '../../components/ProfileLayout'
import Link from 'next/link'
import { 
  EyeIcon, 
  ChartBarIcon, 
  TrashIcon, 
  VideoCameraIcon,
  PlayIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowUpTrayIcon,
  FilmIcon,
  QueueListIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

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
}

interface Video {
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
  deletionRequested: boolean
  isDeleted: boolean
  willDisappearAt: string | null
  seriesId: string | null
  createdAt: string
  episodes?: Episode[]
  isSeriesMaster?: boolean
  seriesTitle?: string
  totalEpisodes?: number
}

export default function CreatorVideos() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [series, setSeries] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false)
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null)
  const [selectedSeries, setSelectedSeries] = useState<Video | null>(null)
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)
  const [currentVideoUrl, setCurrentVideoUrl] = useState('')

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!session) { router.push('/login'); return }
    if (session.user?.role !== 'creator' && session.user?.role !== 'admin') { router.push('/'); return }
    fetchVideos()
  }, [session, sessionStatus, router])

  const fetchVideos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/creator/videos')
      const data = await res.json()
      
      if (Array.isArray(data)) {
        // Séparer les séries des vidéos simples
        const seriesList = data.filter((v: Video) => v.isSeriesMaster)
        const simpleVideos = data.filter((v: Video) => !v.isSeriesMaster && !v.seriesId)
        setSeries(seriesList)
        setVideos(simpleVideos)
      } else {
        setVideos([])
        setSeries([])
      }
    } catch (error) {
      toast.error('Impossible de charger les vidéos')
      setVideos([])
      setSeries([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewVideo = (video: Video) => {
    if (video.isDeleted) {
      toast.error('Cette vidéo a été supprimée')
      return
    }
    setSelectedVideo(video)
    setIsViewModalOpen(true)
  }

  const handleViewSeries = (serie: Video) => {
    setSelectedSeries(serie)
    setSelectedEpisode(serie.episodes?.[0] || null)
    setCurrentVideoUrl(serie.episodes?.[0]?.url || '')
    setIsSeriesModalOpen(true)
  }

  const handlePlayEpisode = (episode: Episode) => {
    setSelectedEpisode(episode)
    setCurrentVideoUrl(episode.url)
  }

  const handleDeleteClick = (video: Video) => {
    if (video.deletionRequested || video.isDeleted) {
      toast.error('Une demande est déjà en cours')
      return
    }
    setVideoToDelete(video)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!videoToDelete) return
    try {
      const res = await fetch('/api/creator/request-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: videoToDelete.id })
      })
      if (res.ok) {
        toast.success('Demande de suppression envoyée')
        fetchVideos()
        setIsDeleteModalOpen(false)
        setVideoToDelete(null)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    }
  }

  const getStatusBadge = (status: string, isDeleted?: boolean, deletionRequested?: boolean) => {
    if (isDeleted) return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-red-600 text-white">⚠️ Supprimée</span>
    if (deletionRequested) return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-orange-500 text-white">⏳ En cours</span>
    
    const badges: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      archived: 'bg-gray-100 text-gray-800'
    }
    const labels: Record<string, string> = {
      pending: 'En attente',
      approved: 'Publiée',
      rejected: 'Rejetée',
      archived: 'Archivée'
    }
    return <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${badges[status] || 'bg-gray-100'}`}>{labels[status] || status}</span>
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}min ${secs}s`
  }

  if (sessionStatus === 'loading' || loading) {
    return (
      <ProfileLayout title="Mes vidéos" activeTab="videos">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
        </div>
      </ProfileLayout>
    )
  }

  if (!session || (session.user?.role !== 'creator' && session.user?.role !== 'admin')) return null

  return (
    <ProfileLayout title="Mes vidéos" subtitle="Gérez vos vidéos et suivez leurs performances" activeTab="videos">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600 font-bold">
            {videos.length + series.length} contenu{videos.length + series.length !== 1 ? 's' : ''}
          </p>
          <Link href="/creator/upload" className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-[#FF6B35]/20 transition flex items-center gap-2">
            <ArrowUpTrayIcon className="w-4 h-4" />
            Uploader
          </Link>
        </div>

        {/* Séries (groupées) */}
        {series.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FilmIcon className="w-5 h-5 text-purple-500" />
              Séries ({series.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {series.map((serie) => (
                <div
                  key={serie.id}
                  onClick={() => handleViewSeries(serie)}
                  className="bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden border border-[#D4A855]/10 shadow-sm hover:shadow-lg hover:border-[#FF6B35]/20 transition-all cursor-pointer group"
                >
                  <div className="relative aspect-video bg-[#EDE4D8] flex items-center justify-center">
                    {serie.thumbnail ? (
                      <img src={serie.thumbnail} alt={serie.title} className="w-full h-full object-cover" />
                    ) : (
                      <FilmIcon className="w-8 h-8 text-gray-400" />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <PlayIcon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute top-1.5 left-1.5 bg-purple-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                      {serie.totalEpisodes || serie.episodes?.length || 0} ép.
                    </div>
                    <div className="absolute top-1.5 right-1.5">
                      {getStatusBadge(serie.status, serie.isDeleted, serie.deletionRequested)}
                    </div>
                  </div>
                  <div className="p-2">
                    <h3 className="font-bold text-[11px] text-gray-900 line-clamp-1">{serie.seriesTitle || serie.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-[9px] text-gray-600 font-bold">
                      <span>🎬 Série</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vidéos simples */}
        {videos.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <VideoCameraIcon className="w-5 h-5 text-green-500" />
              Vidéos simples ({videos.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {videos.map((video) => (
                <div key={video.id} className="bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden border border-[#D4A855]/10 shadow-sm hover:shadow-lg hover:border-[#FF6B35]/20 transition-all group">
                  <div 
                    className="relative aspect-video bg-[#EDE4D8] flex items-center justify-center cursor-pointer"
                    onClick={() => handleViewVideo(video)}
                  >
                    {video.thumbnail ? (
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                      <VideoCameraIcon className="w-8 h-8 text-gray-400" />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <PlayIcon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute top-1.5 right-1.5">
                      {getStatusBadge(video.status, video.isDeleted, video.deletionRequested)}
                    </div>
                    <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      {formatDuration(video.duration)}
                    </div>
                  </div>
                  <div className="p-2">
                    <h3 className="font-bold text-[11px] text-gray-900 line-clamp-1">{video.title}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2 text-[9px] text-gray-600 font-bold">
                        <span className="flex items-center gap-0.5"><EyeIcon className="w-3 h-3" />{video.views || 0}</span>
                        <span className="flex items-center gap-0.5"><ChartBarIcon className="w-3 h-3" />{video.purchases || 0}</span>
                      </div>
                    </div>
                    {!video.isDeleted && !video.deletionRequested && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(video); }}
                        className="mt-2 w-full py-1.5 text-[10px] font-bold text-red-500 border border-red-300 rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-1"
                      >
                        <TrashIcon className="w-3 h-3" />
                        Supprimer
                      </button>
                    )}
                    {video.deletionRequested && (
                      <div className="mt-2 w-full py-1.5 text-[10px] font-bold text-orange-600 bg-orange-50 rounded-lg text-center">
                        ⏳ Demande en attente
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aucun contenu */}
        {videos.length === 0 && series.length === 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 text-center border border-[#D4A855]/10 shadow-sm">
            <VideoCameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-bold">Vous n'avez pas encore de vidéos</p>
            <Link href="/creator/upload" className="text-[#FF6B35] font-bold mt-2 inline-block hover:underline">
              Publier ma première vidéo →
            </Link>
          </div>
        )}
      </div>

      {/* Modal Visionnage vidéo simple */}
      {isViewModalOpen && selectedVideo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A35] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/10">
            <div className="flex justify-between items-center p-4 border-b border-white/10">
              <div>
                <h2 className="text-lg font-bold text-white">{selectedVideo.title}</h2>
                <p className="text-sm text-white/60 font-bold">Durée: {formatDuration(selectedVideo.duration)}</p>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition">
                <XMarkIcon className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-4">
              <video controls autoPlay className="w-full rounded-lg" style={{ maxHeight: '60vh' }}>
                <source src={selectedVideo.url} type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visionnage série avec épisodes */}
      {isSeriesModalOpen && selectedSeries && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A35] rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/10">
            <div className="flex justify-between items-center p-4 border-b border-white/10 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white">{selectedSeries.seriesTitle || selectedSeries.title}</h2>
                <p className="text-sm text-white/60 font-bold">{selectedSeries.episodes?.length || 0} épisodes</p>
              </div>
              <button onClick={() => setIsSeriesModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition">
                <XMarkIcon className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              {/* Zone vidéo */}
              <div className="md:w-2/3 p-4 bg-black flex flex-col">
                <video 
                  key={currentVideoUrl}
                  controls 
                  autoPlay
                  className="w-full rounded-lg"
                  style={{ maxHeight: '50vh' }}
                  onEnded={() => {
                    if (selectedEpisode && selectedSeries?.episodes) {
                      const currentIndex = selectedSeries.episodes.findIndex(ep => ep.id === selectedEpisode.id)
                      const nextEpisode = selectedSeries.episodes[currentIndex + 1]
                      if (nextEpisode) {
                        setSelectedEpisode(nextEpisode)
                        setCurrentVideoUrl(nextEpisode.url)
                      }
                    }
                  }}
                >
                  <source src={currentVideoUrl} type="video/mp4" />
                </video>
                {selectedEpisode && (
                  <div className="mt-3 text-white">
                    <h3 className="font-semibold text-sm">Épisode {selectedEpisode.episodeNumber} - {selectedEpisode.title}</h3>
                  </div>
                )}
              </div>
              
              {/* Liste des épisodes */}
              <div className="md:w-1/3 p-4 bg-gray-900 overflow-y-auto max-h-[calc(90vh-120px)]">
                <h3 className="font-semibold text-white mb-3 sticky top-0 bg-gray-900 py-2">Épisodes</h3>
                <div className="space-y-1.5">
                  {(selectedSeries.episodes || []).map((episode) => {
                    const isCurrent = selectedEpisode?.id === episode.id
                    return (
                      <div
                        key={episode.id}
                        onClick={() => handlePlayEpisode(episode)}
                        className={`p-2.5 rounded-lg cursor-pointer transition flex items-center gap-3 ${
                          isCurrent
                            ? 'bg-[#FF6B35]/20 border border-[#FF6B35]/50'
                            : 'bg-white/5 hover:bg-white/10 border border-white/5'
                        }`}
                      >
                        <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                          {episode.thumbnail ? (
                            <img src={episode.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <PlayIcon className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs text-white truncate">Épisode {episode.episodeNumber}</p>
                          <p className="text-[10px] text-gray-400">{formatDuration(episode.duration)}</p>
                        </div>
                        {isCurrent && <span className="text-[10px] bg-[#FF6B35] text-white px-1.5 py-0.5 rounded-full">En cours</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {isDeleteModalOpen && videoToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A35] rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Confirmer la suppression</h2>
              <p className="text-white/70 font-bold mb-4">
                Supprimer <span className="text-white">"{videoToDelete.title}"</span> ?
              </p>
              <p className="text-sm text-white/50 font-bold mb-6">
                Une demande sera envoyée à l'administration.
              </p>
              <div className="flex gap-3">
                <button onClick={confirmDelete} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-bold hover:bg-red-600 transition">Supprimer</button>
                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 bg-white/10 text-white/80 py-2.5 rounded-xl font-bold hover:bg-white/20 transition">Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProfileLayout>
  )
}