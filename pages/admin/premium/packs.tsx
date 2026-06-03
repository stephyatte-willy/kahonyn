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
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface CoinPack {
  id: string
  name: string
  description: string
  coins: number
  price: number
  bonus: number
  isPopular: boolean
  isActive: boolean
  sortOrder: number
  promotionText: string
}

export default function AdminPacks() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [packs, setPacks] = useState<CoinPack[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPack, setEditingPack] = useState<CoinPack | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    coins: 250,
    price: 1000,
    bonus: 50,
    isPopular: false,
    isActive: true,
    sortOrder: 0,
    promotionText: ''
  })

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if ((session?.user as any)?.role !== 'admin') { router.push('/'); return }
    fetchPacks()
  }, [session, sessionStatus, router])

  const fetchPacks = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/coin-packs')
      const data = await res.json()
      setPacks(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingPack(null)
    setForm({ name: '', description: '', coins: 250, price: 1000, bonus: 50, isPopular: false, isActive: true, sortOrder: packs.length, promotionText: '' })
    setIsModalOpen(true)
  }

  const handleEdit = (pack: CoinPack) => {
    setEditingPack(pack)
    setForm({
      name: pack.name,
      description: pack.description || '',
      coins: pack.coins,
      price: pack.price,
      bonus: pack.bonus,
      isPopular: pack.isPopular,
      isActive: pack.isActive,
      sortOrder: pack.sortOrder,
      promotionText: pack.promotionText || ''
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Le nom est requis'); return }
    setSaving(true)
    try {
      const url = editingPack ? `/api/admin/coin-packs/${editingPack.id}` : '/api/admin/coin-packs'
      const method = editingPack ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) {
        toast.success(editingPack ? 'Pack modifié' : 'Pack créé')
        setIsModalOpen(false)
        fetchPacks()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur')
      }
    } catch { toast.error('Erreur réseau') }
    finally { setSaving(false) }
  }

  const handleToggleActive = async (pack: CoinPack) => {
    try {
      const res = await fetch(`/api/admin/coin-packs/${pack.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !pack.isActive })
      })
      if (res.ok) { toast.success(pack.isActive ? 'Pack désactivé' : 'Pack activé'); fetchPacks() }
    } catch { toast.error('Erreur réseau') }
  }

  const handleDelete = async (pack: CoinPack) => {
    if (!confirm(`Supprimer le pack "${pack.name}" ?`)) return
    try {
      const res = await fetch(`/api/admin/coin-packs/${pack.id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Pack supprimé'); fetchPacks() }
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
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Packs de coins</h1>
            <p className="text-gray-500 text-sm mt-1">Gérez les offres de coins affichées sur la page Premium</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchPacks} className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"><ArrowPathIcon className="w-4 h-4" /> Actualiser</button>
            <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#FF8C5A] transition"><PlusIcon className="w-4 h-4" /> Nouveau pack</button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {packs.length === 0 ? (
            <div className="p-12 text-center">
              <CurrencyDollarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun pack de coins</p>
              <button onClick={handleCreate} className="mt-3 text-[#FF6B35] hover:underline font-bold">Créer le premier pack</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Ordre</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Coins</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Bonus</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Prix (FCFA)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Promo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {packs.map((pack) => (
                    <tr key={pack.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm">{pack.sortOrder}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-sm text-gray-900">{pack.name}</p>
                        {pack.isPopular && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">⭐ Populaire</span>}
                      </td>
                      <td className="px-4 py-3 font-bold">{pack.coins.toLocaleString()}</td>
                      <td className="px-4 py-3 text-green-600 font-bold">+{pack.bonus}</td>
                      <td className="px-4 py-3 font-bold text-[#FF6B35]">{pack.price.toLocaleString()}</td>
                      <td className="px-4 py-3">{pack.promotionText && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{pack.promotionText}</span>}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggleActive(pack)}>
                          {pack.isActive ? <span className="flex items-center gap-1 text-green-600 text-xs font-bold"><CheckCircleIcon className="w-4 h-4" /> Actif</span>
                            : <span className="flex items-center gap-1 text-red-600 text-xs font-bold"><XCircleIcon className="w-4 h-4" /> Inactif</span>}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(pack)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Modifier"><PencilIcon className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(pack)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer"><TrashIcon className="w-4 h-4" /></button>
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
              <h2 className="text-lg font-bold text-gray-800">{editingPack ? 'Modifier le pack' : 'Nouveau pack'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-full"><XMarkIcon className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nom</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] outline-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Coins</label><input type="number" value={form.coins} onChange={(e) => setForm({ ...form, coins: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Bonus</label><input type="number" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Prix (FCFA)</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Ordre</label><input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] outline-none" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Texte promotionnel</label><input type="text" value={form.promotionText} onChange={(e) => setForm({ ...form, promotionText: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] outline-none" placeholder="Ex: -30%, Offre limitée" /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.isPopular} onChange={(e) => setForm({ ...form, isPopular: e.target.checked })} className="w-4 h-4 rounded text-[#FF6B35] focus:ring-[#FF6B35]" />
                <span className="text-sm text-gray-700">Pack populaire</span>
              </div>
            </div>
            <div className="p-4 border-t flex gap-3">
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white py-2.5 rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50">
                {saving ? 'Sauvegarde...' : editingPack ? 'Modifier' : 'Créer'}
              </button>
              <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-300 transition">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}