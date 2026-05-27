"use client"

import { useSession } from 'next-auth/react'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import UserLayout from '../../components/UserLayout'
import { 
  PlusIcon, 
  EyeIcon, 
  VideoCameraIcon,
  CloudArrowUpIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import toast, { Toaster } from 'react-hot-toast'

interface Series {
  id: string
  title: string
  description: string
  coverImage: string
  status: string
  masterVideoUrl: string | null
  createdAt: string
}

export default function CreatorSeries() {
  const { data: session } = useSession()
  const router = useRouter()
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState<Series | null>(null)
  const [uploading, setUploading] = useState(false)
  const [newSeries, setNewSeries] = useState({
    title: '',
    description: '',
    coverImage: ''
  })
  const [creating, setCreating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (session?.user?.role !== 'creator') {
      router.push('/')
      return
    }
    fetchSeries()
  }, [session, router])

  const fetchSeries = async () => {
    try {
      const res = await fetch('/api/creator/series')
      const data = await res.json()
      setSeries(data)
    } catch (error) {
      toast.error('Impossible de charger les séries')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSeries = async () => {
    if (!newSeries.title) {
      toast.error('Veuillez entrer un titre')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/creator/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSeries)
      })

      if (res.ok) {
        toast.success('Série créée')
        setShowCreateModal(false)
        setNewSeries({ title: '', description: '', coverImage: '' })
        fetchSeries()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    } finally {
      setCreating(false)
    }
  }

  const handleUploadMaster = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file || !showUploadModal) {
      toast.error('Veuillez sélectionner un fichier')
      return
    }

    if (!file.type.startsWith('video/')) {
      toast.error('Veuillez sélectionner un fichier vidéo')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('seriesId', showUploadModal.id)

    try {
      const res = await fetch('/api/creator/upload-master', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Film uploadé! En attente de validation admin')
        setShowUploadModal(null)
        fetchSeries()
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    } finally {
      setUploading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">En attente</span>
      case 'approved':
        return <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">Approuvée</span>
      case 'published':
        return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">Publiée</span>
      case 'rejected':
        return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Rejetée</span>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mes séries</h1>
            <p className="text-gray-500 text-sm mt-1">Créez une série et uploadez votre film complet</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Nouvelle série
          </button>
        </div>

        {series.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <VideoCameraIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Vous n'avez pas encore de série</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-orange-500 mt-2 inline-block hover:underline"
            >
              Créer ma première série →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {series.map((serie) => (
              <div key={serie.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
                <div className="relative h-40 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                  {serie.coverImage ? (
                    <img src={serie.coverImage} alt={serie.title} className="w-full h-full object-cover" />
                  ) : (
                    <VideoCameraIcon className="w-12 h-12 text-gray-400" />
                  )}
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(serie.status)}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800">{serie.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{serie.description || 'Aucune description'}</p>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                    {serie.status === 'pending' && !serie.masterVideoUrl && (
                      <button
                        onClick={() => setShowUploadModal(serie)}
                        className="flex-1 text-center bg-orange-500 text-white py-2 rounded-lg text-sm hover:bg-orange-600 transition"
                      >
                        Uploader le film
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/creator/series/${serie.id}`)}
                      className="flex-1 text-center text-blue-600 border border-blue-600 py-2 rounded-lg text-sm hover:bg-blue-50 transition"
                    >
                      Détails
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal création série */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Nouvelle série</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre *</label>
                <input
                  type="text"
                  value={newSeries.title}
                  onChange={(e) => setNewSeries({ ...newSeries, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Titre de la série"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newSeries.description}
                  onChange={(e) => setNewSeries({ ...newSeries, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Description de la série"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL de l'image de couverture</label>
                <input
                  type="text"
                  value={newSeries.coverImage}
                  onChange={(e) => setNewSeries({ ...newSeries, coverImage: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateSeries}
                  disabled={creating}
                  className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  {creating ? 'Création...' : 'Créer'}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal upload film */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Uploader le film</h2>
              <button onClick={() => setShowUploadModal(null)} className="p-1">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Série: <span className="font-semibold">{showUploadModal.title}</span>
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="video/*"
                  ref={fileInputRef}
                  className="hidden"
                />
                <VideoCameraIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm mb-2">Uploadez votre film complet</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-orange-500 text-sm hover:underline"
                >
                  Choisir un fichier
                </button>
                <p className="text-xs text-gray-400 mt-2">MP4, MOV, AVI (max 500MB)</p>
              </div>
              <button
                onClick={handleUploadMaster}
                disabled={uploading}
                className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Upload...
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="w-4 h-4" />
                    Uploader
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  )
}