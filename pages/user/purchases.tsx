"use client"

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import UserLayout from '../../components/UserLayout'
import Link from 'next/link'
import { VideoCameraIcon } from '@heroicons/react/24/outline'

interface Purchase {
  id: string
  amount: number
  createdAt: string
  video: {
    id: string
    title: string
    thumbnail: string
    price: number
  }
}

export default function UserPurchases() {
  const { data: session } = useSession()
  const router = useRouter()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.role === 'creator') {
      router.push('/')
      return
    }
    fetchPurchases()
  }, [session, router])

  const fetchPurchases = async () => {
    try {
      const res = await fetch('/api/user/purchases')
      const data = await res.json()
      setPurchases(data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mes achats</h1>
          <p className="text-gray-500 text-sm mt-1">Retrouvez toutes les vidéos que vous avez achetées</p>
        </div>

        {purchases.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <VideoCameraIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Vous n'avez pas encore acheté de vidéos</p>
            <Link href="/" className="text-orange-500 mt-2 inline-block hover:underline">
              Découvrir les vidéos →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchases.map((purchase) => (
              <Link key={purchase.id} href={`/video/${purchase.video.id}`} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  {purchase.video.thumbnail ? (
                    <img src={purchase.video.thumbnail} alt={purchase.video.title} className="w-full h-full object-cover" />
                  ) : (
                    <VideoCameraIcon className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800">{purchase.video.title}</h3>
                  <p className="text-orange-500 font-semibold mt-1">{purchase.video.price} FCFA</p>
                  <p className="text-xs text-gray-400 mt-2">Acheté le {new Date(purchase.createdAt).toLocaleDateString()}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  )
}