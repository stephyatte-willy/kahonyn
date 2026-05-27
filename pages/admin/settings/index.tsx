"use client"

import { useState, useEffect } from 'react'
import AdminLayout from '../layout'

interface Settings {
  defaultVideoPrice: number
  platformCommission: number
  minWithdrawal: number
  videoApprovalRequired: boolean
  maxVideoDuration: number
  maxVideoSize: number
}

export default function Settings() {
  const [settings, setSettings] = useState<Settings>({
    defaultVideoPrice: 100,
    platformCommission: 30,
    minWithdrawal: 5000,
    videoApprovalRequired: true,
    maxVideoDuration: 300,
    maxVideoSize: 100
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      if (!res.ok) throw new Error('Erreur chargement')
      const data = await res.json()
      setSettings(data)
    } catch (err) {
      setError('Impossible de charger les paramètres')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (!res.ok) throw new Error('Erreur sauvegarde')
      setMessage('Paramètres sauvegardés !')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Paramètres</h1>

        {message && (
          <div className="bg-green-100 text-green-700 p-3 rounded-lg">{message}</div>
        )}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix par défaut (FCFA)
              </label>
              <input
                type="number"
                value={settings.defaultVideoPrice}
                onChange={(e) => setSettings({ ...settings, defaultVideoPrice: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commission plateforme (%)
              </label>
              <input
                type="number"
                value={settings.platformCommission}
                onChange={(e) => setSettings({ ...settings, platformCommission: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-400 mt-1">Les créateurs reçoivent {100 - settings.platformCommission}%</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Retrait minimum (FCFA)
              </label>
              <input
                type="number"
                value={settings.minWithdrawal}
                onChange={(e) => setSettings({ ...settings, minWithdrawal: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durée max vidéo (secondes)
              </label>
              <input
                type="number"
                value={settings.maxVideoDuration}
                onChange={(e) => setSettings({ ...settings, maxVideoDuration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taille max vidéo (MB)
              </label>
              <input
                type="number"
                value={settings.maxVideoSize}
                onChange={(e) => setSettings({ ...settings, maxVideoSize: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.videoApprovalRequired}
                  onChange={(e) => setSettings({ ...settings, videoApprovalRequired: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Validation des vidéos requise</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}