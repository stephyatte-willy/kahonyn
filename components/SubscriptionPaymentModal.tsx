"use client"

import { useState } from 'react'
import { XMarkIcon, TrophyIcon, CheckCircleIcon, ExclamationTriangleIcon, SparklesIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface SubscriptionPlanModal {
  id: string
  name: string
  price: number
  duration: number
  coinsBonus: number
  dailyCoins?: number
  benefits?: string[]
  isPopular?: boolean
  badge?: string | null
  color?: string | null
  description?: string
}

interface SubscriptionPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  plan: SubscriptionPlanModal
  onSuccess: () => void
}

export default function SubscriptionPaymentModal({ isOpen, onClose, plan, onSuccess }: SubscriptionPaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 🆕 Empêcher le défilement de la page en arrière-plan
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = 'auto'
  }

  if (!isOpen || !plan) return null

  const handleSubscribe = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payment/wave/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan.id,
          amount: plan.price
        })
      })
      const data = await res.json()
      if (res.ok && data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        setError(data.error || 'Erreur lors de la création du paiement')
        setLoading(false)
      }
    } catch (err) {
      setError('Erreur réseau')
      setLoading(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50" onClick={onClose} />
      
      {/* 🆕 Modal avec overflow-y-auto pour défiler */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
          
          {/* Header - FIXE */}
          <div className="relative bg-gradient-to-r from-amber-600 to-orange-600 p-5 flex-shrink-0">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <TrophyIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Kahonyn Primes</h2>
                  <p className="text-xs text-white/80">Abonnement {plan.name}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300">
                <XMarkIcon className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* 🆕 Contenu DÉFILABLE */}
          <div className="overflow-y-auto flex-1 p-6">
            {/* Récapitulatif de l'offre */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 mb-6 border border-gray-700">
              <div className="text-center">
                <p className="text-sm text-gray-400">{plan.description || `Offre ${plan.name}`}</p>
                <p className="text-3xl font-bold text-amber-500">
                  {plan.price > 0 ? `${plan.price.toLocaleString()} FCFA` : 'Gratuit'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-gray-700">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{plan.duration || 30}</p>
                  <p className="text-[10px] text-gray-400">jours d'accès</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">+{plan.coinsBonus || 0}</p>
                  <p className="text-[10px] text-gray-400">coins offerts</p>
                </div>
              </div>
            </div>

            {/* Avantages inclus */}
            {plan.benefits && plan.benefits.length > 0 && (
              <div className="space-y-2 mb-6">
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4 text-amber-500" />
                  Avantages inclus
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {plan.benefits.map((benefit: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                      <CheckCircleIcon className="w-3 h-3 text-green-500 flex-shrink-0" />
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Information Wave */}
            <div className="bg-blue-500/10 rounded-xl p-4 mb-6 border border-blue-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">W</span>
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">Wave</p>
                  <p className="text-[10px] text-gray-400">Paiement sécurisé</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">Vous serez redirigé vers Wave pour confirmer le paiement.</p>
            </div>

            {/* Erreur */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                <ExclamationTriangleIcon className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          {/* 🆕 Footer - FIXE en bas */}
          <div className="p-4 border-t border-gray-700 flex-shrink-0">
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Traitement...
                </div>
              ) : plan.price > 0 ? (
                `Souscrire pour ${plan.price.toLocaleString()} FCFA`
              ) : (
                'Commencer gratuitement'
              )}
            </button>

            <p className="text-center text-[10px] text-gray-500 mt-3">
              💳 Paiement sécurisé • Annulation possible à tout moment
            </p>
          </div>
        </div>
      </div>
    </>
  )
}