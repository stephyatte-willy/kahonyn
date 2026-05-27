"use client"

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import UserLayout from '../../components/UserLayout'
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
  CheckCircleIcon
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
    if (session?.user?.role !== 'creator' && session?.user?.role !== 'admin') {
      router.push('/')
      return
    }
    fetchVideos()
  }, [session, sessionStatus, router])

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/creator/videos')
      const data = await res.json()
      setVideos(data)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Impossible de charger les vidéos')
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
        toast.success('Demande de suppression envoyée à l\'administration')
        fetchVideos()
        setIsDeleteModalOpen(false)
        setVideoToDelete(null)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur lors de la demande')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    }
  }

  const getStatusBadge = (video: Video) => {
    if (video.isDeleted) {
      return (
        <span className="px-2 py-1 rounded-full text-xs bg-red-600 text-white">
          ⚠️ Supprimée - Disparaît dans 24h
        </span>
      )
    }
    if (video.deletionRequested || video.status === 'deletion_requested') {
      return (
        <span className="px-2 py-1 rounded-full text-xs bg-orange-500 text-white">
          ⏳ Demande en cours
        </span>
      )
    }
    const badges: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      archived: 'bg-gray-100 text-gray-700'
    }
    const labels: Record<string, string> = {
      pending: 'En attente',
      approved: 'Publiée',
      rejected: 'Rejetée',
      archived: 'Archivée'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${badges[video.status]}`}>
        {labels[video.status]}
      </span>
    )
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}min ${secs}s`
  }

  if (sessionStatus === 'loading' || loading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </UserLayout>
    )
  }

  if (!session || (session.user?.role !== 'creator' && session.user?.role !== 'admin')) {
    return null
  }

  return (
    <UserLayout>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1A1A1A', color: '#FFF8F0', borderRadius: '16px' },
        success: { iconTheme: { primary: '#FF6B35', secondary: '#1A1A1A' } },
        error: { iconTheme: { primary: '#FF6B35', secondary: '#1A1A1A' } },
      }} />
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mes vidéos</h1>
            <p className="text-gray-500 text-sm mt-1">Gérez vos vidéos et suivez leurs performances</p>
          </div>
          <Link href="/creator/upload" className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition shadow-md">
            + Uploader une vidéo
          </Link>
        </div>

        {videos.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <VideoCameraIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Vous n'avez pas encore de vidéos</p>
            <Link href="/creator/upload" className="text-orange-500 mt-2 inline-block hover:underline">
              Publier ma première vidéo →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div 
                key={video.id} 
                className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${
                  video.isDeleted ? 'opacity-50 grayscale' : 'hover:shadow-lg'
                }`}
              >
                <div 
                  className={`relative h-44 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center cursor-pointer group ${
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
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration)}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 line-clamp-1">{video.title}</h3>
                  <p className="text-orange-500 font-bold text-lg mt-1">{video.price.toLocaleString()} FCFA</p>
                  <div className="flex gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <EyeIcon className="w-4 h-4" /> {video.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <ChartBarIcon className="w-4 h-4" /> {video.purchases} achats
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                    {!video.isDeleted && !video.deletionRequested && video.status !== 'deletion_requested' && (
                      <>
                        <button
                          onClick={() => handleViewVideo(video)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 text-blue-600 border border-blue-600 rounded-lg text-sm hover:bg-blue-50 transition"
                        >
                          <EyeIcon className="w-4 h-4" />
                          Voir
                        </button>
                        <button
                          onClick={() => handleDeleteClick(video)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 text-red-600 border border-red-600 rounded-lg text-sm hover:bg-red-50 transition"
                        >
                          <TrashIcon className="w-4 h-4" />
                          Supprimer
                        </button>
                      </>
                    )}
                    {video.deletionRequested && (
                      <div className="flex-1 flex items-center justify-center gap-1 py-2 text-orange-600 bg-orange-50 rounded-lg text-sm">
                        <ClockIcon className="w-4 h-4" />
                        Demande en attente
                      </div>
                    )}
                    {video.isDeleted && (
                      <div className="flex-1 flex items-center justify-center gap-1 py-2 text-gray-400 bg-gray-100 rounded-lg text-sm">
                        <CheckCircleIcon className="w-4 h-4" />
                        Supprimée
                      </div>
                    )}
                  </div>
                  {video.isDeleted && video.willDisappearAt && (
                    <p className="text-xs text-gray-400 text-center mt-2">
                      Disparaîtra le {new Date(video.willDisappearAt).toLocaleDateString()} à {new Date(video.willDisappearAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Visionnage vidéo */}
      {isViewModalOpen && selectedVideo && !selectedVideo.isDeleted && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedVideo.title}</h2>
                <p className="text-sm text-gray-500">Durée: {formatDuration(selectedVideo.duration)}</p>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <video controls autoPlay className="w-full rounded-lg" style={{ maxHeight: '60vh' }}>
                <source src={selectedVideo.url} type="video/mp4" />
                Votre navigateur ne supporte pas la vidéo
              </video>
              {selectedVideo.description && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-sm">{selectedVideo.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {isDeleteModalOpen && videoToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fadeInUp">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Confirmer la suppression</h2>
              <p className="text-gray-600 mb-4">
                Êtes-vous sûr de vouloir supprimer la vidéo<br />
                <span className="font-semibold">"{videoToDelete.title}"</span> ?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Une demande sera envoyée à l'administration. La vidéo sera supprimée après validation.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
                >
                  Supprimer
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  )
}