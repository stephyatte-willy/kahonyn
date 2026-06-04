"use client"

import { useState, useEffect } from 'react'
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface CoinPack {
  id: string
  name: string
  description?: string
  coins: number
  price: number
  bonus: number
  isPopular?: boolean
  isVip?: boolean
  promotionText?: string | null
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  pack: CoinPack
  onSuccess: () => void
}

export default function PaymentModal({ isOpen, onClose, pack, onSuccess }: PaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  if (!isOpen || !pack) return null

  const totalCoins = pack.coins + (pack.bonus || 0)

  const handlePayment = async () => {
    setLoading(true)
    setError('')

    try {
      // 🔴 APPEL UNIQUEMENT À CINETPAY
      const res = await fetch('/api/payment/cinetpay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: pack.id,
          amount: pack.price,
          coins: totalCoins,
          currency: 'XOF'
        })
      })

      const data = await res.json()

      console.log('📡 Réponse CinetPay:', data)

      if (res.ok && data.paymentUrl) {
        // ✅ Rediriger vers la page de paiement CinetPay
        window.location.href = data.paymentUrl
      } else {
        // ❌ Afficher l'erreur
        setError(data.error || data.message || 'Erreur lors de la création du paiement')
        toast.error(data.error || 'Erreur de paiement')
        setLoading(false)
      }
    } catch (err) {
      console.error('Erreur paiement:', err)
      setError('Erreur réseau. Veuillez réessayer.')
      toast.error('Erreur réseau')
      setLoading(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
          
          {/* Header */}
          <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 p-5 flex-shrink-0">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm text-2xl">
                  💳
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Acheter des coins</h2>
                  <p className="text-xs text-white/80">{pack.name}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300">
                <XMarkIcon className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Contenu défilable */}
          <div className="overflow-y-auto flex-1 p-6">
            {/* Récapitulatif */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 mb-4 border border-gray-700">
              <div className="text-center">
                <p className="text-sm text-gray-400">{pack.name}</p>
                <p className="text-3xl font-bold text-purple-400">{totalCoins.toLocaleString()} coins</p>
                {pack.bonus > 0 && (
                  <p className="text-xs text-green-400 mt-1">+{pack.bonus} coins bonus inclus</p>
                )}
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700">
                <span className="text-sm text-gray-400">Total à payer</span>
                <span className="text-xl font-bold text-white">{pack.price.toLocaleString()} FCFA</span>
              </div>
              {pack.promotionText && (
                <p className="text-xs text-red-400 mt-1 text-center">{pack.promotionText}</p>
              )}
            </div>

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
                Vous serez redirigé vers la page de paiement sécurisée CinetPay pour finaliser votre achat.
              </p>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400">
                <ShieldCheckIcon className="w-3.5 h-3.5 text-green-400" />
                <span>Paiement sécurisé SSL</span>
                <ShieldCheckIcon className="w-3.5 h-3.5 text-green-400" />
                <span>Protection acheteur</span>
              </div>
            </div>

            {/* Erreur */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 flex-shrink-0">
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Redirection vers CinetPay...
                </>
              ) : (
                <>
                  💳 Payer {pack.price.toLocaleString()} FCFA avec CinetPay
                </>
              )}
            </button>

            <p className="text-center text-[10px] text-gray-500 mt-3">
              🔒 Paiement sécurisé • Vous serez redirigé vers CinetPay
            </p>
          </div>
        </div>
      </div>
    </>
  )
}