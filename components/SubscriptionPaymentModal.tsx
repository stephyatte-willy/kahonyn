"use client"

import { useState, useEffect } from 'react'
import { XMarkIcon, TrophyIcon, CheckCircleIcon, ExclamationTriangleIcon, SparklesIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

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

  // 🆕 CORRECTION : Utiliser useEffect pour gérer proprement le body overflow
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    // 🆕 Nettoyage : toujours remettre le scroll quand le composant est démonté
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  // 🆕 Fonction de fermeture qui remet le scroll
  const handleClose = () => {
    document.body.style.overflow = 'auto'
    onClose()
  }

  if (!isOpen || !plan) return null

  const handleSubscribe = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payment/cinetpay/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan.id,
          amount: plan.price,
          name: plan.name,
          duration: plan.duration,
          coinsBonus: plan.coinsBonus
        })
      })
      const data = await res.json()
      
      console.log('📡 Réponse abonnement CinetPay:', data)

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
      {/* Overlay - utilise handleClose pour la fermeture */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50" onClick={handleClose} />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
          
          {/* Header */}
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
              {/* 🆕 Utilise handleClose */}
              <button onClick={handleClose} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300">
                <XMarkIcon className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Contenu défilable */}
          <div className="overflow-y-auto flex-1 p-6">
            {/* Récapitulatif */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 mb-4 border border-gray-700">
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

            {/* Avantages */}
            {plan.benefits && plan.benefits.length > 0 && (
              <div className="space-y-2 mb-4">
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

            {/* Info CinetPay */}
            <div className="bg-purple-500/10 rounded-xl p-4 mb-4 border border-purple-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-2xl">
                  💳
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">Paiement sécurisé CinetPay</p>
                  <p className="text-[10px] text-gray-400">Visa • Mastercard • Mobile Money</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">
                Vous serez redirigé vers la page de paiement sécurisée CinetPay.
              </p>
              <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-400">
                <ShieldCheckIcon className="w-3.5 h-3.5 text-green-400" />
                <span>Paiement sécurisé SSL</span>
              </div>
            </div>

            {/* Erreur */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                <ExclamationTriangleIcon className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 flex-shrink-0">
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Redirection vers CinetPay...
                </div>
              ) : plan.price > 0 ? (
                `💳 Payer ${plan.price.toLocaleString()} FCFA avec CinetPay`
              ) : (
                'Commencer gratuitement'
              )}
            </button>

            <p className="text-center text-[10px] text-gray-500 mt-3">
              🔒 Paiement sécurisé • Annulation possible à tout moment
            </p>
          </div>
        </div>
      </div>
    </>
  )
}