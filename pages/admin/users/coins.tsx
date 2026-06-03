"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import React from 'react'
import AdminLayout from '../layout'
import { 
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PencilIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface User {
  id: string
  phone: string
  name: string
  email: string
  role: string
  coins: number
}

type ActionType = 'credit' | 'debit' | 'set'

export default function UserCoinsManagement() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [actionType, setActionType] = useState<ActionType>('credit')
  const [amount, setAmount] = useState(100)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if ((session?.user as any)?.role !== 'admin') {
      router.push('/')
      return
    }
    fetchUsers()
  }, [session, sessionStatus, router])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error('Erreur chargement')
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Impossible de charger les utilisateurs')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (user.name || '').toLowerCase().includes(term) ||
      (user.phone || '').includes(term) ||
      (user.email || '').toLowerCase().includes(term)
    )
  })

  const handleActionClick = (user: User, action: ActionType) => {
    setSelectedUser(user)
    setActionType(action)
    setAmount(action === 'set' ? (user.coins || 0) : 100)
    setReason('')
    setIsModalOpen(true)
  }

  const handleConfirmAction = () => {
    if (amount <= 0) {
      toast.error('Le montant doit être supérieur à 0')
      return
    }

    // Vérification spéciale pour le débit
    if (actionType === 'debit' && selectedUser && amount > (selectedUser.coins || 0)) {
      toast.error('Solde insuffisant pour ce débit')
      return
    }

    setIsConfirmModalOpen(true)
  }

  const executeAction = async () => {
    if (!selectedUser) return

    setSaving(true)
    try {
      const res = await fetch('/api/admin/manage-coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: actionType,
          amount: amount,
          reason: reason || getDefaultReason()
        })
      })

      const data = await res.json()

      if (res.ok) {
        const actionLabels: Record<ActionType, string> = {
          credit: 'crédités',
          debit: 'débités',
          set: 'définis'
        }
        toast.success(`${amount} coins ${actionLabels[actionType]} pour ${selectedUser.name || selectedUser.phone}`)
        setIsModalOpen(false)
        setIsConfirmModalOpen(false)
        fetchUsers()
      } else {
        toast.error(data.error || 'Erreur lors de l\'opération')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  const getDefaultReason = (): string => {
    const reasons: Record<ActionType, string> = {
      credit: 'Crédit administrateur',
      debit: 'Débit administrateur',
      set: 'Ajustement administrateur'
    }
    return reasons[actionType]
  }

  const getActionColor = (action: ActionType): string => {
    const colors: Record<ActionType, string> = {
      credit: 'from-green-500 to-emerald-600',
      debit: 'from-red-500 to-rose-600',
      set: 'from-blue-500 to-indigo-600'
    }
    return colors[action]
  }

  const getActionIcon = (action: ActionType) => {
    const icons: Record<ActionType, React.ElementType> = {
      credit: ArrowUpIcon,
      debit: ArrowDownIcon,
      set: PencilIcon
    }
    return icons[action]
  }

  const getActionLabel = (action: ActionType): string => {
    const labels: Record<ActionType, string> = {
      credit: 'Créditer',
      debit: 'Débiter',
      set: 'Définir'
    }
    return labels[action]
  }

  const getNewBalance = (): number => {
    if (!selectedUser) return 0
    const currentBalance = selectedUser.coins || 0
    switch (actionType) {
      case 'credit': return currentBalance + amount
      case 'debit': return currentBalance - amount
      case 'set': return amount
      default: return currentBalance
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

  if (!session || (session.user as any)?.role !== 'admin') return null

  const ActionIcon = getActionIcon(actionType)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestion des coins</h1>
            <p className="text-gray-500 text-sm mt-1">Créditez, débitez ou définissez le solde des utilisateurs</p>
          </div>
          <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition">
            <ArrowPathIcon className="w-4 h-4" /> Actualiser
          </button>
        </div>

        {/* Recherche */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Rechercher par nom, téléphone ou email..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
        </div>

        {/* Tableau des utilisateurs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <UserCircleIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Utilisateur</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Rôle</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Solde actuel</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <p className="font-bold text-sm text-gray-900">{user.name || 'Sans nom'}</p>
                        <p className="text-xs text-gray-500">{user.phone}</p>
                        {user.email && <p className="text-[10px] text-gray-400">{user.email}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          user.role === 'admin' ? 'bg-red-100 text-red-700' :
                          user.role === 'creator' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : user.role === 'creator' ? 'Créateur' : 'Client'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-lg font-bold text-[#FF6B35]">{user.coins || 0}</span>
                        <span className="text-sm text-gray-500 ml-1">🪙</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-1.5">
                          <button onClick={() => handleActionClick(user, 'credit')}
                            className="px-2.5 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold hover:bg-green-200 transition flex items-center gap-1"
                            title="Créditer des coins">
                            <ArrowUpIcon className="w-3 h-3" /> Créditer
                          </button>
                          <button onClick={() => handleActionClick(user, 'debit')}
                            className="px-2.5 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition flex items-center gap-1"
                            title="Débiter des coins">
                            <ArrowDownIcon className="w-3 h-3" /> Débiter
                          </button>
                          <button onClick={() => handleActionClick(user, 'set')}
                            className="px-2.5 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition flex items-center gap-1"
                            title="Définir un montant exact">
                            <PencilIcon className="w-3 h-3" /> Définir
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

      {/* Modal d'action */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <ActionIcon className="w-5 h-5" />
                {getActionLabel(actionType)} des coins
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-full transition">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* Info utilisateur */}
              <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">
                  Utilisateur : <span className="font-bold text-gray-900">{selectedUser.name || selectedUser.phone}</span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Solde actuel : <span className="font-bold text-[#FF6B35]">{selectedUser.coins || 0} 🪙</span>
                </p>
              </div>

              {/* Sélecteur d'action */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Type d'action</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['credit', 'debit', 'set'] as ActionType[]).map((action) => (
                    <button key={action} type="button" onClick={() => setActionType(action)}
                      className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                        actionType === action 
                          ? `bg-gradient-to-r ${getActionColor(action)} text-white shadow-md` 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>
                      {React.createElement(getActionIcon(action), { className: "w-3.5 h-3.5" })}
                      {getActionLabel(action)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Montant */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {actionType === 'set' ? 'Nouveau solde' : 'Montant'} (coins)
                </label>
                
                {/* Montants rapides */}
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[50, 100, 200, 500, 1000, 2000, 5000].map((quickAmount) => (
                    <button key={quickAmount} type="button" onClick={() => setAmount(quickAmount)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition ${
                        amount === quickAmount ? 'bg-[#FF6B35] text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>
                      {quickAmount >= 1000 ? `${quickAmount / 1000}k` : quickAmount}
                    </button>
                  ))}
                </div>

                {/* Champ personnalisé */}
                <input type="number" value={amount} onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] outline-none" min={1} />
              </div>

              {/* Raison */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Raison (optionnel)</label>
                <input type="text" value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder={getDefaultReason()}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] outline-none" />
              </div>

              {/* Résumé */}
              <div className={`p-3 rounded-xl border ${
                actionType === 'debit' && amount > (selectedUser.coins || 0) 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <p className="text-sm font-bold">
                  {actionType === 'credit' && `➕ Ajouter ${amount} coins`}
                  {actionType === 'debit' && `➖ Retirer ${amount} coins`}
                  {actionType === 'set' && `✏️ Définir le solde à ${amount} coins`}
                </p>
                <p className={`text-lg font-bold mt-1 ${
                  actionType === 'debit' && amount > (selectedUser.coins || 0) 
                    ? 'text-red-600' 
                    : actionType === 'credit' 
                    ? 'text-green-600' 
                    : 'text-blue-600'
                }`}>
                  Nouveau solde : {getNewBalance()} 🪙
                </p>
                {actionType === 'debit' && amount > (selectedUser.coins || 0) && (
                  <p className="text-xs text-red-600 mt-1 font-bold">⚠️ Solde insuffisant pour ce débit</p>
                )}
              </div>
            </div>

            <div className="p-4 border-t flex gap-3">
              <button onClick={handleConfirmAction} disabled={amount <= 0 || (actionType === 'debit' && amount > (selectedUser.coins || 0))}
                className={`flex-1 py-2.5 rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 text-white bg-gradient-to-r ${getActionColor(actionType)}`}>
                <ActionIcon className="w-4 h-4" />
                {getActionLabel(actionType)} {amount} coins
              </button>
              <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-300 transition">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation */}
      {isConfirmModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                actionType === 'credit' ? 'bg-green-100' : actionType === 'debit' ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                <ExclamationTriangleIcon className={`w-8 h-8 ${
                  actionType === 'credit' ? 'text-green-500' : actionType === 'debit' ? 'text-red-500' : 'text-blue-500'
                }`} />
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Confirmer l'opération</h2>
              <p className="text-gray-600 text-sm mb-4">
                {actionType === 'credit' && `Ajouter ${amount} coins à ${selectedUser.name || selectedUser.phone} ?`}
                {actionType === 'debit' && `Retirer ${amount} coins à ${selectedUser.name || selectedUser.phone} ?`}
                {actionType === 'set' && `Définir le solde de ${selectedUser.name || selectedUser.phone} à ${amount} coins ?`}
              </p>
              <p className="text-sm text-gray-500 mb-2">
                Solde actuel : {selectedUser.coins || 0} 🪙
              </p>
              <p className="text-sm font-bold mb-6">
                Nouveau solde : {getNewBalance()} 🪙
              </p>
              <div className="flex gap-3">
                <button onClick={executeAction} disabled={saving}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-white transition disabled:opacity-50 flex items-center justify-center gap-2 bg-gradient-to-r ${getActionColor(actionType)}`}>
                  {saving ? <><div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div> Exécution...</> : 'Confirmer'}
                </button>
                <button onClick={() => setIsConfirmModalOpen(false)} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-300 transition">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}