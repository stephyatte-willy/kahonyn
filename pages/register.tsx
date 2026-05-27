import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { EyeIcon, EyeSlashIcon, PhoneIcon, UserIcon, EnvelopeIcon, KeyIcon, UserGroupIcon, VideoCameraIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import Navbar from '../components/Navbar'
import toast, { Toaster } from 'react-hot-toast'

type RoleType = 'user' | 'creator'

export default function Register() {
  const router = useRouter()
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
        toast.success(`Inscription réussie ! Bienvenue ${selectedRole === 'creator' ? 'créateur' : 'utilisateur'} !`)
        setTimeout(() => router.push('/login'), 2000)
      } else {
        toast.error(data.error || 'Une erreur est survenue')
      }
    } catch (err) {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#1A1A1A',
          color: '#FFF8F0',
          borderRadius: '16px',
        },
        success: {
          iconTheme: { primary: '#FF6B35', secondary: '#1A1A1A' },
          duration: 3000,
        },
        error: {
          iconTheme: { primary: '#FF6B35', secondary: '#1A1A1A' },
          duration: 4000,
        },
      }} />
      <Navbar />
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-73px)]">
        <div className="card card_formulaire max-w-md animate-fadeInUp">
          {/* Logo et titre */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Image src="/logo-kahonyn.png" alt="Kahonyn" width={80} height={80} className="w-9 h-9" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text">
                Kahonyn
              </h1>
            </div>
            <p className="style1">Rejoignez l'aventure !</p>
          </div>

          {/* Sélection du rôle */}
          <div className="mb-6">
            <label className="label block text-center mb-3">Je suis :</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setSelectedRole('user')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
                  selectedRole === 'user'
                    ? 'border-orange-500 bg-orange-50 text-orange-600'
                    : 'border-gray-200 text-gray-500 hover:border-orange-300'
                }`}
              >
                <UserGroupIcon className="w-5 h-5" />
                <span className="font-medium">Utilisateur</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('creator')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
                  selectedRole === 'creator'
                    ? 'border-orange-500 bg-orange-50 text-orange-600'
                    : 'border-gray-200 text-gray-500 hover:border-orange-300'
                }`}
              >
                <VideoCameraIcon className="w-5 h-5" />
                <span className="font-medium">Créateur</span>
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              {selectedRole === 'creator' 
                ? 'En tant que créateur, vous pourrez publier vos vidéos et gagner de l\'argent'
                : 'En tant qu\'utilisateur, vous pourrez regarder et acheter des vidéos'}
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="input_formulaire">
              <label className="label">Téléphone <span className="text-orange-500">*</span></label>
              <div className="relative">
                <PhoneIcon className="input-icon" />
                <input
                  type="tel"
                  name="phone"
                  className="input-field input-field-with-icon"
                  placeholder="0501010101"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input_formulaire">
              <label className="label">Nom complet</label>
              <div className="relative">
                <UserIcon className="input-icon" />
                <input
                  type="text"
                  name="name"
                  className="input-field input-field-with-icon"
                  placeholder="Votre nom"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="input_formulaire">
              <label className="label">Email</label>
              <div className="relative">
                <EnvelopeIcon className="input-icon" />
                <input
                  type="email"
                  name="email"
                  className="input-field input-field-with-icon"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {selectedRole === 'creator' && (
              <div className="input_formulaire">
                <label className="label">Bio / Présentation</label>
                <textarea
                  name="bio"
                  className="input-field"
                  rows={3}
                  placeholder="Présentez-vous en tant que créateur..."
                  value={formData.bio}
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="input_formulaire">
              <label className="label">Mot de passe <span className="text-orange-500">*</span></label>
              <div className="relative">
                <KeyIcon className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="input-field input-field-with-icon"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeSlashIcon className="w-full h-full" /> : <EyeIcon className="w-full h-full" />}
                </button>
              </div>
            </div>

            <div className="input_formulaire">
              <label className="label">Confirmer <span className="text-orange-500">*</span></label>
              <div className="relative">
                <KeyIcon className="input-icon" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className="input-field input-field-with-icon"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="eye-icon"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeSlashIcon className="w-full h-full" /> : <EyeIcon className="w-full h-full" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Inscription...
                </span>
              ) : (
                `S'inscrire en tant que ${selectedRole === 'creator' ? 'créateur' : 'utilisateur'}`
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm input_formulaire mt-6">
            Déjà inscrit ?{' '}
            <Link href="/login" className="text-orange-500 font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}