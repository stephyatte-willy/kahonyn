"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import AdminLayout from '../layout'
import { 
  PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon,
  XMarkIcon, ArrowPathIcon, SparklesIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface VipBenefit {
  id: string
  title: string
  description: string
  icon: string
  isActive: boolean
  sortOrder: number
}

const availableIcons = [
  'CloudArrowDownIcon', 'EyeIcon', 'StarIcon', 'GiftIcon', 
  'ShieldCheckIcon', 'SparklesIcon', 'TrophyIcon', 'HeartIcon',
  'VideoCameraIcon', 'FilmIcon', 'PlayIcon', 'BookmarkIcon'
]

export default function AdminBenefits() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [benefits, setBenefits] = useState<VipBenefit[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBenefit, setEditingBenefit] = useState<VipBenefit | null>(null)
  const [form, setForm] = useState({ title: '', description: '', icon: 'SparklesIcon', isActive: true, sortOrder: 0 })

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if ((session?.user as any)?.role !== 'admin') { router.push('/'); return }
    fetchBenefits()
  }, [session, sessionStatus, router])

  const fetchBenefits = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/vip-benefits')
      const data = await res.json()
      setBenefits(Array.isArray(data) ? data : [])
    } catch { toast.error('Erreur de chargement') }
    finally { setLoading(false) }
  }

  const handleCreate = () => {
    setEditingBenefit(null)
    setForm({ title: '', description: '', icon: 'SparklesIcon', isActive: true, sortOrder: benefits.length })
    setIsModalOpen(true)
  }

  const handleEdit = (benefit: VipBenefit) => {
    setEditingBenefit(benefit)
    setForm({ title: benefit.title, description: benefit.description || '', icon: benefit.icon, isActive: benefit.isActive, sortOrder: benefit.sortOrder })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Le titre est requis'); return }
    setSaving(true)
    try {
      const url = editingBenefit ? `/api/admin/vip-benefits/${editingBenefit.id}` : '/api/admin/vip-benefits'
      const method = editingBenefit ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { toast.success(editingBenefit ? 'Avantage modifié' : 'Avantage créé'); setIsModalOpen(false); fetchBenefits() }
      else { const data = await res.json(); toast.error(data.error || 'Erreur') }
    } catch { toast.error('Erreur réseau') }
    finally { setSaving(false) }
  }

  const handleToggleActive = async (benefit: VipBenefit) => {
    try {
      const res = await fetch(`/api/admin/vip-benefits/${benefit.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !benefit.isActive }) })
      if (res.ok) { toast.success(benefit.isActive ? 'Désactivé' : 'Activé'); fetchBenefits() }
    } catch { toast.error('Erreur réseau') }
  }

  const handleDelete = async (benefit: VipBenefit) => {
    if (!confirm(`Supprimer "${benefit.title}" ?`)) return
    try {
      const res = await fetch(`/api/admin/vip-benefits/${benefit.id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Supprimé'); fetchBenefits() }
      else { toast.error('Erreur') }
    } catch { toast.error('Erreur réseau') }
  }

  if (sessionStatus === 'loading' || loading) {
    return <AdminLayout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div></AdminLayout>
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div><h1 className="text-2xl font-bold text-gray-800">Avantages VIP</h1><p className="text-gray-500 text-sm mt-1">Gérez les avantages affichés dans la section VIP</p></div>
          <div className="flex gap-2">
            <button onClick={fetchBenefits} className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"><ArrowPathIcon className="w-4 h-4" /> Actualiser</button>
            <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#FF8C5A] transition"><PlusIcon className="w-4 h-4" /> Nouvel avantage</button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {benefits.length === 0 ? (
            <div className="p-12 text-center"><SparklesIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Aucun avantage VIP</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Ordre</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Icône</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Titre</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {benefits.map((benefit) => (
                    <tr key={benefit.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm">{benefit.sortOrder}</td>
                      <td className="px-4 py-3 text-lg">{benefit.icon === 'CloudArrowDownIcon' ? '☁️' : benefit.icon === 'EyeIcon' ? '👁️' : benefit.icon === 'StarIcon' ? '⭐' : benefit.icon === 'GiftIcon' ? '🎁' : benefit.icon === 'ShieldCheckIcon' ? '🛡️' : '✨'}</td>
                      <td className="px-4 py-3 font-bold text-sm">{benefit.title}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{benefit.description}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggleActive(benefit)}>
                          {benefit.isActive ? <span className="flex items-center gap-1 text-green-600 text-xs font-bold"><CheckCircleIcon className="w-4 h-4" /> Actif</span>
                            : <span className="flex items-center gap-1 text-red-600 text-xs font-bold"><XCircleIcon className="w-4 h-4" /> Inactif</span>}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(benefit)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><PencilIcon className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(benefit)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-800">{editingBenefit ? 'Modifier' : 'Nouvel avantage'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-full"><XMarkIcon className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Titre</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Icône</label><select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] outline-none">{availableIcons.map(icon => <option key={icon} value={icon}>{icon}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Ordre</label><input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div className="flex items-center pt-6"><label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded text-[#FF6B35]" /> Actif</label></div>
              </div>
            </div>
            <div className="p-4 border-t flex gap-3">
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white py-2.5 rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50">{saving ? 'Sauvegarde...' : editingBenefit ? 'Modifier' : 'Créer'}</button>
              <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-300 transition">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}