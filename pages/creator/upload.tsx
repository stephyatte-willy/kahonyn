"use client"

import { useSession } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import UserLayout from '../../components/UserLayout'
import { VideoCameraIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'
import toast, { Toaster } from 'react-hot-toast'

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

export default function CreatorUpload() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    thumbnail: '',
    category: 'popular'  // Catégorie par défaut
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    if (session.user?.role !== 'creator' && session.user?.role !== 'admin') {
      router.push('/')
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <UserLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </UserLayout>
    )
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingThumb(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload-thumbnail', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) throw new Error('Erreur upload')
      const data = await res.json()
      setForm({ ...form, thumbnail: data.url })
      toast.success('Miniature uploadée')
    } catch (error) {
      toast.error('Erreur upload miniature')
    } finally {
      setUploadingThumb(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      toast.error('Veuillez sélectionner une vidéo')
      setUploading(false)
      return
    }

    if (!file.type.startsWith('video/')) {
      toast.error('Veuillez sélectionner un fichier vidéo')
      setUploading(false)
      return
    }

    if (file.size > 500 * 1024 * 1024) {
      toast.error('La vidéo ne doit pas dépasser 500MB')
      setUploading(false)
      return
    }

    try {
      const videoFormData = new FormData()
      videoFormData.append('file', file)

      const uploadRes = await fetch('/api/upload', { 
        method: 'POST', 
        body: videoFormData 
      })
      
      if (!uploadRes.ok) throw new Error('Erreur upload vidéo')
      const { url, duration } = await uploadRes.json()

      const videoRes = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: form.title,
          description: form.description,
          thumbnail: form.thumbnail,
          url, 
          duration,
          category: form.category  // Envoyer la catégorie
        })
      })

      if (!videoRes.ok) throw new Error('Erreur sauvegarde')

      toast.success('Vidéo envoyée ! En attente de validation.')
      setTimeout(() => router.push('/creator/videos'), 2000)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la publication')
    } finally {
      setUploading(false)
    }
  }

  return (
    <UserLayout>
      <Toaster position="top-right" />
      <div className="min-h-screen py-10 px-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
                <VideoCameraIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">Uploader une vidéo</h1>
            </div>

            <form onSubmit={handleUpload} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Sélection de la catégorie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat.id })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1 ${
                        form.category === cat.id
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Miniature</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    ref={thumbInputRef}
                    onChange={handleThumbnailUpload}
                    className="flex-1 border rounded-lg p-2 text-sm"
                  />
                  {uploadingThumb && <div className="animate-spin h-5 w-5 border-b-2 border-orange-500 rounded-full"></div>}
                </div>
                {form.thumbnail && (
                  <img src={form.thumbnail} alt="Miniature" className="mt-2 w-32 h-32 object-cover rounded-lg border" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fichier vidéo</label>
                <input
                  type="file"
                  accept="video/*"
                  ref={fileInputRef}
                  className="w-full border rounded-xl p-2 text-sm"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">MP4, MOV (max 500MB)</p>
              </div>

              <button 
                type="submit" 
                disabled={uploading} 
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></div>
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="w-5 h-5" />
                    Uploader
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 p-3 bg-blue-50 rounded-xl text-xs text-blue-600">
              💡 L'administration fixera le prix et décidera si votre vidéo est simple ou en plusieurs épisodes.
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  )
}