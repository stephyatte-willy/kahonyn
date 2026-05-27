"use client"

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { 
  HomeIcon,
  UserGroupIcon,
  BookmarkIcon,
  TrophyIcon,
  UserCircleIcon,
  CheckCircleIcon,
  SparklesIcon,
  GiftIcon,
  StarIcon,
  ArrowPathIcon,
  CloudArrowDownIcon,
  EyeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import toast, { Toaster } from 'react-hot-toast'

interface CoinPack {
  id: string
  name: string
  coins: number
  price: number
  bonus: number
  isPopular: boolean
  isVip: boolean
}

export default function PremiumPage() {
  const { data: session, update } = useSession()
  const [coinPacks, setCoinPacks] = useState<CoinPack[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [selectedPack, setSelectedPack] = useState<CoinPack | null>(null)
  const [processing, setProcessing] = useState(false)
  const [activeFooterTab, setActiveFooterTab] = useState('premium')
  const [userSubscription, setUserSubscription] = useState<any>(null)

  useEffect(() => {
    fetchCoinPacks()
    fetchUserSubscription()
  }, [])

  const fetchCoinPacks = async () => {
    try {
      const res = await fetch('/api/premium/coin-packs')
      const data = await res.json()
      setCoinPacks(data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserSubscription = async () => {
    if (!session) return
    try {
      const res = await fetch('/api/premium/user-subscription')
      const data = await res.json()
      setUserSubscription(data.subscription)
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleSubscribe = async (plan: string) => {
    if (!session) {
      toast.error('Connectez-vous pour souscrire')
      return
    }

    setSelectedPlan(plan)
    setProcessing(true)

    let price = 0
    let planName = ''
    switch (plan) {
      case 'monthly':
        price = 5000
        planName = 'Mensuel'
        break
      case 'quarterly':
        price = 13500
        planName = 'Trimestriel'
        break
      case 'yearly':
        price = 48000
        planName = 'Annuel'
        break
    }

    if (!confirm(`Souscrire à l'offre ${planName} (${price.toLocaleString()} FCFA) ?`)) {
      setProcessing(false)
      setSelectedPlan(null)
      return
    }

    try {
      const res = await fetch('/api/premium/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        fetchUserSubscription()
        await update()
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    } finally {
      setProcessing(false)
      setSelectedPlan(null)
    }
  }

  const handleBuyCoins = async (pack: CoinPack) => {
    if (!session) {
      toast.error('Connectez-vous pour acheter')
      return
    }

    setSelectedPack(pack)
    setProcessing(true)

    if (!confirm(`Acheter ${pack.name} (${pack.price.toLocaleString()} FCFA) pour ${pack.coins + pack.bonus} coins ?`)) {
      setProcessing(false)
      setSelectedPack(null)
      return
    }

    try {
      const res = await fetch('/api/premium/buy-coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: pack.id })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        await update()
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    } finally {
      setProcessing(false)
      setSelectedPack(null)
    }
  }

  const footerTabs = [
    { id: 'home', label: 'Accueil', icon: HomeIcon, href: '/' },
    { id: 'for-you', label: 'Pour vous', icon: UserGroupIcon, href: '/for-you' },
    { id: 'my-list', label: 'Ma liste', icon: BookmarkIcon, href: '/my-list' },
    { id: 'premium', label: 'Primes', icon: TrophyIcon, href: '/premium' },
    { id: 'profile', label: 'Profil', icon: UserCircleIcon, href: '/profile' },
  ]

  const subscriptionPlans = [
    { id: 'monthly', name: 'Mensuel', price: 5000, days: 30, coinsBonus: 500, popular: true },
    { id: 'quarterly', name: 'Trimestriel', price: 13500, days: 90, coinsBonus: 2000, popular: false },
    { id: 'yearly', name: 'Annuel', price: 48000, days: 365, coinsBonus: 10000, popular: false, bestValue: true }
  ]

  const vipBenefits = [
    { icon: CloudArrowDownIcon, title: 'Téléchargement', desc: 'Téléchargez vos épisodes préférés' },
    { icon: EyeIcon, title: 'Accès anticipé', desc: 'Voyez les épisodes 24h avant' },
    { icon: StarIcon, title: 'Badge exclusif', desc: 'Badge VIP sur votre profil' },
    { icon: GiftIcon, title: 'Coins bonus', desc: '+20% de coins à chaque achat' },
    { icon: ShieldCheckIcon, title: 'Sans publicité', desc: 'Navigation sans pub' }
  ]

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
      </div>
    )
  }

  const isSubscribed = userSubscription?.status === 'active'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pb-20 text-white">
      <Navbar />
      <Toaster position="top-right" />

      {/* En-tête */}
      <div className="sticky top-12 z-20 bg-gray-900/95 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-500/20">
              <TrophyIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Kahonyn Primes</h1>
              <p className="text-xs text-gray-400">
                {session ? (
                  <>Solde: {(session.user as any)?.coins || 0} coins</>
                ) : (
                  'Connectez-vous pour accéder aux primes'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Abonnements */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">🚀 Passez à Kahonyn Primes</h2>
          <p className="text-gray-400">Profitez d'avantages exclusifs et économisez sur vos achats</p>
          {isSubscribed && (
            <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-green-100 rounded-full">
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600">Abonnement actif jusqu'au {new Date(userSubscription.endDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {subscriptionPlans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative bg-gray-900/95 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl border border-gray-800 ${
                plan.popular ? 'ring-2 ring-amber-500 shadow-lg shadow-amber-500/20' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-kahonyn-energie to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  Populaire
                </div>
              )}
              {plan.bestValue && (
                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  Meilleure valeur
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-amber-500">{plan.price.toLocaleString()}</span>
                  <span className="text-gray-400"> FCFA</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    Accès illimité pendant {plan.days} jours
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    +{plan.coinsBonus} coins offerts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    Badge exclusif
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    20% de réduction sur tous les épisodes
                  </li>
                </ul>
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={processing || isSubscribed}
                  className={`w-full py-2 rounded-lg font-semibold transition-all duration-300 ${
                    isSubscribed
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-kahonyn-energie to-orange-500 text-white hover:shadow-md'
                  }`}
                >
                  {processing && selectedPlan === plan.id ? 'Traitement...' : isSubscribed ? 'Déjà abonné' : 'Souscrire'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section Avantages VIP */}
      <div className="max-w-7xl mx-auto px-4 py-8 border-t border-gray-800">
        <h2 className="text-xl font-bold text-white mb-6 text-center">✨ Avantages VIP</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {vipBenefits.map((benefit, index) => (
            <div key={index} className="text-center p-4 bg-gray-900/95 rounded-xl shadow-sm border border-gray-800">
              <benefit.icon className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-white">{benefit.title}</h3>
              <p className="text-[10px] text-gray-400 mt-1">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section Packs de coins */}
      <div className="max-w-7xl mx-auto px-4 py-8 border-t border-gray-800">
        <h2 className="text-xl font-bold text-white mb-6 text-center">💰 Acheter des coins</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {coinPacks.map((pack) => (
            <div 
              key={pack.id}
              className={`bg-gray-900/95 rounded-xl p-4 text-center transition-all duration-300 hover:shadow-2xl border border-gray-800 cursor-pointer ${
                pack.isPopular ? 'ring-2 ring-amber-500 shadow-md shadow-amber-500/20' : ''
              }`}
              onClick={() => handleBuyCoins(pack)}
            >
              {pack.isPopular && (
                <div className="text-amber-500 text-xs font-bold mb-1">⭐ Populaire</div>
              )}
              <div className="text-2xl font-bold text-white">{pack.coins + pack.bonus}</div>
              <div className="text-xs text-gray-400 mb-2">coins</div>
              {pack.bonus > 0 && (
                <div className="text-green-600 text-[10px] font-semibold mb-1">+{pack.bonus} offerts</div>
              )}
              <div className="text-kahonyn-energie font-bold">{pack.price.toLocaleString()} FCFA</div>
              <div className="text-[10px] text-gray-400 mt-1">{Math.round((pack.coins + pack.bonus) / pack.price * 1000)} coins/1000 FCFA</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section FAQ */}
      <div className="max-w-7xl mx-auto px-4 py-8 border-t border-gray-800">
        <h2 className="text-xl font-bold text-white mb-6 text-center">❓ Questions fréquentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          <div className="bg-gray-900/95 rounded-xl p-4 shadow-sm border border-gray-800">
            <h3 className="font-semibold text-white mb-1">Comment utiliser mes coins ?</h3>
            <p className="text-xs text-gray-400">Les coins permettent d'acheter des épisodes et des films sur la plateforme.</p>
          </div>
          <div className="bg-gray-900/95 rounded-xl p-4 shadow-sm border border-gray-800">
            <h3 className="font-semibold text-white mb-1">Puis-je résilier mon abonnement ?</h3>
            <p className="text-xs text-gray-400">Oui, vous pouvez annuler votre abonnement à tout moment depuis votre profil.</p>
          </div>
          <div className="bg-gray-900/95 rounded-xl p-4 shadow-sm border border-gray-800">
            <h3 className="font-semibold text-white mb-1">Les coins expirent-ils ?</h3>
            <p className="text-xs text-gray-400">Non, vos coins restent valables indéfiniment sur votre compte.</p>
          </div>
          <div className="bg-gray-900/95 rounded-xl p-4 shadow-sm border border-gray-800">
            <h3 className="font-semibold text-white mb-1">Paiement sécurisé ?</h3>
            <p className="text-xs text-gray-400">Nos paiements sont sécurisés via Orange Money et MTN Mobile Money.</p>
          </div>
        </div>
      </div>

      {/* Footer fixe - mode clair */}
      <Footer footerTabs={footerTabs} activeFooterTab={activeFooterTab} setActiveFooterTab={setActiveFooterTab} />
    </div>
  )
}