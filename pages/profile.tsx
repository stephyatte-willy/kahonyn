"use client"

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import ProfileLayout from '../components/ProfileLayout'
import { AvatarModal, PasswordModal, StatCard, ProfileField } from '../components/ProfileComponents'
import { 
  UserIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  PencilIcon,
  KeyIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  HeartIcon,
  VideoCameraIcon,
  EyeIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'
import { useRequireAuth } from '../hooks/useRequireAuth'
import Navbar from '../components/Navbar'
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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: ''
  })

  useEffect(() => {
    if (!isAuthorized) return
    fetchProfile()
  }, [isAuthorized])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      
      // Vérifier si la réponse est OK
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erreur serveur')
      }
      
      const data = await res.json()
      console.log('📦 Données profil reçues:', data)
      
      // Vérifier que les données sont valides
      if (!data || typeof data !== 'object') {
        throw new Error('Données invalides')
      }
      
      // S'assurer que toutes les propriétés existent
      const safeProfile: UserProfile = {
        id: data.id || session?.user?.id || '',
        phone: data.phone || (session?.user as any)?.phone || '',
        name: data.name || '',
        email: data.email || '',
        role: data.role || 'client',
        bio: data.bio || '',
        avatar: data.avatar || '',
        coins: data.coins || 0,
        totalEarnings: data.totalEarnings || 0,
        totalVideos: data.totalVideos || 0,
        totalViews: data.totalViews || 0,
        totalPurchases: data.totalPurchases || 0,
        favorites: data.favorites || 0,
        createdAt: data.createdAt || new Date().toISOString(),
      }
      
      setProfile(safeProfile)
      setFormData({
        name: safeProfile.name || '',
        email: safeProfile.email || '',
        bio: safeProfile.bio || ''
      })
    } catch (error) {
      console.error('❌ Erreur fetchProfile:', error)
      toast.error('Impossible de charger le profil', { duration: 2500 })
      
      // Créer un profil minimal à partir de la session
      if (session?.user) {
        const fallbackProfile: UserProfile = {
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
        }
        setProfile(fallbackProfile)
        setFormData({
          name: fallbackProfile.name,
          email: fallbackProfile.email,
          bio: ''
        })
      }
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
        toast.success('Profil mis à jour', { duration: 2000 })
        setEditing(false)
        fetchProfile()
        await update()
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Erreur lors de la mise à jour', { duration: 2500 })
      }
    } catch (error) {
      toast.error('Erreur réseau', { duration: 2500 })
    }
  }

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload-avatar', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Erreur upload')
      const data = await res.json()
      if (data.success) {
        setProfile(prev => prev ? { ...prev, avatar: data.avatar } : null)
        toast.success('Photo mise à jour', { duration: 2000 })
        setIsAvatarModalOpen(false)
        await update()
      }
    } catch (error) {
      toast.error('Erreur lors de l\'upload', { duration: 2500 })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
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
        toast.error(data.error || 'Erreur', { duration: 2500 })
      }
    } catch (error) {
      toast.error('Erreur réseau', { duration: 2500 })
    } finally {
      setPasswordLoading(false)
    }
  }

  // Message si non connecté
  if (!isAuthorized && !authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8]">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] px-4">
          <div className="w-20 h-20 rounded-2xl bg-white/80 border border-[#D4A855]/20 flex items-center justify-center mb-6 shadow-sm">
            <LockClosedIcon className="w-10 h-10 text-[#FF6B35]" />
          </div>
          <h2 className="text-xl font-bold text-[#3D2B1F] mb-2">Accès restreint</h2>
          <p className="text-sm text-[#8B5A2B]/80 text-center max-w-sm">
            Connectez-vous pour accéder à votre profil et gérer vos informations personnelles
          </p>
        </div>
      </div>
    )
  }

  if (loading || authLoading) {
    return (
      <ProfileLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
        </div>
      </ProfileLayout>
    )
  }

  // Si pas de profil après chargement, afficher une erreur
  if (!profile) {
    return (
      <ProfileLayout title="Mon Profil" activeTab="profile">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-[#3D2B1F] mb-2">Profil inaccessible</h2>
          <p className="text-sm text-[#8B5A2B]/80 text-center">
            Impossible de charger vos informations. Veuillez réessayer.
          </p>
          <button
            onClick={fetchProfile}
            className="mt-4 px-5 py-2.5 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white rounded-xl font-bold hover:shadow-lg transition"
          >
            Réessayer
          </button>
        </div>
      </ProfileLayout>
    )
  }

  const isCreator = profile.role === 'creator'
  const isAdmin = profile.role === 'admin'

  // Valeurs sécurisées pour l'affichage
  const displayName = profile.name || profile.phone || 'Utilisateur'
  const displayPhone = profile.phone || 'Non renseigné'
  const displayInitial = (profile.name?.[0] || profile.phone?.[0] || 'U').toUpperCase()
  const memberSince = profile.createdAt 
    ? new Date(profile.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Date inconnue'

  return (
    <ProfileLayout 
      title="Mon Profil" 
      subtitle={isCreator ? 'Créateur de contenu' : isAdmin ? 'Administrateur' : 'Client'}
      activeTab="profile"
    >
      <div className="space-y-6">
        {/* En-tête Avatar */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-[#D4A855]/10 shadow-sm">
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
              <h2 className="text-lg font-bold text-gray-900">{displayName}</h2>
              <p className="text-sm text-gray-600 font-bold">{displayPhone}</p>
              <p className="text-xs text-gray-500 mt-1">Membre depuis {memberSince}</p>
            </div>
          </div>
        </div>

        {/* Statistiques selon le rôle */}
        <div className="grid grid-cols-2 gap-3">
          {isCreator ? (
            <>
              <StatCard icon={VideoCameraIcon} label="Vidéos" value={profile.totalVideos || 0} color="text-blue-600" bgColor="bg-blue-100" />
              <StatCard icon={EyeIcon} label="Vues" value={(profile.totalViews || 0).toLocaleString()} color="text-green-600" bgColor="bg-green-100" />
              <StatCard icon={CurrencyDollarIcon} label="Gains" value={`${(profile.totalEarnings || 0).toLocaleString()} FCFA`} color="text-[#FF6B35]" bgColor="bg-[#FF6B35]/10" />
              <StatCard icon={CurrencyDollarIcon} label="Coins" value={profile.coins || 0} color="text-[#D4A855]" bgColor="bg-[#D4A855]/10" />
            </>
          ) : (
            <>
              <StatCard icon={ShoppingBagIcon} label="Achetés" value={profile.totalPurchases || 0} color="text-purple-600" bgColor="bg-purple-100" />
              <StatCard icon={CurrencyDollarIcon} label="Coins" value={profile.coins || 0} color="text-[#D4A855]" bgColor="bg-[#D4A855]/10" />
              <StatCard icon={HeartIcon} label="Favoris" value={profile.favorites || 0} color="text-red-600" bgColor="bg-red-100" />
              <StatCard icon={EyeIcon} label="Vues" value={(profile.totalViews || 0).toLocaleString()} color="text-green-600" bgColor="bg-green-100" />
            </>
          )}
        </div>

        {/* Informations personnelles */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-[#D4A855]/10 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-gray-900">Informations personnelles</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#1A1A35] rounded-lg hover:bg-[#2A2A45] transition"
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
            <ProfileField icon={UserIcon} label="Nom complet" value={formData.name} editing={editing} onChange={(val) => setFormData({ ...formData, name: val })} />
            <ProfileField icon={PhoneIcon} label="Téléphone" value={displayPhone} />
            <ProfileField icon={EnvelopeIcon} label="Email" value={formData.email} editing={editing} type="email" onChange={(val) => setFormData({ ...formData, email: val })} />
            {isCreator && (
              <ProfileField icon={PencilIcon} label="Bio / Présentation" value={formData.bio} editing={editing} onChange={(val) => setFormData({ ...formData, bio: val })} multiline />
            )}
          </div>

          {editing && (
            <button
              onClick={handleSave}
              className="w-full mt-4 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-[#FF6B35]/20 transition"
            >
              Enregistrer les modifications
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
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