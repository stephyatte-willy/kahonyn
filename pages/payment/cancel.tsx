"use client"

import Link from 'next/link'
import { XCircleIcon } from '@heroicons/react/24/outline'
import Navbar from '../../components/Navbar'

export default function PaymentCancel() {
  return (
    <div>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="bg-gray-900/95 rounded-2xl p-8 text-center max-w-md border border-gray-800">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircleIcon className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Paiement annulé</h1>
          <p className="text-gray-400 mb-6">
            Vous n'avez pas été débité. Vous pouvez réessayer quand vous voulez.
          </p>
          <Link
            href="/premium"
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition"
          >
            Retour aux primes
          </Link>
        </div>
      </div>
    </div>
  )
}