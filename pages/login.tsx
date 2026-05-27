import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { EyeIcon, EyeSlashIcon, PhoneIcon, KeyIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import Navbar from '../components/Navbar'
import toast, { Toaster } from 'react-hot-toast'

export default function Login() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    try {
      const result = await signIn('credentials', {
        phone: formData.phone,
        password: formData.password,
        redirect: false
      })

      if (result?.ok) {
        toast.success('Connexion réussie ! Redirection...')
        setTimeout(() => router.push('/'), 1500)
      } else {
        toast.error('Téléphone ou mot de passe incorrect')
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
        <div className="card p-6 max-w-md card_formulaire animate-fadeInUp">
          {/* Logo et titre */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Image 
                src="/logo-kahonyn.png" 
                alt="Kahonyn" 
                width={80} 
                height={80} 
                className="w-9 h-9"
              />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text">
                Kahonyn
              </h1>
            </div>
            <p className="style1">Bienvenue 😊 !</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="input_formulaire">
              <label className="label">Téléphone</label>
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
              <label className="label">Mot de passe</label>
              <div className="relative">
                <KeyIcon className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="input-field input-field-with-icon"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                 
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

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connexion...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm input_formulaire mt-6">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-orange-500 font-semibold hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}