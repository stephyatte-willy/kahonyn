"use client"

import { XMarkIcon, CameraIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useState, useRef } from 'react'

// Modal Avatar
interface AvatarModalProps {
  isOpen: boolean
  onClose: () => void
  currentAvatar?: string
  userName?: string
  onUpload: (file: File) => Promise<void>
  uploading: boolean
}

export function AvatarModal({ isOpen, onClose, currentAvatar, userName, onUpload, uploading }: AvatarModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await onUpload(file)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A35] rounded-2xl max-w-md w-full p-6 border border-white/10 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white">Photo de profil</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition">
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
        </div>
        
        <div className="text-center">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-[#FF6B35]/20 to-[#D4A855]/20 rounded-full flex items-center justify-center text-4xl font-bold mb-6 overflow-hidden border-2 border-[#FF6B35]/30">
            {currentAvatar ? (
              <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white">{(userName?.[0] || 'U').toUpperCase()}</span>
            )}
          </div>
          
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-[#FF6B35]/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CameraIcon className="w-5 h-5" />
            {uploading ? 'Upload en cours...' : 'Choisir une image'}
          </button>
          
          <button
            onClick={onClose}
            className="w-full mt-3 bg-white/10 text-white/80 py-3 rounded-xl font-bold hover:bg-white/20 transition"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal Changement mot de passe
interface PasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>
  loading: boolean
}

export function PasswordModal({ isOpen, onClose, onSubmit, loading }: PasswordModalProps) {
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) return
    await onSubmit(currentPassword, newPassword)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A35] rounded-2xl max-w-md w-full p-6 border border-white/10 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white">Changer le mot de passe</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition">
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-white/80 mb-1">Mot de passe actuel</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-xl text-white font-bold focus:ring-2 focus:ring-[#FF6B35] outline-none pr-10 placeholder-white/30"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                onClick={() => setShowCurrent(!showCurrent)}
              >
                {showCurrent ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-white/80 mb-1">Nouveau mot de passe</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-xl text-white font-bold focus:ring-2 focus:ring-[#FF6B35] outline-none pr-10 placeholder-white/30"
                placeholder="Min 6 caractères"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-white/80 mb-1">Confirmer</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-xl text-white font-bold focus:ring-2 focus:ring-[#FF6B35] outline-none placeholder-white/30"
              placeholder="••••••••"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={loading || !currentPassword || !newPassword || newPassword !== confirmPassword}
              className="flex-1 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white py-2.5 rounded-xl font-bold hover:shadow-lg hover:shadow-[#FF6B35]/20 transition disabled:opacity-50"
            >
              {loading ? 'Changement...' : 'Changer'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-white/10 text-white/80 py-2.5 rounded-xl font-bold hover:bg-white/20 transition"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Carte statistique
interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
  bgColor: string
}

export function StatCard({ icon: Icon, label, value, color, bgColor }: StatCardProps) {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-[#D4A855]/10 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <p className="text-lg sm:text-xl font-bold text-gray-900">{value}</p>
          <p className="text-[10px] sm:text-[11px] text-gray-600 font-bold">{label}</p>
        </div>
      </div>
    </div>
  )
}

// Champ de formulaire profil
interface ProfileFieldProps {
  icon: React.ElementType
  label: string
  value: string
  editing?: boolean
  type?: string
  onChange?: (value: string) => void
  multiline?: boolean
}

export function ProfileField({ icon: Icon, label, value, editing, type = 'text', onChange, multiline }: ProfileFieldProps) {
  return (
    <div className="flex items-start gap-3 p-3 bg-[#EDE4D8] rounded-xl">
      <Icon className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] sm:text-[11px] text-gray-600 font-bold uppercase tracking-wide">{label}</p>
        {editing ? (
          multiline ? (
            <textarea
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              rows={3}
              className="w-full mt-1 p-2 bg-white border border-[#D4A855]/20 rounded-lg text-gray-900 font-bold text-sm focus:ring-2 focus:ring-[#FF6B35] outline-none"
            />
          ) : (
            <input
              type={type}
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              className="w-full mt-1 p-2 bg-white border border-[#D4A855]/20 rounded-lg text-gray-900 font-bold text-sm focus:ring-2 focus:ring-[#FF6B35] outline-none"
            />
          )
        ) : (
          <p className="text-gray-900 font-bold text-sm truncate">{value || 'Non renseigné'}</p>
        )}
      </div>
    </div>
  )
}