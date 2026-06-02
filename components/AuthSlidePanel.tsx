// components/AuthSlidePanel.tsx
"use client"

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import { 
  XMarkIcon, 
  PhoneIcon, 
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  EnvelopeIcon,
  UserGroupIcon,
  VideoCameraIcon,
  SparklesIcon,
  CheckCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface AuthSlidePanelProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
  onSwitchMode?: (mode: 'login' | 'register') => void
}

export default function AuthSlidePanel({ 
  isOpen, 
  onClose, 
  initialMode = 'login', 
  onSwitchMode 
}: AuthSlidePanelProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()

  // Form state
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [accountType, setAccountType] = useState<'client' | 'creator'>('client')

  // Synchroniser avec initialMode
  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  // Réinitialiser les champs quand on change de mode
  useEffect(() => {
    setPhone('')
    setPassword('')
    setName('')
    setEmail('')
    setConfirmPassword('')
    setAcceptTerms(false)
    setShowPassword(false)
    setAccountType('client')
  }, [mode])

  // Gérer le returnUrl
  useEffect(() => {
    if (isOpen) {
      const params = new URLSearchParams(window.location.search)
      const returnUrl = params.get('returnUrl')
      if (returnUrl) {
        localStorage.setItem('kahonyn_returnUrl', returnUrl)
      }
    }
  }, [isOpen])

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode)
    onSwitchMode?.(newMode)
  }

  // 1. handleLogin - Connexion réussie
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  
  if (!phone || !password) {
    toast.error('Veuillez remplir tous les champs', { duration: 2000 })
    return
  }

  const cleanPhone = phone.replace(/\D/g, '')
  
  if (cleanPhone.length < 8) {
    toast.error('Numéro de téléphone invalide', { duration: 2000 })
    return
  }

  setLoading(true)
  try {
    const result = await signIn('credentials', {
      phone: cleanPhone,
      password,
      redirect: false
    })

    if (result?.error) {
      const errorMessages: Record<string, string> = {
        'CredentialsSignin': 'Téléphone ou mot de passe incorrect',
      }
      const message = errorMessages[result.error] || result.error
      toast.error(message, { duration: 2500 })
    } else if (result?.ok) {
      toast.success('Connexion réussie !', { duration: 2000 })
      
      const returnUrl = localStorage.getItem('kahonyn_returnUrl')
      localStorage.removeItem('kahonyn_returnUrl')
      
      // Fermer immédiatement, ne pas attendre
      onClose()
      
      // Redirection plus rapide
      setTimeout(() => {
        router.push(returnUrl || '/')
      }, 300) // ← 300ms au lieu de 500ms
    }
  } catch (error) {
    toast.error('Erreur de connexion. Veuillez réessayer.', { duration: 2500 })
  } finally {
    setLoading(false)
  }
}

// 2. handleGoogleLogin
const handleGoogleLogin = async () => {
  setGoogleLoading(true)
  try {
    const returnUrl = localStorage.getItem('kahonyn_returnUrl') || '/'
    await signIn('google', { 
      callbackUrl: returnUrl,
      redirect: true 
    })
  } catch (error) {
    toast.error('Erreur de connexion avec Google', { duration: 2500 })
    setGoogleLoading(false)
  }
}

// 3. handleRegister - Inscription réussie
const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault()
  
  if (!name || !phone || !password || !confirmPassword) {
    toast.error('Veuillez remplir tous les champs obligatoires', { duration: 2000 })
    return
  }

  const cleanPhone = phone.replace(/\D/g, '')
  if (cleanPhone.length < 8) {
    toast.error('Numéro de téléphone invalide', { duration: 2000 })
    return
  }

  if (password.length < 6) {
    toast.error('Le mot de passe doit avoir au moins 6 caractères', { duration: 2000 })
    return
  }

  if (password !== confirmPassword) {
    toast.error('Les mots de passe ne correspondent pas', { duration: 2000 })
    return
  }

  if (!acceptTerms) {
    toast.error('Veuillez accepter les conditions d\'utilisation', { duration: 2000 })
    return
  }

  setLoading(true)
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        name: name.trim(), 
        phone: cleanPhone, 
        password, 
        email: email.trim() || undefined,
        role: accountType
      })
    })

    const contentType = res.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text()
      console.error('Réponse non-JSON:', text)
      throw new Error('Le serveur a retourné une réponse invalide')
    }

    const data = await res.json()

    if (res.ok) {
      toast.success('Compte créé avec succès !', { duration: 2000 })
      
      // Connexion automatique
      const loginResult = await signIn('credentials', {
        phone: cleanPhone,
        password,
        redirect: false
      })

      if (!loginResult?.error) {
        const returnUrl = localStorage.getItem('kahonyn_returnUrl')
        localStorage.removeItem('kahonyn_returnUrl')
        
        onClose()
        setTimeout(() => {
          router.push(returnUrl || '/')
        }, 300) // ← 300ms
      }
    } else {
      toast.error(data.error || 'Erreur lors de l\'inscription', { duration: 2500 })
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('JSON')) {
      toast.error('Erreur de communication avec le serveur', { duration: 2500 })
    } else if (error instanceof Error) {
      toast.error(error.message, { duration: 2500 })
    } else {
      toast.error('Erreur réseau. Veuillez réessayer.', { duration: 2500 })
    }
  } finally {
    setLoading(false)
  }
}

  if (!isOpen) return null

  return (
    <>

      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn" 
        onClick={onClose} 
      />
      
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-gradient-to-b from-[#FFF8F0] via-[#FBF6EE] to-[#F5F0E8] z-50 shadow-2xl overflow-y-auto animate-slideIn">
        {/* Bouton fermer */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 hover:bg-[#FF6B35]/10 rounded-full transition-all z-10 group"
          aria-label="Fermer"
        >
          <XMarkIcon className="w-6 h-6 text-[#5C3D2E] group-hover:text-[#FF6B35] transition" />
        </button>

        <div className="p-6 pt-2">
          {/* Logo et titre */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] flex items-center justify-center shadow-xl shadow-[#FF6B35]/20 mx-auto mb-5 relative z-10">
                <span className="text-3xl">🎬</span>
              </div>
            </div>
            <h2 className="text-xl font-bold text-[#3D2B1F] mt-1">
              {mode === 'login' ? 'Bienvenue !' : 'Rejoignez-nous'}
            </h2>
            <p className="text-sm text-[#8B5A2B]/80 mt-1 font-medium">
              {mode === 'login' 
                ? 'Connectez-vous pour accéder à tout le contenu' 
                : 'Créez votre compte et commencez l\'aventure'
              }
            </p>
          </div>

          {/* ==================== FORMULAIRE CONNEXION ==================== */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#3D2B1F] mb-1">
                  Téléphone
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B35]/10 to-[#D4A855]/10 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B5A2B]/50 group-focus-within:text-[#FF6B35] transition-colors" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0102030405"
                      className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-[#D4A855]/20 rounded-xl text-[#3D2B1F] font-bold placeholder-[#8B5A2B]/40 focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] outline-none transition-all shadow-sm hover:shadow-md"
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#3D2B1F] mb-1.5">
                  Mot de passe
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B35]/10 to-[#D4A855]/10 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B5A2B]/50 group-focus-within:text-[#FF6B35] transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-3.5 bg-white border-2 border-[#D4A855]/20 rounded-xl text-[#3D2B1F] font-bold placeholder-[#8B5A2B]/40 focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] outline-none transition-all shadow-sm hover:shadow-md"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B5A2B]/50 hover:text-[#FF6B35] transition-colors p-1"
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white py-3.5 rounded-xl font-bold text-base hover:shadow-xl hover:shadow-[#FF6B35]/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] mt-2 transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Connexion...
                  </span>
                ) : (
                  'Se connecter'
                )}
              </button>

              {/* Séparateur */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#D4A855]/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gradient-to-r from-[#FFF8F0] via-[#FBF6EE] to-[#F5F0E8] text-[#8B5A2B]/60 font-bold">
                    ou continuer avec
                  </span>
                </div>
              </div>

              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3 bg-white border-2 border-[#D4A855]/20 rounded-xl text-[#3D2B1F] font-bold hover:bg-gray-50 hover:border-[#D4A855]/40 hover:shadow-md transition-all duration-300 disabled:opacity-50 transform hover:-translate-y-0.5"
              >
                {googleLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {googleLoading ? 'Connexion...' : 'Continuer avec Google'}
              </button>

              <p className="text-center text-sm text-[#8B5A2B] font-medium mt-6">
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-[#FF6B35] font-bold hover:underline transition"
                >
                  S'inscrire
                </button>
              </p>
            </form>
          ) : (
            /* ==================== FORMULAIRE INSCRIPTION ==================== */
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Choix du type de compte */}
              <div className="mb-2">
                <label className="block text-sm font-bold text-[#3D2B1F] mb-3 text-center">
                  Choisissez votre type de compte
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Option Client */}
                  <button
                    type="button"
                    onClick={() => setAccountType('client')}
                    className={`relative p-1 rounded-2xl border-2 transition-all duration-300 text-center ${
                      accountType === 'client'
                        ? 'border-[#FF6B35] bg-[#FF6B35]/5 shadow-lg shadow-[#FF6B35]/10 transform scale-[1.02]'
                        : 'border-[#D4A855]/20 bg-white hover:border-[#D4A855]/40 hover:shadow-md'
                    }`}
                  >
                    {accountType === 'client' && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#FF6B35] rounded-full flex items-center justify-center shadow-md">
                        <CheckCircleIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2 transition-all ${
                      accountType === 'client' 
                        ? 'bg-[#FF6B35]/10' 
                        : 'bg-[#D4A855]/10'
                    }`}>
                      <UserGroupIcon className={`w-6 h-6 ${
                        accountType === 'client' ? 'text-[#FF6B35]' : 'text-[#8B5A2B]/50'
                      }`} />
                    </div>
                    <p className={`font-bold text-sm transition-colors ${
                      accountType === 'client' ? 'text-[#FF6B35]' : 'text-[#5C3D2E]'
                    }`}>
                      Client
                    </p>
                    <p className="text-[10px] text-[#8B5A2B]/60 mt-1 font-medium leading-tight">
                      Regarder et acheter des vidéos
                    </p>
                  </button>

                  {/* Option Créateur */}
                  <button
                    type="button"
                    onClick={() => setAccountType('creator')}
                    className={`relative p-4 rounded-2xl border-2 transition-all duration-300 text-center ${
                      accountType === 'creator'
                        ? 'border-[#FF6B35] bg-[#FF6B35]/5 shadow-lg shadow-[#FF6B35]/10 transform scale-[1.02]'
                        : 'border-[#D4A855]/20 bg-white hover:border-[#D4A855]/40 hover:shadow-md'
                    }`}
                  >
                    {accountType === 'creator' && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#FF6B35] rounded-full flex items-center justify-center shadow-md">
                        <CheckCircleIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2 transition-all ${
                      accountType === 'creator' 
                        ? 'bg-[#FF6B35]/10' 
                        : 'bg-[#D4A855]/10'
                    }`}>
                      <VideoCameraIcon className={`w-6 h-6 ${
                        accountType === 'creator' ? 'text-[#FF6B35]' : 'text-[#8B5A2B]/50'
                      }`} />
                    </div>
                    <p className={`font-bold text-sm transition-colors ${
                      accountType === 'creator' ? 'text-[#FF6B35]' : 'text-[#5C3D2E]'
                    }`}>
                      Créateur
                    </p>
                    <p className="text-[10px] text-[#8B5A2B]/60 mt-1 font-medium leading-tight">
                      Publier et gagner de l'argent
                    </p>
                  </button>
                </div>
              </div>

              {/* Séparateur */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#D4A855]/20"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-gradient-to-r from-[#FFF8F0] via-[#FBF6EE] to-[#F5F0E8] text-[#8B5A2B]/50 font-bold uppercase tracking-wider">
                    Informations
                  </span>
                </div>
              </div>

              {/* Nom complet */}
              <div>
                <label className="block text-sm font-bold text-[#3D2B1F] mb-1.5">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B5A2B]/50 group-focus-within:text-[#FF6B35] transition-colors" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Votre nom complet"
                      className="w-full pl-12 pr-4 py-3 bg-white border-2 border-[#D4A855]/20 rounded-xl text-[#3D2B1F] font-bold placeholder-[#8B5A2B]/40 focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] outline-none transition-all shadow-sm hover:shadow-md"
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-bold text-[#3D2B1F] mb-1.5">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="relative">
                    <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B5A2B]/50 group-focus-within:text-[#FF6B35] transition-colors" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+225 01 02 03 04 05"
                      className="w-full pl-12 pr-4 py-3 bg-white border-2 border-[#D4A855]/20 rounded-xl text-[#3D2B1F] font-bold placeholder-[#8B5A2B]/40 focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] outline-none transition-all shadow-sm hover:shadow-md"
                      autoComplete="tel"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-[#3D2B1F] mb-1.5">
                  Email <span className="text-[#8B5A2B]/50 font-normal">(optionnel)</span>
                </label>
                <div className="relative group">
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B5A2B]/50 group-focus-within:text-[#FF6B35] transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemple@email.com"
                      className="w-full pl-12 pr-4 py-3 bg-white border-2 border-[#D4A855]/20 rounded-xl text-[#3D2B1F] font-bold placeholder-[#8B5A2B]/40 focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] outline-none transition-all shadow-sm hover:shadow-md"
                      autoComplete="email"
                    />
                  </div>
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-sm font-bold text-[#3D2B1F] mb-1.5">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="relative">
                    <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B5A2B]/50 group-focus-within:text-[#FF6B35] transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 caractères"
                      className="w-full pl-12 pr-12 py-3 bg-white border-2 border-[#D4A855]/20 rounded-xl text-[#3D2B1F] font-bold placeholder-[#8B5A2B]/40 focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] outline-none transition-all shadow-sm hover:shadow-md"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B5A2B]/50 hover:text-[#FF6B35] transition-colors p-1"
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {password.length > 0 && password.length < 6 && (
                  <p className="text-red-500 text-xs mt-1 font-medium">Le mot de passe doit avoir au moins 6 caractères</p>
                )}
              </div>

              {/* Confirmer mot de passe */}
              <div>
                <label className="block text-sm font-bold text-[#3D2B1F] mb-1.5">
                  Confirmer le mot de passe <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="relative">
                    <ShieldCheckIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B5A2B]/50 group-focus-within:text-[#FF6B35] transition-colors" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3 bg-white border-2 border-[#D4A855]/20 rounded-xl text-[#3D2B1F] font-bold placeholder-[#8B5A2B]/40 focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] outline-none transition-all shadow-sm hover:shadow-md"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="text-red-500 text-xs mt-1 font-medium">Les mots de passe ne correspondent pas</p>
                )}
              </div>

              {/* Conditions */}
              <label className="flex items-start gap-3 cursor-pointer group py-2 px-1">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded-lg border-2 border-[#D4A855]/30 text-[#FF6B35] focus:ring-[#FF6B35]/30 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-[#8B5A2B]/80 font-medium group-hover:text-[#3D2B1F] transition leading-relaxed">
                  J'accepte les{' '}
                  <span className="text-[#FF6B35] font-bold hover:underline cursor-pointer">
                    conditions d'utilisation
                  </span>{' '}
                  et la{' '}
                  <span className="text-[#FF6B35] font-bold hover:underline cursor-pointer">
                    politique de confidentialité
                  </span>
                </span>
              </label>

              {/* Bouton inscription */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white py-3.5 rounded-xl font-bold text-base hover:shadow-xl hover:shadow-[#FF6B35]/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Création du compte...
                  </span>
                ) : (
                  `Créer mon compte ${accountType === 'creator' ? 'Créateur' : 'Client'}`
                )}
              </button>

              {/* Lien connexion */}
              <p className="text-center text-sm text-[#8B5A2B] font-medium mt-4">
                Déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-[#FF6B35] font-bold hover:underline transition"
                >
                  Se connecter
                </button>
              </p>
            </form>
          )}

          {/* Footer sécurité */}
          <div className="mt-8 pt-6 border-t border-[#D4A855]/10">
            <div className="flex items-center justify-center gap-2 text-[10px] text-[#8B5A2B]/60 font-medium">
              <ShieldCheckIcon className="w-4 h-4 text-green-500" />
              <span>Vos données sont sécurisées et chiffrées</span>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  )
}