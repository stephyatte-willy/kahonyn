// pages/creator/earnings.tsx
"use client"

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import ProfileLayout from '../../components/ProfileLayout'
import { StatCard } from '../../components/ProfileComponents'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Earning {
  id: string
  amount: number
  status: string
  createdAt: string
  video: { title: string }
}

export default function CreatorEarnings() {
  const { data: session } = useSession()
  const router = useRouter()
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session || session.user?.role !== 'creator') { router.push('/'); return }
    fetchEarnings()
  }, [session, router])

  const fetchEarnings = async () => {
    try {
      const res = await fetch('/api/creator/earnings')
      const data = await res.json()
      setEarnings(data.earnings)
      setTotal(data.total)
    } catch (error) {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <ProfileLayout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div></div></ProfileLayout>

  return (
<ProfileLayout title="Mes gains" subtitle="Suivez vos revenus" activeTab="earnings">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] rounded-2xl p-6 text-white">
          <p className="text-sm font-bold opacity-90">Gain total</p>
          <p className="text-3xl font-bold">{total.toLocaleString()} FCFA</p>
          <p className="text-xs opacity-75 mt-2 font-bold">Commission plateforme: 30%</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#D4A855]/10 shadow-sm overflow-hidden">
          {earnings.length === 0 ? (
            <div className="p-8 text-center text-gray-600 font-bold">Aucun gain enregistré</div>
          ) : (
            <div className="divide-y divide-[#D4A855]/10">
              {earnings.map((earning) => (
                <div key={earning.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm text-gray-900">{earning.video?.title || '—'}</p>
                    <p className="text-[10px] text-gray-600 font-bold">{new Date(earning.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{earning.amount.toLocaleString()} FCFA</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      earning.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {earning.status === 'paid' ? 'Payé' : 'En attente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProfileLayout>
  )
}