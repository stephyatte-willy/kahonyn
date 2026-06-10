"use client"

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import ProfileLayout from '../components/ProfileLayout'
import { AvatarModal, PasswordModal, StatCard, ProfileField } from '../components/ProfileComponents'
import { UserIcon, PhoneIcon, EnvelopeIcon, PencilIcon, KeyIcon, CurrencyDollarIcon, ShoppingBagIcon, HeartIcon, VideoCameraIcon, EyeIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { useRequireAuth } from '../hooks/useRequireAuth'
import Navbar from '../components/Navbar'
// ✅ IMPORT errorHandler
import { safeFetch, handleError } from '../utils/errorHandler'
import toast from 'react-hot-toast'

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
  totalVideos?: number
  totalViews?: number
  totalPurchases?: number
  favorites?: number
  createdAt: string
}

export default function Profile() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const { isAuthorized, isLoading: authLoading } = useRequireAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', bio: '' })

  useEffect(() => { 
    if (!isAuthorized) return
    fetchProfile() 
  }, [isAuthorized])

  // ✅ NOUVELLE VERSION de fetchProfile avec safeFetch
  const fetchProfile = async () => {
    try {
      const data = await safeFetch<any>('/api/user/profile', undefined, 'fetchProfile')
      
      if (data) {
        setProfile({
          id: data.id || (session?.user as any)?.id || '',
          phone: data.phone || (session?.user as any)?.phone || '',
          name: data.name || session?.user?.name || '',
          email: data.email || session?.user?.email || '',
          role: data.role || (session?.user as any)?.role || 'client',
          bio: data.bio || '',
          avatar: data.avatar || session?.user?.image || '',
          coins: data.coins || 0,
          totalEarnings: data.totalEarnings || 0,
          totalVideos: data.totalVideos || 0,
          totalViews: data.totalViews || 0,
          totalPurchases: data.totalPurchases || 0,
          favorites: data.favorites || 0,
          createdAt: data.createdAt || new Date().toISOString(),
        })
        setFormData({ 
          name: data.name || '', 
          email: data.email || '', 
          bio: data.bio || '' 
        })
      } else {
        // Fallback avec les données de session
        if (session?.user) {
          setProfile({
            id: (session.user as any).id || '',
            phone: (session.user as any).phone || '',
            name: session.user.name || '',
            email: session.user.email || '',
            role: (session.user as any).role || 'client',
            bio: '',
            avatar: session.user.image || '',
            coins: 0,
            totalEarnings: 0,
            totalVideos: 0,
            totalViews: 0,
            totalPurchases: 0,
            favorites: 0,
            createdAt: new Date().toISOString(),
          })
        }
      }
    } catch (error) {
      handleError(error, 'fetchProfile')
    } finally {
      setLoading(false)
    }
  }

  // ✅ NOUVELLE VERSION de handleSave avec safeFetch
  const handleSave = async () => {
    try {
      const data = await safeFetch<{ success: boolean }>(
        '/api/user/profile',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        },
        'handleSave'
      )
      
      if (data && data.success !== false) {
        toast.success('Profil mis à jour', { duration: 2000 })
        setEditing(false)
        await fetchProfile()
        await update()
      }
    } catch (error) {
      handleError(error, 'handleSave')
    }
  }

  // ✅ handleAvatarUpload avec gestion d'erreur améliorée
  const handleAvatarUpload = async (file: File) => {
    // Validation du fichier
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop grande (max 5MB)')
      return
    }
    
    setUploadingAvatar(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      
      const res = await fetch('/api/upload-avatar', { method: 'POST', body: fd })
      
      if (!res.ok) {
        const error = new Error(`HTTP ${res.status}`)
        ;(error as any).status = res.status
        throw error
      }
      
      const data = await res.json()
      
      if (data.success) {
        setProfile(prev => prev ? { ...prev, avatar: data.avatar } : null)
        toast.success('Photo mise à jour', { duration: 2000 })
        setIsAvatarModalOpen(false)
        await update()
      } else {
        throw new Error(data.error || 'Erreur upload')
      }
    } catch (error) {
      handleError(error, 'handleAvatarUpload')
    } finally {
      setUploadingAvatar(false)
    }
  }

  // ✅ handlePasswordChange avec gestion d'erreur améliorée
  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    // Validation
    if (newPassword.length < 6) {
      toast.error('Le nouveau mot de passe doit avoir au moins 6 caractères')
      return
    }
    
    setPasswordLoading(true)
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast.success('Mot de passe modifié', { duration: 2000 })
        setIsPasswordModalOpen(false)
      } else {
        toast.error(data.error || 'Erreur lors du changement de mot de passe')
      }
    } catch (error) {
      handleError(error, 'handlePasswordChange')
    } finally {
      setPasswordLoading(false)
    }
  }

  // Vérification d'authentification
  if (!isAuthorized && !authLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D]">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] px-4">
          <div className="w-24 h-24 rounded-2xl bg-[#1A1A2E] border border-white/[0.06] flex items-center justify-center mb-6 shadow-xl">
            <LockClosedIcon className="w-12 h-12 text-[#FF6B35]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Accès restreint</h2>
          <p className="text-sm text-white/60 text-center max-w-sm">
            Connectez-vous pour accéder à votre profil
          </p>
        </div>
      </div>
    )
  }

  if (loading || authLoading) {
    return (
      <ProfileLayout title="Mon Profil" activeTab="profile">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
        </div>
      </ProfileLayout>
    )
  }

  if (!profile) {
    return (
      <ProfileLayout title="Mon Profil" activeTab="profile">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-white mb-2">Profil inaccessible</h2>
          <button 
            onClick={fetchProfile} 
            className="mt-4 px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white rounded-xl font-bold"
          >
            Réessayer
          </button>
        </div>
      </ProfileLayout>
    )
  }

  const isCreator = profile.role === 'creator'
  const isAdmin = profile.role === 'admin'
  const displayName = profile.name || profile.phone || 'Utilisateur'
  const displayPhone = profile.phone || 'Non renseigné'
  const displayInitial = (profile.name?.[0] || profile.phone?.[0] || 'U').toUpperCase()
  const memberSince = profile.createdAt 
    ? new Date(profile.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) 
    : 'Date inconnue'

  return (
    <ProfileLayout 
      title="Mon Profil" 
      subtitle={isCreator ? 'Créateur' : isAdmin ? 'Admin' : 'Client'} 
      activeTab="profile"
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Section Avatar */}
        <div className="bg-[#1A1A2E] rounded-2xl p-6 border border-white/[0.04]">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsAvatarModalOpen(true)} 
              className="relative group flex-shrink-0"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] flex items-center justify-center text-2xl font-bold text-white overflow-hidden border-2 border-[#FF6B35]/30">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{displayInitial}</span>
                )}
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-bold">Modifier</span>
              </div>
            </button>
            <div>
              <h2 className="text-lg font-bold text-white">{displayName}</h2>
              <p className="text-sm text-white/60 font-medium">{displayPhone}</p>
              <p className="text-xs text-white/40 mt-1">Membre depuis {memberSince}</p>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {isCreator ? (
            <>
              <StatCard 
                icon={VideoCameraIcon} 
                label="Vidéos" 
                value={profile.totalVideos || 0} 
                color="text-blue-400" 
                bgColor="bg-blue-500/10" 
              />
              <StatCard 
                icon={EyeIcon} 
                label="Vues" 
                value={(profile.totalViews || 0).toLocaleString()} 
                color="text-green-400" 
                bgColor="bg-green-500/10" 
              />
              <StatCard 
                icon={CurrencyDollarIcon} 
                label="Gains" 
                value={`${(profile.totalEarnings || 0).toLocaleString()} FCFA`} 
                color="text-[#FF6B35]" 
                bgColor="bg-[#FF6B35]/10" 
              />
              <StatCard 
                icon={CurrencyDollarIcon} 
                label="Coins" 
                value={profile.coins || 0} 
                color="text-[#D4A855]" 
                bgColor="bg-[#D4A855]/10" 
              />
            </>
          ) : (
            <>
              <StatCard 
                icon={ShoppingBagIcon} 
                label="Achetés" 
                value={profile.totalPurchases || 0} 
                color="text-purple-400" 
                bgColor="bg-purple-500/10" 
              />
              <StatCard 
                icon={CurrencyDollarIcon} 
                label="Coins" 
                value={profile.coins || 0} 
                color="text-[#D4A855]" 
                bgColor="bg-[#D4A855]/10" 
              />
              <StatCard 
                icon={HeartIcon} 
                label="Favoris" 
                value={profile.favorites || 0} 
                color="text-red-400" 
                bgColor="bg-red-500/10" 
              />
              <StatCard 
                icon={EyeIcon} 
                label="Vues" 
                value={(profile.totalViews || 0).toLocaleString()} 
                color="text-green-400" 
                bgColor="bg-green-500/10" 
              />
            </>
          )}
        </div>

        {/* Informations personnelles */}
        <div className="bg-[#1A1A2E] rounded-2xl p-6 border border-white/[0.04]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-white">Informations personnelles</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsPasswordModalOpen(true)} 
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-white/[0.06] rounded-lg hover:bg-white/[0.1] transition"
              >
                <KeyIcon className="w-3.5 h-3.5" />
                Mot de passe
              </button>
              <button 
                onClick={() => setEditing(!editing)} 
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#FF6B35] rounded-lg hover:bg-[#FF8C5A] transition"
              >
                <PencilIcon className="w-3.5 h-3.5" />
                {editing ? 'Annuler' : 'Modifier'}
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <ProfileField 
              icon={UserIcon} 
              label="Nom complet" 
              value={formData.name} 
              editing={editing} 
              onChange={(val) => setFormData({ ...formData, name: val })} 
            />
            <ProfileField 
              icon={PhoneIcon} 
              label="Téléphone" 
              value={displayPhone} 
            />
            <ProfileField 
              icon={EnvelopeIcon} 
              label="Email" 
              value={formData.email} 
              editing={editing} 
              type="email" 
              onChange={(val) => setFormData({ ...formData, email: val })} 
            />
            {isCreator && (
              <ProfileField 
                icon={PencilIcon} 
                label="Bio" 
                value={formData.bio} 
                editing={editing} 
                onChange={(val) => setFormData({ ...formData, bio: val })} 
                multiline 
              />
            )}
          </div>
          {editing && (
            <button 
              onClick={handleSave} 
              className="w-full mt-4 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white py-3 rounded-xl font-bold"
            >
              Enregistrer
            </button>
          )}
        </div>
      </div>

      {/* Modales */}
      {isAvatarModalOpen && (
        <AvatarModal 
          isOpen={isAvatarModalOpen} 
          onClose={() => setIsAvatarModalOpen(false)} 
          currentAvatar={profile.avatar} 
          userName={displayName} 
          onUpload={handleAvatarUpload} 
          uploading={uploadingAvatar} 
        />
      )}
      
      {isPasswordModalOpen && (
        <PasswordModal 
          isOpen={isPasswordModalOpen} 
          onClose={() => setIsPasswordModalOpen(false)} 
          onSubmit={handlePasswordChange} 
          loading={passwordLoading} 
        />
      )}
    </ProfileLayout>
  )
}