"use client"

import { useState } from 'react'
import AdminLayout from '../layout'
import toast from 'react-hot-toast'

export default function TestCinetPay() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true); setResult(null)
    try {
      const res = await fetch('/api/payment/cinetpay/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ packId: 'test_pack', amount: 100, coins: 10, currency: 'XOF' }) })
      const data = await res.json(); setResult(data)
      if (data.success && data.paymentUrl) { toast.success('✅ Connexion CinetPay OK !') }
      else { toast.error('❌ Erreur : ' + (data.error || 'Inconnue')) }
    } catch (error) { toast.error('Erreur réseau') } finally { setLoading(false) }
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800">🧪 Test CinetPay (nouvelle API)</h1>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4"><p className="text-sm text-green-800 font-bold">✅ Nouveau système : Plus besoin de site_id !</p></div>
        <button onClick={testConnection} disabled={loading} className="w-full px-6 py-3 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-[#FF8C5A] transition disabled:opacity-50">{loading ? '⏳ Test en cours...' : '🚀 Tester la connexion CinetPay'}</button>
        {result && (
          <div className={`p-4 rounded-xl ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-sm font-bold ${result.success ? 'text-green-700' : 'text-red-700'}`}>{result.success ? '✅ Connexion réussie !' : '❌ Échec'}</p>
            {result.paymentUrl && <a href={result.paymentUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 px-4 py-2 bg-green-500 text-white rounded-lg font-bold">🔗 Ouvrir la page de paiement test</a>}
          </div>
        )}
        {result && <details className="mt-4"><summary className="text-sm text-gray-500 cursor-pointer">📋 Réponse brute</summary><pre className="mt-2 p-4 bg-gray-900 rounded-xl text-green-400 text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre></details>}
      </div>
    </AdminLayout>
  )
}