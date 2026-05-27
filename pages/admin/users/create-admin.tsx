"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import AdminLayout from '../layout'
import { ShieldCheckIcon, UserPlusIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import toast, { Toaster } from 'react-hot-toast'

export default function CreateAdmin() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!session || session.user?.role !== 'admin') {
      router.push('/')
    }
  }, [session, sessionStatus, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      toast.error('Le mot de passe doit avoir au moins 6 caractères')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          password: formData.password
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Administrateur créé avec succès !')
        setFormData({ name: '', phone: '', email: '', password: '', confirmPassword: '' })
      } else {
        toast.error(data.error || 'Erreur lors de la création')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  if (sessionStatus === 'loading') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </AdminLayout>
    )
  }

  if (!session || session.user?.role !== 'admin') {
    return null
  }

  return (
    <AdminLayout>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1A1A1A', color: '#FFF8F0', borderRadius: '16px' },
        success: { iconTheme: { primary: '#FF6B35', secondary: '#1A1A1A' } },
        error: { iconTheme: { primary: '#FF6B35', secondary: '#1A1A1A' } },
      }} />

      <div className="max-w-lg mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheckIcon className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Créer un administrateur</h1>
          <p className="text-gray-500 text-sm mt-1">Seul un administrateur peut créer un autre administrateur</p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom complet
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="Nom de l'administrateur"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="0501010101"
                required
              />
              <p className="text-xs text-gray-400 mt-1">10 chiffres (ex: 0501010101)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="admin@exemple.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none pr-10"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500"
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le mot de passe <span className="text-red-500">*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-2 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Création...
                </>
              ) : (
                <>
                  <UserPlusIcon className="w-4 h-4" />
                  Créer l'administrateur
                </>
              )}
            </button>
          </form>

          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-xs text-yellow-700">
              ⚠️ Seuls les administrateurs existants peuvent créer de nouveaux administrateurs.
              Cette action est sécurisée et journalisée.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}