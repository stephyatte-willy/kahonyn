"use client"

import { useSession } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import ProfileLayout from '../../components/ProfileLayout'
import { VideoCameraIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'
import toast, { Toaster } from 'react-hot-toast'

const categories = [
  { id: 'popular', label: '🔥 Populaires' },
  { id: 'anime', label: '🎌 Animé' },
  { id: 'unpublished', label: '✨ Inédit' },
  { id: 'ranking', label: '🏆 Classement' },
  { id: 'dubbed', label: '🎤 Doublés' },
  { id: 'vip', label: '👑 VIP' },
  { id: 'women', label: '👩 Femmes' },
  { id: 'men', label: '👨 Hommes' },
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
    category: 'popular'
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) { router.push('/login'); return }
    if (session.user?.role !== 'creator' && session.user?.role !== 'admin') { router.push('/'); return }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <ProfileLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
        </div>
      </ProfileLayout>
    )
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingThumb(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload-thumbnail', { method: 'POST', body: fd })
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
    if (!file) { toast.error('Sélectionnez une vidéo'); setUploading(false); return }

    try {
      const fd = new FormData()
      fd.append('file', file)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!uploadRes.ok) throw new Error('Erreur upload')
      const { url, duration } = await uploadRes.json()

      const videoRes = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, description: form.description, thumbnail: form.thumbnail, url, duration, category: form.category })
      })
      if (!videoRes.ok) throw new Error('Erreur sauvegarde')

      toast.success('Vidéo envoyée ! En attente de validation.')
      setTimeout(() => router.push('/creator/videos'), 2000)
    } catch (error) {
      toast.error('Erreur lors de la publication')
    } finally {
      setUploading(false)
    }
  }

  return (
<ProfileLayout title="Uploader une vidéo" subtitle="Partagez votre contenu" activeTab="upload">
      <Toaster position="top-right" />
      <div className="max-w-xl mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-[#D4A855]/10 shadow-sm">
          <form onSubmit={handleUpload} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">Titre</label>
              <input type="text" className="w-full px-4 py-2.5 bg-[#EDE4D8] border border-[#D4A855]/20 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-[#FF6B35] outline-none" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">Description</label>
              <textarea className="w-full px-4 py-2.5 bg-[#EDE4D8] border border-[#D4A855]/20 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-[#FF6B35] outline-none" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Catégorie</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {categories.map((cat) => (
                  <button key={cat.id} type="button" onClick={() => setForm({ ...form, category: cat.id })}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition ${
                      form.category === cat.id ? 'bg-[#FF6B35] text-white shadow-md' : 'bg-[#EDE4D8] text-gray-900 hover:bg-[#E8DCCF]'
                    }`}>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">Miniature</label>
              <div className="flex items-center gap-3">
                <input type="file" accept="image/*" ref={thumbInputRef} onChange={handleThumbnailUpload} className="flex-1 bg-[#EDE4D8] border border-[#D4A855]/20 rounded-lg p-2 text-sm font-bold" />
                {uploadingThumb && <div className="animate-spin h-5 w-5 border-b-2 border-[#FF6B35] rounded-full"></div>}
              </div>
              {form.thumbnail && <img src={form.thumbnail} alt="Miniature" className="mt-2 w-32 h-32 object-cover rounded-lg border border-[#D4A855]/20" />}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">Fichier vidéo</label>
              <input type="file" accept="video/*" ref={fileInputRef} className="w-full bg-[#EDE4D8] border border-[#D4A855]/20 rounded-xl p-2 text-sm font-bold" required />
              <p className="text-[10px] text-gray-600 font-bold mt-1">MP4, MOV (max 500MB)</p>
            </div>
            <button type="submit" disabled={uploading} className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-[#FF6B35]/20 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {uploading ? <><div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></div>Upload en cours...</> : <><CloudArrowUpIcon className="w-5 h-5" />Uploader</>}
            </button>
          </form>
        </div>
      </div>
    </ProfileLayout>
  )
}