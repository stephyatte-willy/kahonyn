"use client"

import { useState } from 'react'
import { XMarkIcon, CreditCardIcon, PhoneIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface PaymentModalProps {
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

export default function PaymentModal({ isOpen, onClose, pack, onSuccess }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'wave' | 'orange'>('wave')
  const [phoneNumber, setPhoneNumber] = useState('')
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

  const handleOrangePayment = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Numéro de téléphone invalide')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payment/orange/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: pack.id,
          amount: pack.price,
          coins: totalCoins,
          phoneNumber
        })
      })
      const data = await res.json()
      if (res.ok && data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        setError(data.error || 'Erreur Orange Money')
      }
    } catch (err) {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn" onClick={onClose} />
      
      {/* Modal */}
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

            {/* Choix du moyen de paiement */}
            <div className="space-y-3 mb-6">
              <p className="text-sm font-medium text-gray-700">Moyen de paiement</p>
              
              {/* Wave */}
              <div
                onClick={() => setPaymentMethod('wave')}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                  paymentMethod === 'wave'
                    ? 'border-kahonyn-energie bg-kahonyn-lumiere'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">W</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">Wave</p>
                  <p className="text-xs text-gray-400">Paiement par lien sécurisé</p>
                </div>
                {paymentMethod === 'wave' && <CheckCircleIcon className="w-5 h-5 text-kahonyn-energie" />}
              </div>

              {/* Orange Money */}
              <div
                onClick={() => setPaymentMethod('orange')}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                  paymentMethod === 'orange'
                    ? 'border-kahonyn-energie bg-kahonyn-lumiere'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">O</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">Orange Money</p>
                  <p className="text-xs text-gray-400">Paiement depuis votre compte Orange</p>
                </div>
                {paymentMethod === 'orange' && <CheckCircleIcon className="w-5 h-5 text-kahonyn-energie" />}
              </div>
            </div>

            {/* Champ numéro pour Orange Money */}
            {paymentMethod === 'orange' && (
              <div className="mb-6 animate-fadeIn">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro Orange Money
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="07 07 07 07 07"
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kahonyn-energie focus:border-transparent outline-none transition"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Format: 0707070707 (10 chiffres)</p>
              </div>
            )}

            {/* Erreur */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                <ExclamationTriangleIcon className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Bouton de paiement */}
            <button
              onClick={paymentMethod === 'wave' ? handleWavePayment : handleOrangePayment}
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