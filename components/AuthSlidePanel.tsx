"use client"

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import { 
  XMarkIcon, PhoneIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, 
  UserIcon, EnvelopeIcon, UserGroupIcon, VideoCameraIcon, 
  CheckCircleIcon, ShieldCheckIcon 
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
// ✅ IMPORT errorHandler
import { handleError, safeFetch } from '../utils/errorHandler'

interface AuthSlidePanelProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
  onSwitchMode?: (mode: 'login' | 'register') => void
}

export default function AuthSlidePanel({ 
  isOpen, onClose, initialMode = 'login', onSwitchMode 
}: AuthSlidePanelProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [accountType, setAccountType] = useState<'client' | 'creator'>('client')

  useEffect(() => { setMode(initialMode) }, [initialMode])
  
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
  
  useEffect(() => { 
    if (isOpen) { 
      const p = new URLSearchParams(window.location.search)
      const r = p.get('returnUrl')
      if (r) localStorage.setItem('kahonyn_returnUrl', r)
    } 
  }, [isOpen])

  const switchMode = (newMode: 'login' | 'register') => { 
    setMode(newMode)
    onSwitchMode?.(newMode) 
  }

  // ✅ FONCTION DE VALIDATION DU TÉLÉPHONE
  const validatePhone = (phoneNumber: string): boolean => {
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    if (cleanPhone.length < 8) {
      toast.error('Numéro invalide (8 chiffres minimum)', { duration: 2000 })
      return false
    }
    if (cleanPhone.length > 12) {
      toast.error('Numéro trop long', { duration: 2000 })
      return false
    }
    return true
  }

  // ✅ FONCTION DE VALIDATION DU MOT DE PASSE
  const validatePassword = (pwd: string): boolean => {
    if (pwd.length < 6) {
      toast.error('Mot de passe : 6 caractères minimum', { duration: 2000 })
      return false
    }
    return true
  }

  // ✅ handleLogin AMÉLIORÉ avec errorHandler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!phone || !password) {
      toast.error('Veuillez remplir tous les champs', { duration: 2000 })
      return
    }
    
    const cleanPhone = phone.replace(/\D/g, '')
    if (!validatePhone(cleanPhone)) return
    
    setLoading(true)
    
    try {
      const result = await signIn('credentials', { 
        phone: cleanPhone, 
        password, 
        redirect: false 
      })
      
      if (result?.error) {
        // Messages d'erreur plus clairs
        if (result.error === 'CredentialsSignin') {
          toast.error('Téléphone ou mot de passe incorrect', { duration: 2500 })
        } else if (result.error.toLowerCase().includes('phone')) {
          toast.error('Ce numéro n\'est pas enregistré', { duration: 2500 })
        } else if (result.error.toLowerCase().includes('password')) {
          toast.error('Mot de passe incorrect', { duration: 2500 })
        } else {
          toast.error(result.error, { duration: 2500 })
        }
      } else if (result?.ok) {
        toast.success('Connexion réussie !', { duration: 2000 })
        const returnUrl = localStorage.getItem('kahonyn_returnUrl')
        localStorage.removeItem('kahonyn_returnUrl')
        onClose()
        setTimeout(() => router.push(returnUrl || '/'), 300)
      }
    } catch (error: any) {
      handleError(error, 'handleLogin')
    } finally {
      setLoading(false)
    }
  }

  // ✅ handleGoogleLogin AMÉLIORÉ
  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    try {
      await signIn('google', { 
        callbackUrl: localStorage.getItem('kahonyn_returnUrl') || '/', 
        redirect: true 
      })
    } catch (error: any) {
      handleError(error, 'handleGoogleLogin')
      setGoogleLoading(false)
    }
  }

  // ✅ handleRegister AMÉLIORÉ avec safeFetch
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validations
    if (!name || !phone || !password || !confirmPassword) {
      toast.error('Veuillez remplir tous les champs', { duration: 2000 })
      return
    }
    
    const cleanPhone = phone.replace(/\D/g, '')
    if (!validatePhone(cleanPhone)) return
    if (!validatePassword(password)) return
    
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
      // Utilisation de safeFetch pour l'inscription
      const data = await safeFetch<{ success: boolean; user?: any; error?: string }>(
        '/api/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ 
            name: name.trim(), 
            phone: cleanPhone, 
            password, 
            email: email.trim() || undefined, 
            role: accountType 
          })
        },
        'handleRegister'
      )
      
      if (data && !data.error) {
        toast.success('Compte créé avec succès !', { duration: 2000 })
        
        // Connexion automatique après inscription
        const loginResult = await signIn('credentials', { 
          phone: cleanPhone, 
          password, 
          redirect: false 
        })
        
        if (loginResult?.ok && !loginResult.error) {
          const returnUrl = localStorage.getItem('kahonyn_returnUrl')
          localStorage.removeItem('kahonyn_returnUrl')
          onClose()
          setTimeout(() => router.push(returnUrl || '/'), 300)
        } else {
          // Si la connexion auto échoue, on redirige vers la page de connexion
          toast.success('Compte créé ! Connectez-vous maintenant', { duration: 2000 })
          switchMode('login')
        }
      } else if (data?.error) {
        toast.error(data.error, { duration: 2500 })
      }
    } catch (error: any) {
      handleError(error, 'handleRegister')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-gradient-to-b from-[#0D0D0D] to-[#1A1A2E] z-50 shadow-2xl overflow-y-auto animate-slideIn border-l border-white/[0.06]">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2.5 hover:bg-white/[0.06] rounded-full transition z-10 group"
        >
          <XMarkIcon className="w-6 h-6 text-white/70 group-hover:text-white" />
        </button>

        <div className="p-6 pt-16">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] flex items-center justify-center shadow-xl shadow-[#FF6B35]/20 mx-auto mb-5 text-3xl">
              🎬
            </div>
            <h2 className="text-xl font-bold text-white">
              {mode === 'login' ? 'Bienvenue !' : 'Rejoignez-nous'}
            </h2>
            <p className="text-sm text-white/50 mt-1 font-medium">
              {mode === 'login' 
                ? 'Connectez-vous pour accéder au contenu' 
                : 'Créez votre compte et commencez l\'aventure'}
            </p>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1.5">Téléphone</label>
                <div className="relative">
                  <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="0102030405" 
                    className="w-full pl-12 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white font-semibold placeholder-white/20 focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] outline-none transition-all" 
                    autoComplete="tel" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1.5">Mot de passe</label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className="w-full pl-12 pr-12 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white font-semibold placeholder-white/20 focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] outline-none transition-all" 
                    autoComplete="current-password" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition p-1"
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white py-3.5 rounded-xl font-bold hover:shadow-xl hover:shadow-[#FF6B35]/25 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Connexion...
                  </span>
                ) : 'Se connecter'}
              </button>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.08]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-[#0D0D0D] text-white/40 font-semibold">ou continuer avec</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={handleGoogleLogin} 
                disabled={googleLoading} 
                className="w-full flex items-center justify-center gap-3 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white font-semibold hover:bg-white/[0.08] transition disabled:opacity-50"
              >
                {googleLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continuer avec Google
                  </>
                )}
              </button>
              <p className="text-center text-sm text-white/50 font-medium mt-6">
                Pas encore de compte ? 
                <button type="button" onClick={() => switchMode('register')} className="text-[#FF6B35] font-bold hover:underline ml-1">
                  S'inscrire
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="mb-2">
                <label className="block text-sm font-semibold text-white/80 mb-3 text-center">
                  Choisissez votre type de compte
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button" 
                    onClick={() => setAccountType('client')} 
                    className={`relative p-4 rounded-2xl border-2 transition-all duration-300 text-center ${
                      accountType === 'client' 
                        ? 'border-[#FF6B35] bg-[#FF6B35]/5' 
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                    }`}
                  >
                    {accountType === 'client' && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#FF6B35] rounded-full flex items-center justify-center shadow-md">
                        <CheckCircleIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2 ${
                      accountType === 'client' ? 'bg-[#FF6B35]/10' : 'bg-white/[0.04]'
                    }`}>
                      <UserGroupIcon className={`w-6 h-6 ${
                        accountType === 'client' ? 'text-[#FF6B35]' : 'text-white/30'
                      }`} />
                    </div>
                    <p className={`font-bold text-sm ${accountType === 'client' ? 'text-[#FF6B35]' : 'text-white/70'}`}>
                      Client
                    </p>
                    <p className="text-[10px] text-white/40 mt-1">Regarder et acheter des vidéos</p>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setAccountType('creator')} 
                    className={`relative p-4 rounded-2xl border-2 transition-all duration-300 text-center ${
                      accountType === 'creator' 
                        ? 'border-[#FF6B35] bg-[#FF6B35]/5' 
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                    }`}
                  >
                    {accountType === 'creator' && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#FF6B35] rounded-full flex items-center justify-center shadow-md">
                        <CheckCircleIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2 ${
                      accountType === 'creator' ? 'bg-[#FF6B35]/10' : 'bg-white/[0.04]'
                    }`}>
                      <VideoCameraIcon className={`w-6 h-6 ${
                        accountType === 'creator' ? 'text-[#FF6B35]' : 'text-white/30'
                      }`} />
                    </div>
                    <p className={`font-bold text-sm ${accountType === 'creator' ? 'text-[#FF6B35]' : 'text-white/70'}`}>
                      Créateur
                    </p>
                    <p className="text-[10px] text-white/40 mt-1">Publier et gagner de l'argent</p>
                  </button>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.08]"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-[#0D0D0D] text-white/30 font-bold uppercase">Informations</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1.5">
                  Nom complet <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Votre nom complet" 
                    className="w-full pl-12 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white font-semibold placeholder-white/20 focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] outline-none transition-all" 
                    required 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1.5">
                  Téléphone <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="0102030405" 
                    className="w-full pl-12 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white font-semibold placeholder-white/20 focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] outline-none transition-all" 
                    required 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1.5">
                  Email <span className="text-white/30 font-normal">(optionnel)</span>
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="exemple@email.com" 
                    className="w-full pl-12 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white font-semibold placeholder-white/20 focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] outline-none transition-all" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1.5">
                  Mot de passe <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Minimum 6 caractères" 
                    className="w-full pl-12 pr-12 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white font-semibold placeholder-white/20 focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] outline-none transition-all" 
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition p-1"
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                {password.length > 0 && password.length < 6 && (
                  <p className="text-red-400 text-xs mt-1">6 caractères minimum</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1.5">
                  Confirmer le mot de passe <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <ShieldCheckIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className="w-full pl-12 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white font-semibold placeholder-white/20 focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] outline-none transition-all" 
                    required 
                  />
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">Les mots de passe ne correspondent pas</p>
                )}
              </div>
              <label className="flex items-start gap-3 cursor-pointer py-2">
                <input 
                  type="checkbox" 
                  checked={acceptTerms} 
                  onChange={(e) => setAcceptTerms(e.target.checked)} 
                  className="mt-0.5 w-5 h-5 rounded-lg border-2 border-white/20 text-[#FF6B35] focus:ring-[#FF6B35]/30 cursor-pointer" 
                />
                <span className="text-xs text-white/50 font-medium">
                  J'accepte les <span className="text-[#FF6B35] font-bold hover:underline cursor-pointer">conditions d'utilisation</span> 
                  et la <span className="text-[#FF6B35] font-bold hover:underline cursor-pointer">politique de confidentialité</span>
                </span>
              </label>
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white py-3.5 rounded-xl font-bold hover:shadow-xl hover:shadow-[#FF6B35]/25 transition disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Création...
                  </span>
                ) : `Créer mon compte ${accountType === 'creator' ? 'Créateur' : 'Client'}`}
              </button>
              <p className="text-center text-sm text-white/50 font-medium mt-4">
                Déjà un compte ? 
                <button type="button" onClick={() => switchMode('login')} className="text-[#FF6B35] font-bold hover:underline ml-1">
                  Se connecter
                </button>
              </p>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-white/[0.06] flex items-center justify-center gap-2 text-[10px] text-white/40 font-medium">
            <ShieldCheckIcon className="w-4 h-4 text-green-400" />
            <span>Vos données sont sécurisées et chiffrées</span>
          </div>
        </div>
      </div>
      
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
          animation: fadeIn .2s ease-out;
        }
        .animate-slideIn {
          animation: slideIn .35s cubic-bezier(.16,1,.3,1);
        }
      `}</style>
    </>
  )
}