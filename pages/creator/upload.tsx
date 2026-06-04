"use client"

import { useSession } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import ProfileLayout from '../../components/ProfileLayout'
import { CloudArrowUpIcon, EyeIcon, CheckCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function CreatorUpload() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null)
  const [uploadedDuration, setUploadedDuration] = useState<number>(0)
  const [showPreview, setShowPreview] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const xhrRef = useRef<XMLHttpRequest | null>(null)
  const [form, setForm] = useState({ title: '', description: '', thumbnail: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbInputRef = useRef<HTMLInputElement>(null)
  const videoPreviewRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isUploading) { e.preventDefault(); e.returnValue = 'Upload en cours. Voulez-vous vraiment quitter ?'; return e.returnValue }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isUploading])

  useEffect(() => {
    if (status === 'loading') return
    if (!session) { router.push('/login'); return }
    if ((session.user as any)?.role !== 'creator' && (session.user as any)?.role !== 'admin') { router.push('/'); return }
  }, [session, status, router])

  if (status === 'loading') return <ProfileLayout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div></div></ProfileLayout>

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingThumb(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/upload-thumbnail', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Erreur upload')
      const data = await res.json(); setForm({ ...form, thumbnail: data.url }); toast.success('Miniature uploadée')
    } catch { toast.error('Erreur upload miniature') } finally { setUploadingThumb(false) }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 500 * 1024 * 1024) { toast.error('La vidéo ne doit pas dépasser 500MB'); return }
    if (!file.type.startsWith('video/')) { toast.error('Veuillez sélectionner un fichier vidéo valide'); return }
    setUploadedFile(file); setUploadedVideoUrl(URL.createObjectURL(file)); setShowPreview(false); setUploadProgress(0); setUploadSpeed('')
  }

  const handleUploadVideo = async () => {
    const file = uploadedFile; if (!file) { toast.error('Sélectionnez une vidéo d\'abord'); return }
    setIsUploading(true); setUploadProgress(0); setUploadSpeed('Préparation...')
    try {
      const signRes = await fetch('/api/cloudinary/sign-upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      if (!signRes.ok) throw new Error('Erreur configuration')
      const signData = await signRes.json()
      const fd = new FormData(); fd.append('file', file); fd.append('upload_preset', signData.uploadPreset); fd.append('folder', signData.folder)
      const startTime = Date.now()
      const xhr = new XMLHttpRequest(); xhrRef.current = xhr
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100); setUploadProgress(percentComplete)
          const elapsed = (Date.now() - startTime) / 1000
          if (elapsed > 0.5) {
            const speed = e.loaded / elapsed
            let speedText = speed > 1024 * 1024 ? `${(speed / (1024 * 1024)).toFixed(1)} MB/s` : `${(speed / 1024).toFixed(0)} KB/s`
            const remainingSeconds = (e.total - e.loaded) / speed
            speedText += remainingSeconds > 60 ? ` • ~${Math.ceil(remainingSeconds / 60)} min` : remainingSeconds > 3 ? ` • ~${Math.ceil(remainingSeconds)}s` : ''
            setUploadSpeed(speedText)
          }
        }
      })
      xhr.addEventListener('load', () => {
        setIsUploading(false); xhrRef.current = null
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText); setUploadedVideoUrl(response.secure_url); setUploadedDuration(response.duration || 0); setUploadProgress(100)
            toast.success('Vidéo uploadée avec succès !'); setShowPreview(true)
          } catch { toast.error('Erreur traitement réponse') }
        } else {
          let errorMsg = 'Erreur upload'; try { const response = JSON.parse(xhr.responseText); errorMsg = response.error?.message || errorMsg } catch (e) {}
          toast.error(errorMsg)
        }
      })
      xhr.addEventListener('error', () => { setIsUploading(false); xhrRef.current = null; toast.error('Erreur réseau. Vérifiez votre connexion.') })
      xhr.addEventListener('abort', () => { setIsUploading(false); xhrRef.current = null; setUploadProgress(0); setUploadSpeed(''); toast('Upload annulé', { icon: '⚠️' }) })
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/video/upload`
      xhr.open('POST', cloudinaryUrl); xhr.send(fd)
    } catch (error: any) { setIsUploading(false); toast.error(error.message || 'Erreur lors de l\'upload') }
  }

  const handleCancelUpload = () => { if (xhrRef.current) xhrRef.current.abort() }

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error('Le titre est requis'); return }
    if (!uploadedVideoUrl || uploadedVideoUrl.startsWith('blob:')) { toast.error('Veuillez d\'abord uploader la vidéo'); return }
    setUploading(true)
    try {
      const videoRes = await fetch('/api/videos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: form.title.trim(), description: form.description.trim(), thumbnail: form.thumbnail, url: uploadedVideoUrl, duration: uploadedDuration, category: 'popular' }) })
      if (!videoRes.ok) { const errData = await videoRes.json(); throw new Error(errData.error || 'Erreur sauvegarde') }
      toast.success('Vidéo envoyée ! En attente de validation.'); setTimeout(() => router.push('/creator/videos'), 1500)
    } catch (error: any) { toast.error(error.message || 'Erreur lors de la publication') } finally { setUploading(false) }
  }

  const formatDuration = (seconds: number) => { if (!seconds) return '0:00'; const mins = Math.floor(seconds / 60); const secs = Math.floor(seconds % 60); return `${mins}:${secs.toString().padStart(2, '0')}` }
  const formatFileSize = (bytes: number) => bytes < 1024 ? bytes + ' B' : bytes < 1024 * 1024 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / (1024 * 1024)).toFixed(2) + ' MB'

  return (
    <ProfileLayout title="Uploader une vidéo" subtitle="Partagez votre contenu" activeTab="upload">
      <div className="max-w-xl mx-auto space-y-4">
        {isUploading && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 animate-pulse">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div><p className="text-sm font-bold text-amber-400">🚀 Upload en cours...</p><p className="text-xs text-amber-300/80 mt-0.5">Ne fermez pas cette page. La progression est en temps réel.</p></div>
          </div>
        )}

        <div className="bg-[#1A1A2E] rounded-2xl p-6 border border-white/[0.04]">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-1.5">Titre <span className="text-red-400">*</span></label>
              <input type="text" className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white font-medium focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]/50 outline-none disabled:opacity-40 placeholder-white/30" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Titre de votre vidéo" disabled={isUploading} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-1.5">Description</label>
              <textarea className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white font-medium focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]/50 outline-none disabled:opacity-40 placeholder-white/30" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Décrivez votre vidéo..." disabled={isUploading} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-1.5">Miniature</label>
              <div className="flex items-center gap-3">
                <input type="file" accept="image/*" ref={thumbInputRef} onChange={handleThumbnailUpload} disabled={isUploading} className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg p-2 text-sm text-white font-medium disabled:opacity-40 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-[#FF6B35] file:text-white file:text-xs file:font-bold" />
                {uploadingThumb && <div className="animate-spin h-5 w-5 border-b-2 border-[#FF6B35] rounded-full flex-shrink-0"></div>}
              </div>
              {form.thumbnail && <img src={form.thumbnail} alt="Miniature" className="mt-3 w-32 h-20 object-cover rounded-lg border border-white/[0.06]" />}
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-1.5">Fichier vidéo <span className="text-red-400">*</span></label>
              <input type="file" accept="video/*" ref={fileInputRef} onChange={handleFileSelect} disabled={isUploading} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-2 text-sm text-white font-medium disabled:opacity-40 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-[#FF6B35] file:text-white file:text-xs file:font-bold" />
              <p className="text-[10px] text-white/40 font-medium mt-1.5">MP4, MOV (max 500MB)</p>
              {uploadedFile && !isUploading && (
                <div className="mt-2 flex items-center justify-between bg-white/[0.04] rounded-lg p-2.5">
                  <span className="text-xs text-white/80 font-medium truncate max-w-[200px]">📹 {uploadedFile.name}</span>
                  <span className="text-[10px] text-white/40 font-medium">{formatFileSize(uploadedFile.size)}</span>
                </div>
              )}
              {isUploading && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-white/80">
                    <span className="flex items-center gap-1.5"><div className="animate-spin h-3 w-3 border-2 border-[#FF6B35] border-t-transparent rounded-full"></div>{uploadProgress}%</span>
                    <span className="text-white/50">{uploadSpeed}</span>
                  </div>
                  <div className="w-full bg-white/[0.06] rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] h-full rounded-full transition-all duration-300 relative overflow-hidden" style={{ width: `${uploadProgress}%` }}><div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-white/40 font-medium"><span>{formatFileSize(uploadedFile?.size || 0)}</span><span>{uploadProgress >= 100 ? 'Finalisation...' : 'Upload en cours...'}</span></div>
                  <button type="button" onClick={handleCancelUpload} className="w-full py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20 transition flex items-center justify-center gap-1"><XMarkIcon className="w-3.5 h-3.5" />Annuler l'upload</button>
                </div>
              )}
            </div>
            {uploadedFile && !showPreview && !isUploading && (
              <button type="button" onClick={handleUploadVideo} className="w-full bg-white/[0.06] text-white py-2.5 rounded-xl font-semibold hover:bg-white/[0.1] transition flex items-center justify-center gap-2"><CloudArrowUpIcon className="w-5 h-5" />Uploader ({formatFileSize(uploadedFile.size)})</button>
            )}
            {showPreview && uploadedVideoUrl && !isUploading && (
              <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.04]">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><EyeIcon className="w-4 h-4 text-[#FF6B35]" />Aperçu</h3>
                <div className="relative rounded-lg overflow-hidden bg-black aspect-video"><video ref={videoPreviewRef} src={uploadedVideoUrl} controls className="w-full h-full object-contain" preload="metadata" /></div>
                <div className="mt-3 flex items-center justify-between text-xs text-white/60 font-medium"><span>Durée : {formatDuration(uploadedDuration)}</span><span className="flex items-center gap-1 text-green-400"><CheckCircleIcon className="w-3.5 h-3.5" />Prête</span></div>
              </div>
            )}
            {showPreview && !isUploading && (
              <button type="button" onClick={handleSubmit} disabled={uploading} className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-[#FF6B35]/20 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {uploading ? <><div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>Publication...</> : <><CheckCircleIcon className="w-5 h-5" />Publier ma vidéo</>}
              </button>
            )}
          </div>
        </div>
        <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20"><p className="text-xs text-blue-400 font-medium">💡 Votre vidéo sera examinée par l'administration.</p></div>
      </div>
      <style jsx>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } } .animate-shimmer { animation: shimmer 1.5s infinite; }`}</style>
    </ProfileLayout>
  )
}