"use client"

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import ProfileLayout from '../../components/ProfileLayout'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Earning {
  id: string; amount: number; status: string; createdAt: string
  video: { title: string }; buyer?: { name: string; phone: string } | null
}

export default function CreatorEarnings() {
  const { data: session } = useSession()
  const router = useRouter()
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session || (session.user as any)?.role !== 'creator') { router.push('/'); return }
    fetchEarnings()
  }, [session, router])

  const fetchEarnings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/creator/earnings')
      if (!res.ok) throw new Error('Erreur chargement')
      const data = await res.json()
      setEarnings(Array.isArray(data.earnings) ? data.earnings : [])
      setTotal(typeof data.total === 'number' ? data.total : 0)
    } catch (error) { toast.error('Erreur de chargement'); setEarnings([]); setTotal(0) }
    finally { setLoading(false) }
  }

  const formatAmount = (amount: number | undefined): string => amount === undefined || amount === null ? '0' : amount.toLocaleString()

  if (loading) {
    return (
      <ProfileLayout title="Mes gains" activeTab="earnings">
        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div></div>
      </ProfileLayout>
    )
  }

  return (
    <ProfileLayout title="Mes gains" subtitle="Suivez vos revenus" activeTab="earnings">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] rounded-2xl p-6 text-white">
          <p className="text-sm font-bold opacity-90">Gain total</p>
          <p className="text-3xl font-bold">{formatAmount(total)} FCFA</p>
          <p className="text-xs opacity-75 mt-2 font-bold">Commission plateforme: 30%</p>
        </div>

        <div className="bg-[#1A1A2E] rounded-2xl border border-white/[0.04] overflow-hidden">
          {earnings.length === 0 ? (
            <div className="p-12 text-center">
              <CurrencyDollarIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white font-semibold">Aucun gain enregistré</p>
              <p className="text-sm text-white/50 mt-1">Vos gains apparaîtront ici lorsque des utilisateurs achèteront vos vidéos</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {earnings.map((earning) => (
                <div key={earning.id} className="p-4 flex justify-between items-center hover:bg-white/[0.02] transition">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white truncate">{earning.video?.title || 'Vidéo supprimée'}</p>
                    {earning.buyer && <p className="text-[10px] text-white/40 font-medium">Acheté par {earning.buyer.name || earning.buyer.phone}</p>}
                    <p className="text-[10px] text-white/30 font-medium">{earning.createdAt ? new Date(earning.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date inconnue'}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="font-bold text-green-400 text-sm">+{formatAmount(earning.amount)} FCFA</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${earning.status === 'paid' || earning.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {earning.status === 'paid' || earning.status === 'completed' ? 'Payé' : 'En attente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {earnings.length > 0 && (
          <div className="bg-[#1A1A2E] rounded-2xl p-6 border border-white/[0.04]">
            <h3 className="text-base font-bold text-white mb-4">Résumé</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <p className="text-sm text-white/60 font-medium">Total gagné</p>
                <p className="text-xl font-bold text-green-400">{formatAmount(total)} FCFA</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <p className="text-sm text-white/60 font-medium">Vidéos vendues</p>
                <p className="text-xl font-bold text-blue-400">{earnings.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProfileLayout>
  )
}