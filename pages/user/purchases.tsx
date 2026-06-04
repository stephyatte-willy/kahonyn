"use client"

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import ProfileLayout from '../../components/ProfileLayout'
import Link from 'next/link'
import { VideoCameraIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'

interface Purchase {
  id: string; amount: number; createdAt: string
  video: { id: string; title: string; thumbnail: string; price: number }
}

export default function UserPurchases() {
  const { data: session } = useSession()
  const router = useRouter()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if ((session?.user as any)?.role === 'creator') { router.push('/'); return }
    fetchPurchases()
  }, [session, router])

  const fetchPurchases = async () => {
    try {
      const res = await fetch('/api/user/purchases'); const data = await res.json()
      setPurchases(Array.isArray(data) ? data : [])
    } catch (error) { console.error('Erreur:', error) } finally { setLoading(false) }
  }

  if (loading) return <ProfileLayout title="Mes achats" activeTab="my-list"><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div></div></ProfileLayout>

  return (
    <ProfileLayout title="Mes achats" subtitle="Retrouvez toutes les vidéos que vous avez achetées" activeTab="my-list">
      <div className="space-y-6">
        {purchases.length === 0 ? (
          <div className="bg-[#1A1A2E] rounded-2xl p-12 text-center border border-white/[0.04]">
            <ShoppingBagIcon className="w-14 h-14 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 font-medium">Vous n'avez pas encore acheté de vidéos</p>
            <Link href="/" className="text-[#FF6B35] font-bold mt-3 inline-block hover:underline">Découvrir les vidéos →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {purchases.map((purchase) => (
              <Link key={purchase.id} href={`/video/${purchase.video.id}`} className="bg-[#1A1A2E] rounded-xl overflow-hidden border border-white/[0.04] hover:border-[#FF6B35]/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group">
                <div className="aspect-video bg-white/[0.03] flex items-center justify-center">
                  {purchase.video.thumbnail ? <img src={purchase.video.thumbnail} alt={purchase.video.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    : <VideoCameraIcon className="w-10 h-10 text-white/20" />}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-white line-clamp-1 group-hover:text-[#FF6B35] transition">{purchase.video.title}</h3>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[#FF6B35] font-bold text-sm">{purchase.video.price} FCFA</span>
                    <span className="text-[10px] text-white/40">{new Date(purchase.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </ProfileLayout>
  )
}