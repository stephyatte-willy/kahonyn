"use client"

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import ProfileLayout from '../../components/ProfileLayout'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Earning {
  id: string
  amount: number
  status: string
  createdAt: string
  video: { title: string }
  buyer?: { name: string; phone: string } | null
}

export default function CreatorEarnings() {
  const { data: session } = useSession()
  const router = useRouter()
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session || (session.user as any)?.role !== 'creator') { 
      router.push('/')
      return 
    }
    fetchEarnings()
  }, [session, router])

  const fetchEarnings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/creator/earnings')
      if (!res.ok) throw new Error('Erreur chargement')
      const data = await res.json()
      
      // S'assurer que les données sont valides
      setEarnings(Array.isArray(data.earnings) ? data.earnings : [])
      setTotal(typeof data.total === 'number' ? data.total : 0)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur de chargement')
      setEarnings([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amount: number | undefined): string => {
    if (amount === undefined || amount === null) return '0'
    return amount.toLocaleString()
  }

  if (loading) {
    return (
      <ProfileLayout title="Mes gains" activeTab="earnings">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
        </div>
      </ProfileLayout>
    )
  }

  return (
    <ProfileLayout title="Mes gains" subtitle="Suivez vos revenus" activeTab="earnings">
      <div className="space-y-6">
        {/* Carte gain total */}
        <div className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] rounded-2xl p-6 text-white">
          <p className="text-sm font-bold opacity-90">Gain total</p>
          <p className="text-3xl font-bold">{formatAmount(total)} FCFA</p>
          <p className="text-xs opacity-75 mt-2 font-bold">Commission plateforme: 30%</p>
        </div>

        {/* Liste des gains */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#D4A855]/10 shadow-sm overflow-hidden">
          {earnings.length === 0 ? (
            <div className="p-12 text-center">
              <CurrencyDollarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-bold">Aucun gain enregistré</p>
              <p className="text-sm text-gray-500 mt-1">Vos gains apparaîtront ici lorsque des utilisateurs achèteront vos vidéos</p>
            </div>
          ) : (
            <div className="divide-y divide-[#D4A855]/10">
              {earnings.map((earning) => (
                <div key={earning.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">
                      {earning.video?.title || 'Vidéo supprimée'}
                    </p>
                    {earning.buyer && (
                      <p className="text-[10px] text-gray-500 font-medium">
                        Acheté par {earning.buyer.name || earning.buyer.phone}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 font-medium">
                      {earning.createdAt ? new Date(earning.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      }) : 'Date inconnue'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="font-bold text-green-600 text-sm">
                      +{formatAmount(earning.amount)} FCFA
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      earning.status === 'paid' || earning.status === 'completed'
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {earning.status === 'paid' || earning.status === 'completed' ? 'Payé' : 'En attente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Résumé */}
        {earnings.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-[#D4A855]/10 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4">Résumé</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-xl">
                <p className="text-sm text-gray-600 font-bold">Total gagné</p>
                <p className="text-xl font-bold text-green-600">{formatAmount(total)} FCFA</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <p className="text-sm text-gray-600 font-bold">Vidéos vendues</p>
                <p className="text-xl font-bold text-blue-600">{earnings.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProfileLayout>
  )
}