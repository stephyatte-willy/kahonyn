"use client"

import { useSession } from 'next-auth/react'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import ProfileLayout from '../../components/ProfileLayout'
import { PlusIcon, EyeIcon, VideoCameraIcon, CloudArrowUpIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Series {
  id: string; title: string; description: string; coverImage: string
  status: string; masterVideoUrl: string | null; createdAt: string
}

export default function CreatorSeries() {
  const { data: session } = useSession()
  const router = useRouter()
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState<Series | null>(null)
  const [uploading, setUploading] = useState(false)
  const [newSeries, setNewSeries] = useState({ title: '', description: '', coverImage: '' })
  const [creating, setCreating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if ((session?.user as any)?.role !== 'creator') { router.push('/'); return }; fetchSeries() }, [session, router])

  const fetchSeries = async () => {
    try { const res = await fetch('/api/creator/series'); const data = await res.json(); setSeries(Array.isArray(data) ? data : []) }
    catch { toast.error('Impossible de charger les séries') } finally { setLoading(false) }
  }

  const handleCreateSeries = async () => {
    if (!newSeries.title) { toast.error('Veuillez entrer un titre'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/creator/series', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSeries) })
      if (res.ok) { toast.success('Série créée'); setShowCreateModal(false); setNewSeries({ title: '', description: '', coverImage: '' }); fetchSeries() }
      else { const data = await res.json(); toast.error(data.error || 'Erreur') }
    } catch { toast.error('Erreur réseau') } finally { setCreating(false) }
  }

  const handleUploadMaster = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file || !showUploadModal) { toast.error('Veuillez sélectionner un fichier'); return }
    if (!file.type.startsWith('video/')) { toast.error('Veuillez sélectionner un fichier vidéo'); return }
    setUploading(true)
    const formData = new FormData(); formData.append('file', file); formData.append('seriesId', showUploadModal.id)
    try {
      const res = await fetch('/api/creator/upload-master', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) { toast.success('Film uploadé! En attente de validation admin'); setShowUploadModal(null); fetchSeries() }
      else { toast.error(data.error || 'Erreur') }
    } catch { toast.error('Erreur réseau') } finally { setUploading(false) }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = { pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20', published: 'bg-green-500/10 text-green-400 border-green-500/20', rejected: 'bg-red-500/10 text-red-400 border-red-500/20' }
    const labels: Record<string, string> = { pending: 'En attente', approved: 'Approuvée', published: 'Publiée', rejected: 'Rejetée' }
    return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${badges[status] || 'bg-white/[0.04] text-white/60'}`}>{labels[status] || status}</span>
  }

  if (loading) {
    return <ProfileLayout title="Mes séries" activeTab="videos"><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div></div></ProfileLayout>
  }

  return (
    <ProfileLayout title="Mes séries" subtitle="Créez une série et uploadez votre film complet" activeTab="videos">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white px-5 py-2.5 rounded-xl font-bold hover:shadow-lg hover:shadow-[#FF6B35]/20 transition flex items-center gap-2">
            <PlusIcon className="w-5 h-5" /> Nouvelle série
          </button>
        </div>

        {series.length === 0 ? (
          <div className="bg-[#1A1A2E] rounded-2xl p-12 text-center border border-white/[0.04]">
            <VideoCameraIcon className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <p className="text-white/50 font-medium">Vous n'avez pas encore de série</p>
            <button onClick={() => setShowCreateModal(true)} className="text-[#FF6B35] font-bold mt-2 hover:underline">Créer ma première série →</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {series.map((serie) => (
              <div key={serie.id} className="bg-[#1A1A2E] rounded-2xl overflow-hidden border border-white/[0.04] hover:border-[#FF6B35]/30 transition-all duration-300 hover:shadow-2xl hover:shadow-[#FF6B35]/5">
                <div className="relative h-44 bg-gradient-to-br from-[#1A1A2E] to-[#2A2A4E] flex items-center justify-center">
                  {serie.coverImage ? <img src={serie.coverImage} alt={serie.title} className="w-full h-full object-cover" /> : <VideoCameraIcon className="w-14 h-14 text-white/10" />}
                  <div className="absolute top-3 right-3">{getStatusBadge(serie.status)}</div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-white text-base">{serie.title}</h3>
                  <p className="text-sm text-white/50 mt-1 line-clamp-2">{serie.description || 'Aucune description'}</p>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-white/[0.04]">
                    {serie.status === 'pending' && !serie.masterVideoUrl && (
                      <button onClick={() => setShowUploadModal(serie)} className="flex-1 bg-[#FF6B35] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#FF8C5A] transition">Uploader le film</button>
                    )}
                    <button onClick={() => router.push(`/creator/series/${serie.id}`)} className="flex-1 text-white/80 border border-white/[0.08] py-2.5 rounded-xl text-sm font-bold hover:bg-white/[0.04] transition">Détails</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal création série */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-[#1A1A2E] rounded-2xl max-w-md w-full p-6 border border-white/[0.06] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-white">Nouvelle série</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/[0.04] rounded-full transition"><XMarkIcon className="w-5 h-5 text-white" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold text-white/80 mb-1.5">Titre *</label><input type="text" value={newSeries.title} onChange={(e) => setNewSeries({ ...newSeries, title: e.target.value })} className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white font-medium focus:ring-2 focus:ring-[#FF6B35]/30 outline-none placeholder-white/20" placeholder="Titre de la série" /></div>
              <div><label className="block text-sm font-semibold text-white/80 mb-1.5">Description</label><textarea value={newSeries.description} onChange={(e) => setNewSeries({ ...newSeries, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white font-medium focus:ring-2 focus:ring-[#FF6B35]/30 outline-none placeholder-white/20" placeholder="Description de la série" /></div>
              <div><label className="block text-sm font-semibold text-white/80 mb-1.5">URL image couverture</label><input type="text" value={newSeries.coverImage} onChange={(e) => setNewSeries({ ...newSeries, coverImage: e.target.value })} className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white font-medium focus:ring-2 focus:ring-[#FF6B35]/30 outline-none placeholder-white/20" placeholder="https://..." /></div>
              <div className="flex gap-3 pt-4">
                <button onClick={handleCreateSeries} disabled={creating} className="flex-1 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white py-2.5 rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50">{creating ? 'Création...' : 'Créer'}</button>
                <button onClick={() => setShowCreateModal(false)} className="flex-1 bg-white/[0.04] text-white/80 py-2.5 rounded-xl font-bold hover:bg-white/[0.08] transition">Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal upload film */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowUploadModal(null)}>
          <div className="bg-[#1A1A2E] rounded-2xl max-w-md w-full p-6 border border-white/[0.06] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-white">Uploader le film</h2>
              <button onClick={() => setShowUploadModal(null)} className="p-2 hover:bg-white/[0.04] rounded-full transition"><XMarkIcon className="w-5 h-5 text-white" /></button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-white/60">Série: <span className="font-semibold text-white">{showUploadModal.title}</span></p>
              <div className="border-2 border-dashed border-white/[0.08] rounded-xl p-8 text-center hover:border-[#FF6B35]/30 transition cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <input type="file" accept="video/*" ref={fileInputRef} className="hidden" />
                <VideoCameraIcon className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/50 text-sm mb-2">Uploadez votre film complet</p>
                <p className="text-[#FF6B35] text-sm font-medium hover:underline">Choisir un fichier</p>
                <p className="text-xs text-white/30 mt-2">MP4, MOV, AVI (max 500MB)</p>
              </div>
              <button onClick={handleUploadMaster} disabled={uploading} className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white py-2.5 rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
                {uploading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Upload...</> : <><CloudArrowUpIcon className="w-5 h-5" />Uploader</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProfileLayout>
  )
}