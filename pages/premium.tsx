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
  CloudArrowDownIcon,
  EyeIcon,
  ShieldCheckIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useRequireAuth } from '../hooks/useRequireAuth'
import WavePaymentModal from '../components/WavePaymentModal'
import SubscriptionPaymentModal from '../components/SubscriptionPaymentModal'
import toast from 'react-hot-toast'

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
  const { isAuthorized, isLoading: authLoading } = useRequireAuth()
  const [coinPacks, setCoinPacks] = useState<CoinPack[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [activeFooterTab, setActiveFooterTab] = useState('premium')
  const [userSubscription, setUserSubscription] = useState<any>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedCoinPack, setSelectedCoinPack] = useState<CoinPack | null>(null)
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false)
  const [selectedSubscriptionPlan, setSelectedSubscriptionPlan] = useState<any>(null)

  useEffect(() => {
    if (!isAuthorized) return
    fetchCoinPacks()
    fetchUserSubscription()
  }, [isAuthorized])

  const fetchCoinPacks = async () => {
    try {
      const res = await fetch('/api/premium/coin-packs')
      const data = await res.json()
      if (Array.isArray(data)) {
        setCoinPacks(data)
      } else {
        setCoinPacks([])
      }
    } catch (error) {
      console.error('Erreur:', error)
      setCoinPacks([])
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

  const handleSubscribe = (plan: any) => {
    setSelectedSubscriptionPlan(plan)
    setIsSubscriptionModalOpen(true)
  }

  const handleBuyCoins = (pack: CoinPack) => {
    setSelectedCoinPack(pack)
    setIsPaymentModalOpen(true)
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

  // Message si non connecté
  if (!isAuthorized && !authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8]">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] px-4">
          <div className="w-20 h-20 rounded-2xl bg-white/80 border border-[#D4A855]/20 flex items-center justify-center mb-6 shadow-sm">
            <LockClosedIcon className="w-10 h-10 text-[#FF6B35]" />
          </div>
          <h2 className="text-xl font-bold text-[#3D2B1F] mb-2">Accès restreint</h2>
          <p className="text-sm text-[#8B5A2B]/80 text-center max-w-sm">
            Connectez-vous pour accéder aux offres premium et acheter des coins
          </p>
        </div>
      </div>
    )
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8]">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
        </div>
      </div>
    )
  }

  const isSubscribed = userSubscription?.status === 'active'

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-20">
      <Navbar />

      {/* En-tête */}
      <div className="sticky top-12 z-20 bg-[#0D0D1A]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#D4A855] to-[#E5C87B] rounded-xl flex items-center justify-center shadow-md shadow-[#D4A855]/20">
              <TrophyIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Kahonyn Primes</h1>
              <p className="text-xs text-[#D4A855]/60">
                Solde: {(session?.user as any)?.coins || 0} coins
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Abonnements */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#5C3D2E] mb-2">🚀 Passez à Kahonyn Primes</h2>
          <p className="text-[#8B5A2B]/70">Profitez d'avantages exclusifs et économisez sur vos achats</p>
          {isSubscribed && (
            <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-green-50 rounded-full border border-green-200">
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700">Abonnement actif jusqu'au {new Date(userSubscription.endDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {subscriptionPlans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl border ${
                plan.popular ? 'ring-2 ring-[#FF6B35] shadow-lg shadow-[#FF6B35]/10 border-[#FF6B35]/20' : 'border-[#D4A855]/10 hover:border-[#D4A855]/30'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl">
                  Populaire
                </div>
              )}
              {plan.bestValue && (
                <div className="absolute top-0 right-0 bg-[#5C3D2E] text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl">
                  Meilleure valeur
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#5C3D2E] mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-[#FF6B35]">{plan.price.toLocaleString()}</span>
                  <span className="text-[#8B5A2B]/60"> FCFA</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2 text-[#5C3D2E]">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                    Accès illimité pendant {plan.days} jours
                  </li>
                  <li className="flex items-center gap-2 text-[#5C3D2E]">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                    +{plan.coinsBonus} coins offerts
                  </li>
                  <li className="flex items-center gap-2 text-[#5C3D2E]">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                    Badge exclusif
                  </li>
                  <li className="flex items-center gap-2 text-[#5C3D2E]">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                    20% de réduction sur tous les épisodes
                  </li>
                </ul>
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={processing || isSubscribed}
                  className={`w-full py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                    isSubscribed
                      ? 'bg-[#E8D5B5] text-[#8B5A2B]/60 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white hover:shadow-lg hover:shadow-[#FF6B35]/20'
                  }`}
                >
                  {isSubscribed ? 'Déjà abonné' : 'Souscrire'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section Avantages VIP */}
      <div className="max-w-7xl mx-auto px-4 py-8 border-t border-[#D4A855]/10">
        <h2 className="text-xl font-bold text-[#5C3D2E] mb-6 text-center">✨ Avantages VIP</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {vipBenefits.map((benefit, index) => (
            <div key={index} className="text-center p-4 bg-white rounded-xl shadow-sm border border-[#D4A855]/10 hover:shadow-md transition">
              <benefit.icon className="w-7 h-7 text-[#FF6B35] mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-[#5C3D2E]">{benefit.title}</h3>
              <p className="text-[10px] text-[#8B5A2B]/60 mt-1">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section Packs de coins */}
      <div className="max-w-7xl mx-auto px-4 py-8 border-t border-[#D4A855]/10">
        <h2 className="text-xl font-bold text-[#5C3D2E] mb-6 text-center">💰 Acheter des coins</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {coinPacks.map((pack) => (
            <div 
              key={pack.id}
              className={`bg-white rounded-xl p-4 text-center transition-all duration-300 hover:shadow-xl cursor-pointer ${
                pack.isPopular ? 'ring-2 ring-[#FF6B35] shadow-md shadow-[#FF6B35]/10' : 'border border-[#D4A855]/10 hover:border-[#D4A855]/30'
              }`}
              onClick={() => handleBuyCoins(pack)}
            >
              {pack.isPopular && (
                <div className="text-[#FF6B35] text-xs font-bold mb-1">⭐ Populaire</div>
              )}
              <div className="text-2xl font-bold text-[#5C3D2E]">{pack.coins + pack.bonus}</div>
              <div className="text-xs text-[#8B5A2B]/60 mb-2">coins</div>
              {pack.bonus > 0 && (
                <div className="text-green-600 text-[10px] font-semibold mb-1">+{pack.bonus} offerts</div>
              )}
              <div className="text-[#FF6B35] font-bold">{pack.price.toLocaleString()} FCFA</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section FAQ */}
      <div className="max-w-7xl mx-auto px-4 py-8 border-t border-[#D4A855]/10">
        <h2 className="text-xl font-bold text-[#5C3D2E] mb-6 text-center">❓ Questions fréquentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {[
            { q: 'Comment utiliser mes coins ?', a: 'Les coins permettent d\'acheter des épisodes et des films sur la plateforme.' },
            { q: 'Puis-je résilier mon abonnement ?', a: 'Oui, vous pouvez annuler votre abonnement à tout moment depuis votre profil.' },
            { q: 'Les coins expirent-ils ?', a: 'Non, vos coins restent valables indéfiniment sur votre compte.' },
            { q: 'Paiement sécurisé ?', a: 'Nos paiements sont sécurisés via Wave et Mobile Money.' }
          ].map((faq, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-[#D4A855]/10">
              <h3 className="font-semibold text-[#5C3D2E] mb-1">{faq.q}</h3>
              <p className="text-xs text-[#8B5A2B]/60">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modales de paiement */}
      {isPaymentModalOpen && selectedCoinPack && (
        <WavePaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false)
            setSelectedCoinPack(null)
          }}
          pack={selectedCoinPack}
          onSuccess={() => {
            setIsPaymentModalOpen(false)
            setSelectedCoinPack(null)
            update()
            toast.success('Coins ajoutés avec succès !', { duration: 2000 })
          }}
        />
      )}

      {isSubscriptionModalOpen && selectedSubscriptionPlan && (
        <SubscriptionPaymentModal
          isOpen={isSubscriptionModalOpen}
          onClose={() => {
            setIsSubscriptionModalOpen(false)
            setSelectedSubscriptionPlan(null)
          }}
          plan={selectedSubscriptionPlan}
          onSuccess={() => {
            setIsSubscriptionModalOpen(false)
            setSelectedSubscriptionPlan(null)
            fetchUserSubscription()
            update()
            toast.success('Abonnement activé avec succès !', { duration: 2000 })
          }}
        />
      )}

      <Footer footerTabs={footerTabs} activeFooterTab={activeFooterTab} setActiveFooterTab={setActiveFooterTab} />
    </div>
  )
}