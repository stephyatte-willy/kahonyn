// pages/creator/settings.tsx
"use client"

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/router'
import ProfileLayout from '../../components/ProfileLayout'
import toast from 'react-hot-toast'

export default function CreatorSettings() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  return (
<ProfileLayout title="Paramètres" subtitle="Gérez vos préférences" activeTab="settings">
      <div className="max-w-xl mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-[#D4A855]/10 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4">Préférences du créateur</h3>
          <p className="text-sm text-gray-600 font-bold mb-6">Les paramètres avancés seront bientôt disponibles.</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#EDE4D8] rounded-xl">
              <div>
                <p className="font-bold text-sm text-gray-900">Notifications</p>
                <p className="text-[10px] text-gray-600 font-bold">Recevoir des alertes pour les nouveaux achats</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-9 h-5 bg-gray-300 peer-focus:ring-2 peer-focus:ring-[#FF6B35] rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#FF6B35] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </ProfileLayout>
  )
}