"use client"

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import { 
  EyeIcon, EyeSlashIcon, PhoneIcon, UserIcon, 
  EnvelopeIcon, KeyIcon, XMarkIcon, UserGroupIcon, 
  VideoCameraIcon 
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

type RoleType = 'user' | 'creator'
type Mode = 'login' | 'register'

interface AuthSlidePanelProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: Mode
}

export default function AuthSlidePanel({ isOpen, onClose, initialMode = 'login' }: AuthSlidePanelProps) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<RoleType>('user')
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: ''
  })

  // Reset mode when initialMode changes
  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  // Bloquer le scroll quand le panel est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.phone || !formData.password) {
      toast.error('Téléphone et mot de passe requis')
      setLoading(false)
      return
    }

    try {
      const result = await signIn('credentials', {
        phone: formData.phone,
        password: formData.password,
        redirect: false
      })

      if (result?.ok) {
        toast.success('Connexion réussie !')
        onClose()
        router.push('/')
      } else {
        toast.error('Téléphone ou mot de passe incorrect')
      }
    } catch (err) {
      toast.error('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.phone || !formData.password) {
      toast.error('Téléphone et mot de passe requis')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      toast.error('Mot de passe trop court (min 6 caractères)')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phone,
          name: formData.name,
          email: formData.email || null,
          password: formData.password,
          role: selectedRole,
          bio: formData.bio || null
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success('Inscription réussie ! Connectez-vous.')
        setMode('login')
        setFormData({ phone: '', name: '', email: '', password: '', confirmPassword: '', bio: '' })
      } else {
        toast.error(data.error || 'Une erreur est survenue')
      }
    } catch (err) {
      toast.error('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setFormData({ phone: '', name: '', email: '', password: '', confirmPassword: '', bio: '' })
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-fadeIn"
        onClick={onClose}
      />

      {/* Panel coulissant depuis la droite */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md z-[101] animate-slideInRight">
        <div className="h-full bg-[#1A1A1A] border-l border-[#8B5A2B]/20 shadow-2xl overflow-y-auto">
          
          {/* Header */}
          <div className="sticky top-0 bg-[#1A1A1A] p-4 border-b border-[#8B5A2B]/10 flex justify-between items-center z-10">
            <div>
              <h2 className="text-lg font-bold text-[#FFF8F0]">
                {mode === 'login' ? 'Connexion' : 'Inscription'}
              </h2>
              <p className="text-xs text-[#8B5A2B]/60 mt-0.5">
                {mode === 'login' ? 'Content de vous revoir ✨' : 'Rejoignez Kahonyn 🎬'}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-[#8B5A2B]/10 rounded-full transition"
            >
              <XMarkIcon className="w-5 h-5 text-[#8B5A2B]" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Logo */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-[#8B5A2B] to-[#FF6B35] rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-[#FF6B35]/20 mb-3">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <p className="text-[#8B5A2B]/60 text-sm">Kahonyn</p>
            </div>

            {/* Sélection rôle (register only) */}
            {mode === 'register' && (
              <div className="mb-5">
                <label className="text-xs text-[#8B5A2B]/70 block mb-2">Je suis :</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('user')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs transition-all ${
                      selectedRole === 'user'
                        ? 'bg-gradient-to-r from-[#8B5A2B] to-[#FF6B35] text-white'
                        : 'bg-[#8B5A2B]/5 text-[#8B5A2B]/60 border border-[#8B5A2B]/10 hover:border-[#FF6B35]/30'
                    }`}
                  >
                    <UserGroupIcon className="w-4 h-4" />
                    Utilisateur
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('creator')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs transition-all ${
                      selectedRole === 'creator'
                        ? 'bg-gradient-to-r from-[#8B5A2B] to-[#FF6B35] text-white'
                        : 'bg-[#8B5A2B]/5 text-[#8B5A2B]/60 border border-[#8B5A2B]/10 hover:border-[#FF6B35]/30'
                    }`}
                  >
                    <VideoCameraIcon className="w-4 h-4" />
                    Créateur
                  </button>
                </div>
              </div>
            )}

            {/* Formulaire */}
            <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-3.5">
              {/* Téléphone */}
              <div>
                <label className="text-xs text-[#8B5A2B]/70 block mb-1">Téléphone *</label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B5A2B]/40" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0501010101"
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-[#8B5A2B]/5 border border-[#8B5A2B]/10 rounded-lg text-sm text-[#FFF8F0] placeholder-[#8B5A2B]/30 focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/30 outline-none transition"
                  />
                </div>
              </div>

              {/* Nom + Email (register only) */}
              {mode === 'register' && (
                <>
                  <div>
                    <label className="text-xs text-[#8B5A2B]/70 block mb-1">Nom complet</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B5A2B]/40" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Votre nom"
                        className="w-full pl-9 pr-3 py-2.5 bg-[#8B5A2B]/5 border border-[#8B5A2B]/10 rounded-lg text-sm text-[#FFF8F0] placeholder-[#8B5A2B]/30 focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/30 outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[#8B5A2B]/70 block mb-1">Email</label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B5A2B]/40" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="votre@email.com"
                        className="w-full pl-9 pr-3 py-2.5 bg-[#8B5A2B]/5 border border-[#8B5A2B]/10 rounded-lg text-sm text-[#FFF8F0] placeholder-[#8B5A2B]/30 focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/30 outline-none transition"
                      />
                    </div>
                  </div>

                  {selectedRole === 'creator' && (
                    <div>
                      <label className="text-xs text-[#8B5A2B]/70 block mb-1">Bio</label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows={2}
                        placeholder="Présentez-vous..."
                        className="w-full px-3 py-2.5 bg-[#8B5A2B]/5 border border-[#8B5A2B]/10 rounded-lg text-sm text-[#FFF8F0] placeholder-[#8B5A2B]/30 focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/30 outline-none transition resize-none"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Mot de passe */}
              <div>
                <label className="text-xs text-[#8B5A2B]/70 block mb-1">Mot de passe *</label>
                <div className="relative">
                  <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B5A2B]/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-9 pr-10 py-2.5 bg-[#8B5A2B]/5 border border-[#8B5A2B]/10 rounded-lg text-sm text-[#FFF8F0] placeholder-[#8B5A2B]/30 focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/30 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B5A2B]/50 hover:text-[#FF6B35] transition"
                  >
                    {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmation (register only) */}
              {mode === 'register' && (
                <div>
                  <label className="text-xs text-[#8B5A2B]/70 block mb-1">Confirmer *</label>
                  <div className="relative">
                    <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B5A2B]/40" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className="w-full pl-9 pr-10 py-2.5 bg-[#8B5A2B]/5 border border-[#8B5A2B]/10 rounded-lg text-sm text-[#FFF8F0] placeholder-[#8B5A2B]/30 focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/30 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B5A2B]/50 hover:text-[#FF6B35] transition"
                    >
                      {showConfirmPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-4 bg-gradient-to-r from-[#8B5A2B] to-[#FF6B35] text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-[#FF6B35]/25 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Chargement...
                  </span>
                ) : mode === 'login' ? 'Se connecter' : "S'inscrire"}
              </button>
            </form>

            {/* Switch mode */}
            <div className="mt-6 text-center">
              <button
                onClick={switchMode}
                className="text-sm text-[#8B5A2B]/60 hover:text-[#FF6B35] transition"
              >
                {mode === 'login' 
                  ? "Pas encore de compte ? S'inscrire" 
                  : 'Déjà inscrit ? Se connecter'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slideInRight { animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </>
  )
}