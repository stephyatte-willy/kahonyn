"use client"

import { useState } from 'react'
import { XMarkIcon, CreditCardIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface WavePaymentModalProps {
  isOpen: boolean
  onClose: () => void
  pack: {
    id: string
    name: string
    coins: number
    price: number
    bonus: number
  }
  onSuccess: () => void
}

export default function WavePaymentModal({ isOpen, onClose, pack, onSuccess }: WavePaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const totalCoins = pack.coins + pack.bonus

  const handleWavePayment = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payment/wave/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: pack.id,
          amount: pack.price,
          coins: totalCoins
        })
      })
      const data = await res.json()
      if (res.ok && data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        setError(data.error || 'Erreur lors de la création du paiement')
      }
    } catch (err) {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn" onClick={onClose} />
      
      <div className="fixed bottom-0 left-0 right-0 md:inset-0 md:flex md:items-center md:justify-center z-50 animate-slideUp md:animate-fadeIn">
        <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl max-w-md w-full mx-auto overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-kahonyn-terre to-kahonyn-energie p-4 text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CreditCardIcon className="w-6 h-6" />
                <h2 className="text-lg font-bold">Achat de coins</h2>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm opacity-90 mt-1">
              {pack.name} • {pack.price.toLocaleString()} FCFA
            </p>
          </div>

          {/* Contenu */}
          <div className="p-6">
            {/* Récapitulatif */}
            <div className="bg-gradient-to-br from-kahonyn-lumiere to-kahonyn-sable rounded-xl p-4 mb-6 text-center">
              <p className="text-sm text-gray-500">Vous recevrez</p>
              <p className="text-3xl font-bold text-kahonyn-energie">{totalCoins.toLocaleString()} coins</p>
              {pack.bonus > 0 && (
                <p className="text-xs text-green-600 mt-1">+{pack.bonus} coins offerts</p>
              )}
            </div>

            {/* Informations Wave */}
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">W</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Wave</p>
                  <p className="text-xs text-gray-500">Paiement sécurisé par lien</p>
                </div>
              </div>
              <p className="text-xs text-gray-600">
                Vous serez redirigé vers Wave pour finaliser votre paiement.
                Une fois le paiement confirmé, vos coins seront ajoutés instantanément.
              </p>
            </div>

            {/* Erreur */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                <ExclamationTriangleIcon className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Bouton de paiement */}
            <button
              onClick={handleWavePayment}
              disabled={loading}
              className="w-full bg-gradient-to-r from-kahonyn-energie to-orange-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Traitement...
                </div>
              ) : (
                `Payer ${pack.price.toLocaleString()} FCFA`
              )}
            </button>

            <p className="text-center text-xs text-gray-400 mt-4">
              💳 Paiement sécurisé • Transaction cryptée
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </>
  )
}