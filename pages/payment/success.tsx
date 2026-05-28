"use client"

import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import Navbar from '../../components/Navbar'

export default function PaymentSuccess() {
  const router = useRouter()
  const { transactionId } = router.query
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/premium')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="bg-gray-900/95 rounded-2xl p-8 text-center max-w-md border border-gray-800">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Paiement réussi !</h1>
          <p className="text-gray-400 mb-4">
            Vos coins ont été ajoutés à votre compte.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Redirection dans {countdown} secondes...
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