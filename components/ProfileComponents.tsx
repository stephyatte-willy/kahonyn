"use client"

import { XMarkIcon, CameraIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useState, useRef } from 'react'

interface AvatarModalProps { isOpen: boolean; onClose: () => void; currentAvatar?: string; userName?: string; onUpload: (file: File) => Promise<void>; uploading: boolean }
export function AvatarModal({ isOpen, onClose, currentAvatar, userName, onUpload, uploading }: AvatarModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A2E] rounded-2xl max-w-md w-full p-6 border border-white/[0.06] shadow-2xl">
        <div className="flex justify-between items-center mb-6"><h2 className="text-lg font-bold text-white">Photo de profil</h2><button onClick={onClose} className="p-2 hover:bg-white/[0.06] rounded-xl transition"><XMarkIcon className="w-5 h-5 text-white/70" /></button></div>
        <div className="text-center">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-[#FF6B35]/20 to-[#D4A855]/20 rounded-full flex items-center justify-center text-4xl font-bold mb-6 overflow-hidden border-2 border-[#FF6B35]/30">
            {currentAvatar ? <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-white">{(userName?.[0] || 'U').toUpperCase()}</span>}
          </div>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={async (e) => { const f = e.target.files?.[0]; if (f) await onUpload(f) }} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-[#FF6B35]/20 transition disabled:opacity-50 flex items-center justify-center gap-2"><CameraIcon className="w-5 h-5" />{uploading ? 'Upload...' : 'Choisir une image'}</button>
          <button onClick={onClose} className="w-full mt-3 bg-white/[0.04] text-white/70 py-3 rounded-xl font-semibold hover:bg-white/[0.08] hover:text-white transition">Annuler</button>
        </div>
      </div>
    </div>
  )
}

interface PasswordModalProps { isOpen: boolean; onClose: () => void; onSubmit: (c: string, n: string) => Promise<void>; loading: boolean }
export function PasswordModal({ isOpen, onClose, onSubmit, loading }: PasswordModalProps) {
  const [showCur, setShowCur] = useState(false); const [showNew, setShowNew] = useState(false)
  const [cur, setCur] = useState(''); const [nw, setNw] = useState(''); const [cfm, setCfm] = useState('')
  if (!isOpen) return null
  const handle = async () => { if (nw !== cfm) return; await onSubmit(cur, nw); setCur(''); setNw(''); setCfm('') }
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A2E] rounded-2xl max-w-md w-full p-6 border border-white/[0.06] shadow-2xl">
        <div className="flex justify-between items-center mb-6"><h2 className="text-lg font-bold text-white">Changer le mot de passe</h2><button onClick={onClose} className="p-2 hover:bg-white/[0.06] rounded-xl transition"><XMarkIcon className="w-5 h-5 text-white/70" /></button></div>
        <div className="space-y-4">
          <div><label className="block text-sm font-semibold text-white/80 mb-1">Mot de passe actuel</label><div className="relative"><input type={showCur ? 'text' : 'password'} value={cur} onChange={(e) => setCur(e.target.value)} className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white font-semibold focus:ring-2 focus:ring-[#FF6B35] outline-none pr-10 placeholder-white/20" placeholder="••••••••" /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white" onClick={() => setShowCur(!showCur)}>{showCur ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}</button></div></div>
          <div><label className="block text-sm font-semibold text-white/80 mb-1">Nouveau mot de passe</label><div className="relative"><input type={showNew ? 'text' : 'password'} value={nw} onChange={(e) => setNw(e.target.value)} className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white font-semibold focus:ring-2 focus:ring-[#FF6B35] outline-none pr-10 placeholder-white/20" placeholder="Min 6 caractères" /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white" onClick={() => setShowNew(!showNew)}>{showNew ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}</button></div></div>
          <div><label className="block text-sm font-semibold text-white/80 mb-1">Confirmer</label><input type="password" value={cfm} onChange={(e) => setCfm(e.target.value)} className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white font-semibold focus:ring-2 focus:ring-[#FF6B35] outline-none placeholder-white/20" placeholder="••••••••" /></div>
          <div className="flex gap-3 pt-2"><button onClick={handle} disabled={loading || !cur || !nw || nw !== cfm} className="flex-1 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white py-2.5 rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50">{loading ? 'Changement...' : 'Changer'}</button><button onClick={onClose} className="flex-1 bg-white/[0.04] text-white/70 py-2.5 rounded-xl font-semibold hover:bg-white/[0.08] transition">Annuler</button></div>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps { icon: React.ElementType; label: string; value: string | number; color: string; bgColor: string }
export function StatCard({ icon: Icon, label, value, color, bgColor }: StatCardProps) {
  return (
    <div className="bg-[#1A1A2E] rounded-xl p-4 border border-white/[0.04]">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${bgColor}`}><Icon className={`w-5 h-5 ${color}`} /></div>
        <div><p className="text-lg font-bold text-white">{value}</p><p className="text-[11px] text-white/50 font-semibold">{label}</p></div>
      </div>
    </div>
  )
}

interface ProfileFieldProps { icon: React.ElementType; label: string; value: string; editing?: boolean; type?: string; onChange?: (v: string) => void; multiline?: boolean }
export function ProfileField({ icon: Icon, label, value, editing, type = 'text', onChange, multiline }: ProfileFieldProps) {
  return (
    <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.04]">
      <Icon className="w-5 h-5 text-white/40 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-white/40 font-semibold uppercase tracking-wide">{label}</p>
        {editing ? (
          multiline ? <textarea value={value} onChange={(e) => onChange?.(e.target.value)} rows={3} className="w-full mt-1 p-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white font-semibold text-sm focus:ring-2 focus:ring-[#FF6B35] outline-none" />
          : <input type={type} value={value} onChange={(e) => onChange?.(e.target.value)} className="w-full mt-1 p-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white font-semibold text-sm focus:ring-2 focus:ring-[#FF6B35] outline-none" />
        ) : <p className="text-white font-semibold text-sm truncate">{value || 'Non renseigné'}</p>}
      </div>
    </div>
  )
}