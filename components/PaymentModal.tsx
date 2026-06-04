"use client"

import { useState, useEffect } from 'react'
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface CoinPack {
  id: string
  name: string
  description?: string | null  // ← Ajouter
  coins: number
  price: number
  bonus: number
  isPopular?: boolean
  isVip?: boolean  // ← Ajouter
  promotionText?: string | null  // ← Accepter null
}

interface PaymentGateway {
  id: string
  name: string
  displayName: string
  type: string
  isActive: boolean
  logoUrl?: string
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
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([])
  const [selectedGateway, setSelectedGateway] = useState<string>('gateway_wave')

  // Charger les moyens de paiement disponibles
  useEffect(() => {
    if (isOpen) {
      fetchPaymentGateways()
    }
  }, [isOpen])

  const fetchPaymentGateways = async () => {
    try {
      const res = await fetch('/api/public/payment-gateways')
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setPaymentGateways(data)
        // Sélectionner le premier moyen de paiement actif par défaut
        const firstActive = data.find((g: PaymentGateway) => g.isActive)
        if (firstActive) setSelectedGateway(firstActive.id)
      } else {
        // Fallback : moyens de paiement par défaut
        setPaymentGateways([
          { id: 'gateway_wave', name: 'wave', displayName: 'Wave Côte d\'Ivoire', type: 'mobile_money', isActive: true },
          { id: 'gateway_cinetpay', name: 'cinetpay', displayName: 'Carte Bancaire (Visa/Mastercard)', type: 'card', isActive: true },
        ])
      }
    } catch (error) {
      // Fallback en cas d'erreur
      setPaymentGateways([
        { id: 'gateway_wave', name: 'wave', displayName: 'Wave Côte d\'Ivoire', type: 'mobile_money', isActive: true },
        { id: 'gateway_cinetpay', name: 'cinetpay', displayName: 'Carte Bancaire (Visa/Mastercard)', type: 'card', isActive: true },
      ])
    }
  }

  if (!isOpen || !pack) return null

  const totalCoins = pack.coins + (pack.bonus || 0)
  const selectedGatewayInfo = paymentGateways.find(g => g.id === selectedGateway)

  const handlePayment = async () => {
    setLoading(true)
    setError('')

    try {
      // Choisir l'API selon le moyen de paiement
      let apiUrl = '/api/payment/wave/create'
      
      if (selectedGateway === 'gateway_cinetpay' || selectedGateway === 'gateway_cinetpay_usd') {
        apiUrl = '/api/payment/cinetpay/create'
      }

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: pack.id,
          amount: pack.price,
          coins: totalCoins,
          currency: selectedGatewayInfo?.name === 'cinetpay' ? 'XOF' : 'XOF',
          gateway: selectedGateway
        })
      })

      const data = await res.json()

      if (res.ok && data.paymentUrl) {
        // Rediriger vers la page de paiement
        window.location.href = data.paymentUrl
      } else {
        setError(data.error || 'Erreur lors de la création du paiement')
        setLoading(false)
      }
    } catch (err) {
      setError('Erreur réseau. Veuillez réessayer.')
      setLoading(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 animate-fadeIn" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed bottom-0 left-0 right-0 md:inset-0 md:flex md:items-center md:justify-center z-50 animate-slideUp md:animate-fadeIn">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-t-3xl md:rounded-3xl shadow-2xl max-w-md w-full mx-auto overflow-hidden border border-gray-700">
          
          {/* Header */}
          <div className="relative bg-gradient-to-r from-amber-600 to-orange-600 p-5">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm text-2xl">
                  🪙
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Recharger mes coins</h2>
                  <p className="text-xs text-white/80">{pack.name}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300">
                <XMarkIcon className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Contenu */}
          <div className="p-6">
            {/* Récapitulatif du pack */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 mb-4 border border-gray-700">
              <div className="text-center">
                <p className="text-sm text-gray-400">{pack.name}</p>
                <p className="text-3xl font-bold text-amber-500">{totalCoins.toLocaleString()} coins</p>
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

            {/* 🆕 SÉLECTEUR DE MOYEN DE PAIEMENT */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Choisissez votre mode de paiement
              </label>
              <div className="space-y-2">
                {paymentGateways.filter((g) => g.isActive).map((gateway) => (
                  <button
                    key={gateway.id}
                    type="button"
                    onClick={() => setSelectedGateway(gateway.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition ${
                      selectedGateway === gateway.id
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                      selectedGateway === gateway.id ? 'bg-amber-500/20' : 'bg-gray-700'
                    }`}>
                      {gateway.type === 'mobile_money' ? '📱' : '💳'}
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-bold text-sm text-white">{gateway.displayName}</p>
                      <p className="text-[10px] text-gray-400">
                        {gateway.type === 'mobile_money' ? 'Paiement mobile instantané' : 'Carte bancaire sécurisée'}
                      </p>
                    </div>
                    {selectedGateway === gateway.id && (
                      <CheckCircleIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Information sur le moyen sélectionné */}
            {selectedGatewayInfo && (
              <div className={`rounded-xl p-3 mb-4 border ${
                selectedGatewayInfo.type === 'mobile_money' 
                  ? 'bg-blue-500/10 border-blue-500/20' 
                  : 'bg-purple-500/10 border-purple-500/20'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{selectedGatewayInfo.type === 'mobile_money' ? '📱' : '💳'}</span>
                  <p className="font-semibold text-white text-sm">{selectedGatewayInfo.displayName}</p>
                </div>
                <p className="text-[10px] text-gray-400">
                  {selectedGatewayInfo.type === 'mobile_money' 
                    ? 'Vous recevrez une notification Wave pour confirmer le paiement.' 
                    : 'Vous serez redirigé vers une page de paiement sécurisée.'}
                </p>
              </div>
            )}

            {/* Erreur */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Bouton de paiement */}
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Traitement...
                </>
              ) : (
                <>
                  {selectedGatewayInfo?.type === 'mobile_money' ? '📱' : '💳'}
                  Payer {pack.price.toLocaleString()} FCFA
                </>
              )}
            </button>

            <p className="text-center text-[10px] text-gray-500 mt-4">
              🔒 Paiement sécurisé • {totalCoins} coins seront ajoutés à votre compte
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
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