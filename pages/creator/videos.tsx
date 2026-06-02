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
  ArrowUpTrayIcon
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
  views: number
  purchases: number
  status: string
  deletionRequested: boolean
  isDeleted: boolean
  willDisappearAt: string | null
  createdAt: string
}

export default function CreatorVideos() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null)

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!session) { router.push('/login'); return }
    if (session.user?.role !== 'creator' && session.user?.role !== 'admin') { router.push('/'); return }
    fetchVideos()
  }, [session, sessionStatus, router])

const fetchVideos = async () => {
  try {
    const res = await fetch('/api/creator/videos')
    const data = await res.json()
    
    // S'assurer que data est un tableau
    if (Array.isArray(data)) {
      setVideos(data)
    } else if (data.videos && Array.isArray(data.videos)) {
      // Si l'API retourne { videos: [...] }
      setVideos(data.videos)
    } else {
      console.error('Format de données invalide:', data)
      setVideos([])
    }
  } catch (error) {
    console.error('Erreur:', error)
    toast.error('Impossible de charger les vidéos')
    setVideos([]) // Toujours définir un tableau vide en cas d'erreur
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

  const getStatusBadge = (video: Video) => {
    if (video.isDeleted) {
      return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-red-600 text-white">⚠️ Supprimée</span>
    }
    if (video.deletionRequested || video.status === 'deletion_requested') {
      return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-orange-500 text-white">⏳ En cours</span>
    }
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
    return <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${badges[video.status]}`}>{labels[video.status]}</span>
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
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1A1A35', color: '#FFF', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' },
        success: { iconTheme: { primary: '#FF6B35', secondary: '#1A1A35' } },
        error: { iconTheme: { primary: '#EF4444', secondary: '#1A1A35' } },
      }} />
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600 font-bold">{videos.length} vidéo{videos.length !== 1 ? 's' : ''}</p>
          <Link href="/creator/upload" className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-[#FF6B35]/20 transition flex items-center gap-2">
            <ArrowUpTrayIcon className="w-4 h-4" />
            Uploader
          </Link>
        </div>

        {videos.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 text-center border border-[#D4A855]/10 shadow-sm">
            <VideoCameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-bold">Vous n'avez pas encore de vidéos</p>
            <Link href="/creator/upload" className="text-[#FF6B35] font-bold mt-2 inline-block hover:underline">
              Publier ma première vidéo →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div 
                key={video.id} 
                className={`bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden border border-[#D4A855]/10 shadow-sm transition-all duration-300 ${
                  video.isDeleted ? 'opacity-50 grayscale' : 'hover:shadow-lg hover:border-[#FF6B35]/20'
                }`}
              >
                <div 
                  className={`relative h-44 bg-[#EDE4D8] flex items-center justify-center cursor-pointer group ${
                    video.isDeleted ? 'pointer-events-none' : ''
                  }`}
                  onClick={() => handleViewVideo(video)}
                >
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <VideoCameraIcon className="w-12 h-12 text-gray-400" />
                  )}
                  {!video.isDeleted && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <PlayIcon className="w-12 h-12 text-white" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(video)}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                    {formatDuration(video.duration)}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-sm text-gray-900 line-clamp-1">{video.title}</h3>
                  <p className="text-[#FF6B35] font-bold text-lg mt-1">{video.price.toLocaleString()} FCFA</p>
                  <div className="flex gap-4 mt-3 text-xs text-gray-600 font-bold">
                    <span className="flex items-center gap-1">
                      <EyeIcon className="w-4 h-4" /> {video.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <ChartBarIcon className="w-4 h-4" /> {video.purchases} achats
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-[#D4A855]/10">
                    {!video.isDeleted && !video.deletionRequested && video.status !== 'deletion_requested' && (
                      <>
                        <button
                          onClick={() => handleViewVideo(video)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 text-[#FF6B35] border border-[#FF6B35]/30 rounded-lg text-xs font-bold hover:bg-[#FF6B35]/10 transition"
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                          Voir
                        </button>
                        <button
                          onClick={() => handleDeleteClick(video)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 text-red-500 border border-red-300 rounded-lg text-xs font-bold hover:bg-red-50 transition"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                          Supprimer
                        </button>
                      </>
                    )}
                    {video.deletionRequested && (
                      <div className="flex-1 flex items-center justify-center gap-1 py-2 text-orange-600 bg-orange-50 rounded-lg text-xs font-bold">
                        <ClockIcon className="w-3.5 h-3.5" />
                        Demande en attente
                      </div>
                    )}
                    {video.isDeleted && (
                      <div className="flex-1 flex items-center justify-center gap-1 py-2 text-gray-400 bg-gray-100 rounded-lg text-xs font-bold">
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                        Supprimée
                      </div>
                    )}
                  </div>
                  {video.isDeleted && video.willDisappearAt && (
                    <p className="text-[10px] text-gray-500 text-center mt-2 font-bold">
                      Disparaît le {new Date(video.willDisappearAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Visionnage */}
      {isViewModalOpen && selectedVideo && !selectedVideo.isDeleted && (
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
              {selectedVideo.description && (
                <div className="mt-4 p-3 bg-white/5 rounded-lg">
                  <p className="text-white/80 text-sm font-bold">{selectedVideo.description}</p>
                </div>
              )}
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
                <button onClick={confirmDelete} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-bold hover:bg-red-600 transition">
                  Supprimer
                </button>
                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 bg-white/10 text-white/80 py-2.5 rounded-xl font-bold hover:bg-white/20 transition">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProfileLayout>
  )
}