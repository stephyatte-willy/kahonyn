"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import AdminLayout from '../layout'
import { 
  UserGroupIcon, 
  PencilIcon, 
  TrashIcon, 
  ShieldCheckIcon, 
  UserIcon, 
  VideoCameraIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import toast, { Toaster } from 'react-hot-toast'

interface User {
  id: string
  phone: string
  name: string
  email: string
  role: string
  coins: number
  totalEarnings: number
  totalWithdrawn: number
  isActive: boolean
  videos: number
  purchases: number
  createdAt: string
  lastLogin: string
}

export default function UsersManagement() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [actionUser, setActionUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (session?.user?.role !== 'admin') {
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
      setUsers(data)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Impossible de charger les utilisateurs')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const resetFilters = () => {
    setSearchTerm('')
    setRoleFilter('all')
  }

  const handleEdit = (user: User) => {
    setEditingUser({ ...user })
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/update-user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          name: editingUser.name,
          email: editingUser.email,
          coins: editingUser.coins
        })
      })
      if (res.ok) {
        toast.success('Utilisateur modifié avec succès')
        setIsEditModalOpen(false)
        fetchUsers()
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

  const handleChangeRole = (user: User) => {
    setActionUser(user)
    setNewRole(user.role)
    setIsRoleModalOpen(true)
  }

  const confirmRoleChange = async () => {
    if (!actionUser) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/update-user-role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: actionUser.id, role: newRole })
      })
      if (res.ok) {
        toast.success(`Rôle changé en ${getRoleLabel(newRole)}`)
        setIsRoleModalOpen(false)
        fetchUsers()
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

  const handleToggleActive = async (user: User) => {
    try {
      const res = await fetch('/api/admin/toggle-user-active', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, isActive: !user.isActive })
      })
      if (res.ok) {
        toast.success(user.isActive ? 'Utilisateur désactivé' : 'Utilisateur activé')
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    }
  }

  const getRoleBadge = (role: string) => {
    const badges: Record<string, string> = {
      admin: 'bg-red-100 text-red-700',
      creator: 'bg-green-100 text-green-700',
      user: 'bg-blue-100 text-blue-700'
    }
    const labels: Record<string, string> = {
      admin: 'Admin',
      creator: 'Créateur',
      user: 'Utilisateur'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${badges[role] || 'bg-gray-100'}`}>
        {labels[role] || role}
      </span>
    )
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Admin',
      creator: 'Créateur',
      user: 'Utilisateur'
    }
    return labels[role] || role
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Jamais'
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const truncateText = (text: string, maxLength: number = 20) => {
    if (!text) return '—'
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
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

      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestion des utilisateurs</h1>
            <p className="text-gray-500 text-sm mt-1">Gérez les comptes utilisateurs, créateurs et administrateurs</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/users/create-admin">
              <button className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                <ShieldCheckIcon className="w-4 h-4" />
                Nouvel Admin
              </button>
            </Link>
            <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition">
              <ArrowPathIcon className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, téléphone ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="all">Tous les rôles</option>
                <option value="admin">Administrateurs</option>
                <option value="creator">Créateurs</option>
                <option value="user">Utilisateurs</option>
              </select>
              <button onClick={resetFilters} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition flex items-center gap-2">
                <XMarkIcon className="w-4 h-4" />
                Réinitialiser
              </button>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-500">
            {filteredUsers.length} utilisateur(s) sur {users.length}
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">{users.length}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{users.filter(u => u.role === 'admin').length}</p>
            <p className="text-sm text-gray-500">Admins</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{users.filter(u => u.role === 'creator').length}</p>
            <p className="text-sm text-gray-500">Créateurs</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'user').length}</p>
            <p className="text-sm text-gray-500">Utilisateurs</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{users.filter(u => !u.isActive).length}</p>
            <p className="text-sm text-gray-500">Inactifs</p>
          </div>
        </div>

        {/* Tableau des utilisateurs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Nom</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Contact</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Rôle</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Statut</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Vidéos/Achats</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Gains/Coins</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Inscription</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-3 py-3">
                        <p className="font-medium text-sm">{truncateText(user.name || user.phone, 20)}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-sm">{user.phone}</p>
                        <p className="text-xs text-gray-400">{user.email || '—'}</p>
                      </td>
                      <td className="px-3 py-3">{getRoleBadge(user.role)}</td>
                      <td className="px-3 py-3">
                        {user.isActive ? (
                          <span className="flex items-center gap-1 text-green-600 text-xs">
                            <CheckCircleIcon className="w-3 h-3" /> Actif
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 text-xs">
                            <XCircleIcon className="w-3 h-3" /> Inactif
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {user.role === 'creator' ? (
                          <span className="text-sm">{user.videos} vidéos</span>
                        ) : (
                          <span className="text-sm">{user.purchases} achats</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {user.role === 'creator' ? (
                          <span className="text-sm font-semibold text-green-600">{user.totalEarnings.toLocaleString()} FCFA</span>
                        ) : (
                          <span className="text-sm font-semibold text-orange-500">{user.coins} coins</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs">{formatDate(user.createdAt)}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(user)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Modifier">
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleChangeRole(user)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg" title="Changer rôle">
                            <ShieldCheckIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleToggleActive(user)} className={`p-1.5 ${user.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'} rounded-lg`} title={user.isActive ? 'Désactiver' : 'Activer'}>
                            {user.isActive ? <XCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
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

      {/* Modal d'édition */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Modifier l'utilisateur</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input
                  type="text"
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              {editingUser.role === 'user' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Coins</label>
                  <input
                    type="number"
                    value={editingUser.coins}
                    onChange={(e) => setEditingUser({ ...editingUser, coins: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button onClick={handleSaveEdit} disabled={saving} className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600">
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
                <button onClick={() => setIsEditModalOpen(false)} className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal changement de rôle */}
      {isRoleModalOpen && actionUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Changer le rôle</h2>
            <p className="text-gray-600 mb-4">
              Utilisateur: <span className="font-semibold">{actionUser.name || actionUser.phone}</span>
            </p>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none mb-6"
            >
              <option value="user">Utilisateur</option>
              <option value="creator">Créateur</option>
              <option value="admin">Administrateur</option>
            </select>
            <div className="flex gap-3">
              <button onClick={confirmRoleChange} disabled={saving} className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600">
                {saving ? 'Changement...' : 'Confirmer'}
              </button>
              <button onClick={() => setIsRoleModalOpen(false)} className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}