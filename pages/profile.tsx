"use client"

import { useSession } from 'next-auth/react'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import UserLayout from '../components/UserLayout'
import { 
  UserIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  CalendarIcon, 
  PencilIcon,
  CameraIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import toast, { Toaster } from 'react-hot-toast'

interface UserProfile {
  id: string
  phone: string
  name: string
  email: string
  role: string
  bio: string
  avatar: string
  coins: number
  totalEarnings: number
  createdAt: string
}

export default function Profile() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: ''
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!session) {
      router.push('/login')
      return
    }
    fetchProfile()
  }, [session, router])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      const data = await res.json()
      setProfile(data)
      setFormData({
        name: data.name || '',
        email: data.email || '',
        bio: data.bio || ''
      })
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Impossible de charger le profil')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success('Profil mis à jour')
        setEditing(false)
        fetchProfile()
        await update()
      } else {
        toast.error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image')
      return
    }

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erreur upload')
      }

      const data = await res.json()
      
      if (data.success) {
        // Mettre à jour le profil localement
        setProfile(prev => prev ? { ...prev, avatar: data.avatar } : null)
        toast.success('Photo de profil mise à jour')
        setIsAvatarModalOpen(false)
        // Rafraîchir la session
        await update()
      }
    } catch (error) {
      console.error('Erreur avatar:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'upload')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!passwordForm.newPassword || !passwordForm.currentPassword) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Les nouveaux mots de passe ne correspondent pas')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Le mot de passe doit avoir au moins 6 caractères')
      return
    }

    setPasswordLoading(true)
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Mot de passe modifié avec succès')
        setIsPasswordModalOpen(false)
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        toast.error(data.error || 'Erreur lors du changement')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    } finally {
      setPasswordLoading(false)
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

  if (!profile) return null

  const isCreator = profile.role === 'creator'

  return (
    <UserLayout>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1A1A1A', color: '#FFF8F0', borderRadius: '16px' },
        success: { iconTheme: { primary: '#FF6B35', secondary: '#1A1A1A' } },
        error: { iconTheme: { primary: '#FF6B35', secondary: '#1A1A1A' } },
      }} />
      
      <div className="max-w-4xl mx-auto">
        {/* En-tête avec avatar cliquable */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAvatarModalOpen(true)}
              className="relative group cursor-pointer"
            >
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold overflow-hidden">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{(profile.name?.[0] || profile.phone[0] || 'U').toUpperCase()}</span>
                )}
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <CameraIcon className="w-6 h-6 text-white" />
              </div>
            </button>
            <div>
              <h1 className="text-2xl font-bold">{profile.name || profile.phone}</h1>
              <p className="opacity-90 capitalize">{isCreator ? 'Créateur de contenu' : 'Utilisateur'}</p>
              <p className="text-sm opacity-75 mt-1">Membre depuis {new Date(profile.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Informations personnelles */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Informations personnelles</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="flex items-center gap-1 text-blue-500 hover:text-blue-600 text-sm"
              >
                <KeyIcon className="w-4 h-4" />
                Changer mot de passe
              </button>
              <button
                onClick={() => setEditing(!editing)}
                className="flex items-center gap-1 text-orange-500 hover:text-orange-600"
              >
                <PencilIcon className="w-4 h-4" />
                {editing ? 'Annuler' : 'Modifier'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <UserIcon className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-400">Nom complet</p>
                {editing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full mt-1 p-1 border rounded focus:ring-orange-500 focus:border-orange-500"
                  />
                ) : (
                  <p className="text-gray-800">{profile.name || 'Non renseigné'}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <PhoneIcon className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-400">Téléphone</p>
                <p className="text-gray-800">{profile.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <EnvelopeIcon className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-400">Email</p>
                {editing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full mt-1 p-1 border rounded focus:ring-orange-500 focus:border-orange-500"
                  />
                ) : (
                  <p className="text-gray-800">{profile.email || 'Non renseigné'}</p>
                )}
              </div>
            </div>

            {isCreator && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-400">Bio / Présentation</p>
                  {editing ? (
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={3}
                      className="w-full mt-1 p-1 border rounded focus:ring-orange-500 focus:border-orange-500"
                    />
                  ) : (
                    <p className="text-gray-800">{profile.bio || 'Aucune présentation'}</p>
                  )}
                </div>
              </div>
            )}

            {editing && (
              <button
                onClick={handleSave}
                className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition mt-4"
              >
                Enregistrer les modifications
              </button>
            )}
          </div>
        </div>

        {/* Statistiques (pour créateurs) */}
        {isCreator && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{profile.totalEarnings?.toLocaleString() || 0} FCFA</p>
              <p className="text-sm text-gray-500">Gains totaux</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-orange-500">{profile.coins?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-500">Mes coins</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal upload avatar */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fadeInUp">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Photo de profil</h2>
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="text-center">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center text-4xl font-bold mb-4 overflow-hidden">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{(profile?.name?.[0] || profile?.phone[0] || 'U').toUpperCase()}</span>
                )}
              </div>
              
              <p className="text-gray-600 mb-4">
                Choisissez une photo pour votre profil
              </p>
              
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CameraIcon className="w-5 h-5" />
                {uploadingAvatar ? 'Upload en cours...' : 'Choisir une image'}
              </button>
              
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="w-full mt-3 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal changement mot de passe */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fadeInUp">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Changer le mot de passe</h2>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe actuel
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none pr-10"
                    placeholder="•••••••• (min 6 caractères)"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handlePasswordChange}
                  disabled={passwordLoading}
                  className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {passwordLoading ? 'Changement...' : 'Changer le mot de passe'}
                </button>
                <button
                  onClick={() => setIsPasswordModalOpen(false)}
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