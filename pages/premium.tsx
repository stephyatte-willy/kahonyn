"use client"

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { 
  HomeIcon, UserGroupIcon, BookmarkIcon, TrophyIcon, UserCircleIcon,
  CheckCircleIcon, LockClosedIcon, SparklesIcon, CurrencyDollarIcon,
  CloudArrowDownIcon, EyeIcon, StarIcon, GiftIcon, ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useRequireAuth } from '../hooks/useRequireAuth'
import PaymentModal from '../components/PaymentModal'
import SubscriptionPaymentModal from '../components/SubscriptionPaymentModal'
import toast from 'react-hot-toast'

interface SubscriptionPlan {
  id: string; name: string; description: string; price: number; duration: number
  coinsBonus: number; dailyCoins: number; benefits: string[]; isPopular: boolean
  color: string | null; badge: string | null
}

interface CoinPack {
  id: string; name: string; description: string; coins: number; price: number
  bonus: number; isPopular: boolean; isVip: boolean; promotionText: string | null
}

interface VipBenefit {
  id: string; title: string; description: string; icon: string
}

const iconMap: Record<string, React.ElementType> = {
  'CloudArrowDownIcon': CloudArrowDownIcon, 'EyeIcon': EyeIcon,
  'StarIcon': StarIcon, 'GiftIcon': GiftIcon, 'ShieldCheckIcon': ShieldCheckIcon,
  'SparklesIcon': SparklesIcon,
}

export default function PremiumPage() {
  const { data: session, update } = useSession()
  const { isAuthorized, isLoading: authLoading } = useRequireAuth()
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([])
  const [coinPacks, setCoinPacks] = useState<CoinPack[]>([])
  const [vipBenefits, setVipBenefits] = useState<VipBenefit[]>([])
  const [loading, setLoading] = useState(true)
  const [userCoins, setUserCoins] = useState(0)
  const [userSubscription, setUserSubscription] = useState<any>(null)
  const [activeFooterTab, setActiveFooterTab] = useState('premium')
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedCoinPack, setSelectedCoinPack] = useState<CoinPack | null>(null)
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false)
  const [selectedSubscriptionPlan, setSelectedSubscriptionPlan] = useState<SubscriptionPlan | null>(null)

  useEffect(() => { if (!isAuthorized) return; loadAllData() }, [isAuthorized])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [plansRes, packsRes, benefitsRes, profileRes, subRes] = await Promise.all([
        fetch('/api/public/subscription-plans'), fetch('/api/public/coin-packs'),
        fetch('/api/public/vip-benefits'), fetch('/api/user/profile'),
        fetch('/api/premium/user-subscription')
      ])
      const [plans, packs, benefits, profile, subscription] = await Promise.all([
        plansRes.json(), packsRes.json(), benefitsRes.json(), profileRes.json(), subRes.json()
      ])
      setSubscriptionPlans(Array.isArray(plans) ? plans : [])
      setCoinPacks(Array.isArray(packs) ? packs : [])
      setVipBenefits(Array.isArray(benefits) ? benefits : [])
      setUserCoins(profile?.coins || 0)
      setUserSubscription(subscription?.subscription || null)
    } catch (error) { toast.error('Impossible de charger les offres') }
    finally { setLoading(false) }
  }

  const refreshCoins = async () => {
    try { const res = await fetch('/api/user/profile'); const data = await res.json(); setUserCoins(data.coins || 0) }
    catch (error) { console.error('Erreur refresh coins:', error) }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success'); const amount = params.get('amount')
    if (success === 'coins_added' && amount) { toast.success(`🎉 ${amount} coins ajoutés !`, { duration: 5000 }); refreshCoins(); window.history.replaceState({}, '', '/premium') }
    else if (success === 'subscription_activated') { toast.success('🎉 Abonnement activé !', { duration: 5000 }); loadAllData(); window.history.replaceState({}, '', '/premium') }
    else if (success === 'already_credited') { toast('Coins déjà crédités', { icon: 'ℹ️' }); window.history.replaceState({}, '', '/premium') }
  }, [])

  const handleBuyCoins = (pack: CoinPack) => { setSelectedCoinPack(pack); setIsPaymentModalOpen(true) }
  const handleSubscribe = (plan: SubscriptionPlan) => { setSelectedSubscriptionPlan(plan); setIsSubscriptionModalOpen(true) }

  const footerTabs = [
    { id: 'home', label: 'Accueil', icon: HomeIcon, href: '/' },
    { id: 'for-you', label: 'Pour vous', icon: UserGroupIcon, href: '/for-you' },
    { id: 'my-list', label: 'Ma liste', icon: BookmarkIcon, href: '/my-list' },
    { id: 'premium', label: 'Primes', icon: TrophyIcon, href: '/premium' },
    { id: 'Admin', label: 'Admin', icon: ShieldCheckIcon, href: '/admin/dashboard' },
  ]

  const getBadgeColor = (color: string | null): string => {
    const colors: Record<string, string> = { gold: 'from-amber-500 to-yellow-500', purple: 'from-purple-500 to-violet-500', blue: 'from-blue-500 to-cyan-500', gray: 'from-gray-400 to-gray-500', red: 'from-red-500 to-rose-500' }
    return colors[color || ''] || 'from-[#FF6B35] to-[#FF8C5A]'
  }

  if (!isAuthorized && !authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1A0A00] via-[#0D0D0D] to-[#0D0D0D]">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] px-4">
          <div className="w-24 h-24 rounded-2xl bg-[#1A1A2E] border border-[#8B5A2B]/20 flex items-center justify-center mb-6 shadow-xl">
            <LockClosedIcon className="w-12 h-12 text-[#FF6B35]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Accès restreint</h2>
          <p className="text-sm text-[#D4A855]/70 text-center max-w-sm">Connectez-vous pour accéder aux offres premium</p>
        </div>
      </div>
    )
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1A0A00] via-[#0D0D0D] to-[#0D0D0D]">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-[#1A1A2E]/80 flex items-center justify-center p-3 animate-pulse border border-[#8B5A2B]/30">
                <img src="/logo-kahonyn.png" alt="Kahonyn" className="w-14 h-14 object-contain" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FF6B35] animate-bounce"></div>
            </div>
            <p className="text-[#D4A855]/80 text-sm font-semibold">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  const isSubscribed = userSubscription?.status === 'active'

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A0A00] via-[#0D0D0D] to-[#0D0D0D] pb-20">
      {/* Effet de lueur marron en haut */}
      <div className="fixed top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#8B5A2B]/10 via-[#8B5A2B]/5 to-transparent pointer-events-none z-0"></div>

      <Navbar hideCategories={true} />
      
      {/* En-tête */}
      <div className="sticky top-12 z-20 bg-[#0D0D0D]/98 backdrop-blur-xl border-b border-[#8B5A2B]/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#D4A855] to-[#E5C87B] rounded-xl flex items-center justify-center shadow-lg shadow-[#D4A855]/20">
              <TrophyIcon className="w-5 h-5 text-[#1A0A00]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Kahonyn Primes</h1>
              <p className="text-sm text-[#D4A855] font-medium">
                Solde: {userCoins.toLocaleString()} 🪙 coins
                {isSubscribed && <span className="ml-2 bg-[#D4A855]/20 px-2 py-0.5 rounded-full text-[#D4A855]">⭐ {userSubscription.plan}</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Abonnements */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">🚀 Choisissez votre abonnement</h2>
          <p className="text-[#D4A855]/70">Débloquez tous les avantages et regardez sans limite</p>
          {isSubscribed && (
            <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-green-500/10 rounded-full border border-green-500/20">
              <CheckCircleIcon className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400 font-medium">Abonnement actif jusqu'au {new Date(userSubscription.endDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {subscriptionPlans.map((plan) => (
            <div key={plan.id} className={`relative bg-[#1A1A2E] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl border ${plan.isPopular ? 'ring-2 ring-[#FF6B35] border-[#FF6B35]/20' : 'border-[#8B5A2B]/10 hover:border-[#8B5A2B]/30'}`}>
              {plan.badge && (
                <div className={`absolute top-0 right-0 bg-gradient-to-r ${getBadgeColor(plan.color)} text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl`}>{plan.badge}</div>
              )}
              <div className="p-5">
                <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-[#D4A855]/70 mb-3">{plan.description}</p>
                <div className="mb-4">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-bold text-green-400">Gratuit</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-[#FF6B35]">{plan.price.toLocaleString()}</span>
                      <span className="text-sm text-[#D4A855]/50"> FCFA</span>
                      {plan.duration > 0 && <span className="text-xs text-[#D4A855]/40 block">/ {plan.duration} jours</span>}
                    </>
                  )}
                </div>
                <ul className="space-y-2 mb-5 text-sm">
                  {plan.benefits?.map((benefit: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-white/70">
                      <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />{benefit}
                    </li>
                  ))}
                  {plan.coinsBonus > 0 && <li className="flex items-center gap-2 text-[#FF6B35] font-bold"><SparklesIcon className="w-4 h-4 flex-shrink-0" />+{plan.coinsBonus} coins offerts</li>}
                  {plan.dailyCoins > 0 && <li className="flex items-center gap-2 text-[#D4A855] font-bold"><CurrencyDollarIcon className="w-4 h-4 flex-shrink-0" />+{plan.dailyCoins} coins/jour</li>}
                </ul>
                <button onClick={() => handleSubscribe(plan)} disabled={isSubscribed}
                  className={`w-full py-2.5 rounded-xl font-bold transition-all duration-300 text-sm ${isSubscribed ? 'bg-[#8B5A2B]/10 text-[#D4A855]/30 cursor-not-allowed' : plan.price === 0 ? 'bg-green-500 text-white hover:bg-green-600' : plan.isPopular ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white hover:shadow-lg hover:shadow-[#FF6B35]/20' : 'bg-[#8B5A2B]/10 text-[#D4A855] hover:bg-[#8B5A2B]/20'}`}>
                  {isSubscribed ? 'Déjà abonné' : plan.price === 0 ? 'Commencer' : 'Souscrire'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Avantages VIP */}
      {vipBenefits.length > 0 && (
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 border-t border-[#8B5A2B]/10">
          <h2 className="text-xl font-bold text-white mb-6 text-center">✨ Avantages Premium</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {vipBenefits.map((benefit) => {
              const IconComponent = iconMap[benefit.icon] || SparklesIcon
              return (
                <div key={benefit.id} className="text-center p-4 bg-[#1A1A2E] rounded-xl border border-[#8B5A2B]/10 hover:border-[#FF6B35]/30 transition group">
                  <div className="w-12 h-12 bg-[#FF6B35]/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#FF6B35]/20 transition">
                    <IconComponent className="w-6 h-6 text-[#FF6B35]" />
                  </div>
                  <h3 className="text-sm font-bold text-white">{benefit.title}</h3>
                  <p className="text-xs text-[#D4A855]/70 mt-1">{benefit.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Packs de coins */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 border-t border-[#8B5A2B]/10">
        <h2 className="text-xl font-bold text-white mb-2 text-center">💰 Recharger mes coins</h2>
        <p className="text-sm text-[#D4A855]/70 text-center mb-6">Choisissez un pack et payez facilement avec CinetPay</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {coinPacks.map((pack) => (
            <div key={pack.id} onClick={() => handleBuyCoins(pack)}
              className={`relative bg-[#1A1A2E] rounded-xl p-4 text-center transition-all duration-300 hover:shadow-2xl cursor-pointer border ${pack.isPopular ? 'ring-2 ring-[#FF6B35] border-[#FF6B35]/20' : 'border-[#8B5A2B]/10 hover:border-[#8B5A2B]/30'}`}>
              {pack.isPopular && <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white text-[10px] font-bold px-3 py-0.5 rounded-full">⭐ Populaire</div>}
              {pack.promotionText && <div className="absolute -top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{pack.promotionText}</div>}
              <p className="text-sm text-[#D4A855]/70 font-medium mb-1">{pack.name}</p>
              <div className="text-2xl font-bold text-white">{(pack.coins + pack.bonus).toLocaleString()}</div>
              <div className="text-xs text-[#D4A855]/50 mb-2">coins</div>
              {pack.bonus > 0 && <div className="bg-green-500/10 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-2">+{pack.bonus} bonus</div>}
              <div className="text-[#FF6B35] font-bold text-lg">{pack.price.toLocaleString()} FCFA</div>
              {pack.description && <p className="text-[10px] text-[#D4A855]/50 mt-1">{pack.description}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 border-t border-[#8B5A2B]/10">
        <h2 className="text-xl font-bold text-white mb-6 text-center">❓ Questions fréquentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
          {[
            { q: 'Comment utiliser mes coins ?', a: 'Les coins permettent de débloquer des épisodes et des films.' },
            { q: 'Les coins expirent-ils ?', a: 'Non, vos coins restent valables indéfiniment.' },
            { q: 'Puis-je résilier mon abonnement ?', a: 'Oui, annulez à tout moment depuis votre profil.' },
            { q: 'Le paiement est-il sécurisé ?', a: 'Oui, tous les paiements sont sécurisés via CinetPay.' },
          ].map((faq, i) => (
            <div key={i} className="bg-[#1A1A2E] rounded-xl p-4 border border-[#8B5A2B]/10">
              <h3 className="font-bold text-sm text-white mb-1">{faq.q}</h3>
              <p className="text-xs text-[#D4A855]/70">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modales */}
      {isPaymentModalOpen && selectedCoinPack && (
        <PaymentModal isOpen={isPaymentModalOpen} onClose={() => { setIsPaymentModalOpen(false); setSelectedCoinPack(null) }} pack={selectedCoinPack}
          onSuccess={() => { setIsPaymentModalOpen(false); setSelectedCoinPack(null); refreshCoins(); update(); toast.success('Coins ajoutés !', { duration: 2000 }) }} />
      )}
      {isSubscriptionModalOpen && selectedSubscriptionPlan && (
        <SubscriptionPaymentModal isOpen={isSubscriptionModalOpen} onClose={() => { setIsSubscriptionModalOpen(false); setSelectedSubscriptionPlan(null) }} plan={selectedSubscriptionPlan}
          onSuccess={() => { setIsSubscriptionModalOpen(false); setSelectedSubscriptionPlan(null); loadAllData(); update(); toast.success('Abonnement activé !', { duration: 2000 }) }} />
      )}

      <Footer footerTabs={footerTabs} activeFooterTab={activeFooterTab} setActiveFooterTab={setActiveFooterTab} />
    </div>
  )
}