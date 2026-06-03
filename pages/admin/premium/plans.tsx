"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import AdminLayout from '../layout'
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  EyeIcon,
  StarIcon,
  GiftIcon,
  ShieldCheckIcon,
  CloudArrowDownIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  duration: number
  coinsBonus: number
  dailyCoins: number
  benefits: string
  isPopular: boolean
  isActive: boolean
  sortOrder: number
  color: string
  badge: string
}

const availableBenefits = [
  'Épisodes illimités',
  '10 épisodes/jour',
  '2 épisodes/jour',
  'Qualité Full HD',
  'Qualité HD',
  'Qualité SD',
  'Sans publicité',
  'Téléchargement',
  'Accès anticipé',
  'Badge VIP exclusif',
  'Support prioritaire',
  'Concours privés'
]

const badgeColors = [
  { value: 'gold', label: 'Or' },
  { value: 'purple', label: 'Violet' },
  { value: 'blue', label: 'Bleu' },
  { value: 'red', label: 'Rouge' },
  { value: 'gray', label: 'Gris' },
]

export default function AdminPlans() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([])

  // Formulaire
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 2000,
    duration: 30,
    coinsBonus: 200,
    dailyCoins: 10,
    isPopular: false,
    isActive: true,
    sortOrder: 0,
    color: 'blue',
    badge: ''
  })

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if ((session?.user as any)?.role !== 'admin') {
      router.push('/')
      return
    }
    fetchPlans()
  }, [session, sessionStatus, router])

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/subscription-plans')
      const data = await res.json()
      setPlans(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Erreur de chargement')
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingPlan(null)
    setForm({
      name: '',
      description: '',
      price: 2000,
      duration: 30,
      coinsBonus: 200,
      dailyCoins: 10,
      isPopular: false,
      isActive: true,
      sortOrder: plans.length,
      color: 'blue',
      badge: ''
    })
    setSelectedBenefits([])
    setIsModalOpen(true)
  }

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan)
    setForm({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      duration: plan.duration,
      coinsBonus: plan.coinsBonus,
      dailyCoins: plan.dailyCoins || 0,
      isPopular: plan.isPopular,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
      color: plan.color || 'blue',
      badge: plan.badge || ''
    })
    setSelectedBenefits(plan.benefits ? JSON.parse(plan.benefits) : [])
    setIsModalOpen(true)
  }

  const toggleBenefit = (benefit: string) => {
    setSelectedBenefits(prev => 
      prev.includes(benefit) 
        ? prev.filter(b => b !== benefit)
        : [...prev, benefit]
    )
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Le nom est requis')
      return
    }

    setSaving(true)
    try {
      const url = editingPlan 
        ? `/api/admin/subscription-plans/${editingPlan.id}`
        : '/api/admin/subscription-plans'
      
      const method = editingPlan ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          benefits: JSON.stringify(selectedBenefits)
        })
      })

      if (res.ok) {
        toast.success(editingPlan ? 'Plan modifié' : 'Plan créé')
        setIsModalOpen(false)
        fetchPlans()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (plan: SubscriptionPlan) => {
    try {
      const res = await fetch(`/api/admin/subscription-plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !plan.isActive })
      })
      if (res.ok) {
        toast.success(plan.isActive ? 'Plan désactivé' : 'Plan activé')
        fetchPlans()
      }
    } catch (error) {
      toast.error('Erreur réseau')
    }
  }

  const handleDelete = async (plan: SubscriptionPlan) => {
    if (!confirm(`Supprimer le plan "${plan.name}" ?`)) return
    
    try {
      const res = await fetch(`/api/admin/subscription-plans/${plan.id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        toast.success('Plan supprimé')
        fetchPlans()
      } else {
        toast.error('Erreur')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    }
  }

  if (sessionStatus === 'loading' || loading) {
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
        {/* En-tête */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Plans d'abonnement</h1>
            <p className="text-gray-500 text-sm mt-1">Gérez les offres d'abonnement affichées sur la page Premium</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchPlans} className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition">
              <ArrowPathIcon className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#FF8C5A] transition">
              <PlusIcon className="w-4 h-4" /> Nouveau plan
            </button>
          </div>
        </div>

        {/* Tableau des plans */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {plans.length === 0 ? (
            <div className="p-12 text-center">
              <SparklesIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun plan d'abonnement</p>
              <button onClick={handleCreate} className="mt-3 text-[#FF6B35] hover:underline font-bold">
                Créer le premier plan
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Ordre</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Prix (FCFA)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Durée (j)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Coins bonus</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Badge</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {plans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm">{plan.sortOrder}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-sm text-gray-900">{plan.name}</p>
                        {plan.description && <p className="text-xs text-gray-500">{plan.description}</p>}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#FF6B35]">{plan.price.toLocaleString()}</td>
                      <td className="px-4 py-3">{plan.duration}</td>
                      <td className="px-4 py-3 text-green-600 font-bold">+{plan.coinsBonus}</td>
                      <td className="px-4 py-3">
                        {plan.isPopular && plan.badge && (
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            plan.color === 'gold' ? 'bg-amber-100 text-amber-700' :
                            plan.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                            plan.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {plan.badge}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggleActive(plan)}>
                          {plan.isActive ? (
                            <span className="flex items-center gap-1 text-green-600 text-xs font-bold">
                              <CheckCircleIcon className="w-4 h-4" /> Actif
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600 text-xs font-bold">
                              <XCircleIcon className="w-4 h-4" /> Inactif
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(plan)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Modifier">
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(plan)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer">
                            <TrashIcon className="w-4 h-4" />
                          </button>
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

      {/* Modal création/édition */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-800">
                {editingPlan ? 'Modifier le plan' : 'Nouveau plan'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-full">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] outline-none"
                  placeholder="Ex: Standard, Premium, VIP" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] outline-none"
                  placeholder="Description courte du plan" />
              </div>

              {/* Grille prix/durée */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <CurrencyDollarIcon className="w-4 h-4 inline mr-1" />Prix (FCFA)
                  </label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] outline-none" min={0} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durée (jours)</label>
                  <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] outline-none" min={0} />
                </div>
              </div>

              {/* Coins bonus / quotidiens */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <GiftIcon className="w-4 h-4 inline mr-1" />Coins bonus
                  </label>
                  <input type="number" value={form.coinsBonus} onChange={(e) => setForm({ ...form, coinsBonus: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] outline-none" min={0} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coins/jour</label>
                  <input type="number" value={form.dailyCoins} onChange={(e) => setForm({ ...form, dailyCoins: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] outline-none" min={0} />
                </div>
              </div>

              {/* Badge */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Texte du badge</label>
                  <input type="text" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] outline-none"
                    placeholder="Ex: Populaire, Meilleure valeur" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Couleur du badge</label>
                  <select value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] outline-none">
                    {badgeColors.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ordre + Populaire */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ordre d'affichage</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] outline-none" min={0} />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isPopular} onChange={(e) => setForm({ ...form, isPopular: e.target.checked })}
                      className="w-4 h-4 rounded text-[#FF6B35] focus:ring-[#FF6B35]" />
                    <span className="text-sm text-gray-700">Plan populaire</span>
                  </label>
                </div>
              </div>

              {/* Avantages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <StarIcon className="w-4 h-4 inline mr-1" />Avantages inclus ({selectedBenefits.length} sélectionnés)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {availableBenefits.map((benefit) => (
                    <button key={benefit} type="button" onClick={() => toggleBenefit(benefit)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold text-left transition ${
                        selectedBenefits.includes(benefit)
                          ? 'bg-[#FF6B35] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>
                      {selectedBenefits.includes(benefit) ? '✓ ' : ''}{benefit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actif */}
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[#FF6B35] focus:ring-[#FF6B35]" />
                <span className="text-sm text-gray-700">Plan actif (visible sur la page Premium)</span>
              </div>
            </div>

            {/* Boutons */}
            <div className="p-4 border-t flex gap-3">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white py-2.5 rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50">
                {saving ? 'Sauvegarde...' : editingPlan ? 'Modifier' : 'Créer'}
              </button>
              <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-300 transition">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}