"use client"

import { useState } from 'react'
import AdminLayout from '../layout'

export default function FindSiteId() {
  const [result, setResult] = useState<any>(null)

  const testWithNumber = async () => {
    const siteIds = ['5863470', '1058420', '1234567', '1000001']
    const results: any[] = []

    for (const siteId of siteIds) {
      try {
        const auth = btoa(`sk_live_kojzhJR7hTadUBjHsIpNF1ua:AEJD@ThankGod@2016`)
        const res = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`
          },
          body: JSON.stringify({
            amount: 100,
            currency: 'XOF',
            api_key: 'sk_live_kojzhJR7hTadUBjHsIpNF1ua',
            site_id: siteId,
            transaction_id: `TEST_${Date.now()}_${siteId}`,
            description: 'Test',
            return_url: 'https://kahonyn.vercel.app',
            notify_url: 'https://kahonyn.vercel.app',
            cancel_url: 'https://kahonyn.vercel.app',
            channels: 'ALL',
            customer_name: 'Test',
            customer_surname: 'Test',
            customer_country: 'CI'
          })
        })
        const data = await res.json()
        results.push({ siteId, code: data.code, message: data.message, description: data.description })
        
        if (data.code === '201') {
          setResult({ success: true, siteId, data })
          return
        }
      } catch (e) {}
    }
    setResult({ success: false, results })
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">🔍 Trouver le Site ID</h1>
        <p className="text-sm text-gray-600">Cette page teste plusieurs site_id pour trouver le bon.</p>
        <button onClick={testWithNumber} className="px-6 py-3 bg-[#FF6B35] text-white rounded-xl font-bold">
          Tester les site_id
        </button>
        {result && (
          <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-xs overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </AdminLayout>
  )
}