// components/UnlockEpisodeModal.tsx
"use client"

import { XMarkIcon, CurrencyDollarIcon, TvIcon, LockClosedIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

interface UnlockEpisodeModalProps {
  isOpen: boolean
  onClose: () => void
  episodeNumber: number
  episodeTitle: string
  episodePrice: number
  userCoins: number
  remainingAds: number
  maxAdsPerDay: number
  onPurchase: () => void
  onWatchAd: () => void
  isPurchasing?: boolean
  isWatchingAd?: boolean
}

export default function UnlockEpisodeModal({
  isOpen,
  onClose,
  episodeNumber,
  episodeTitle,
  episodePrice,
  userCoins,
  remainingAds,
  maxAdsPerDay,
  onPurchase,
  onWatchAd,
  isPurchasing = false,
  isWatchingAd = false
}: UnlockEpisodeModalProps) {
  const router = useRouter()
  
  if (!isOpen) return null

  const hasEnoughCoins = userCoins >= episodePrice
  const hasAdsLeft = remainingAds > 0
  const adsUsed = maxAdsPerDay - remainingAds
  const isLimitReached = remainingAds === 0

  const handleRechargeCoins = () => {
    onClose()
    router.push('/premium')
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100000]" onClick={onClose} />
      
      {/* ✅ MODIFICATION : Ajout de overflow-y-auto pour permettre le défilement */}
      <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-[#1A1A2E] to-[#0D0D0D] rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-[#FF6B35]/30 animate-fadeInUp">
          
          {/* Header - Sticky pour rester visible pendant le défilement */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] pt-1 pb-3 px-6 text-center">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative">
              <h2 className="text-lg font-bold text-white "><span> 🔒 </span>Épisode verrouillé</h2>
              <p className="text-xs text-white/80 mt-1">
                Épisode {episodeNumber} • {episodeTitle.substring(0, 35)}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="absolute top-3 right-3 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
            >
              <XMarkIcon className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Contenu - Tout le reste est défilable */}
          <div className="p-5">
            {/* Solde utilisateur */}
            <div className="bg-[#1A1A2E]/50 rounded-xl p-2 mb-5 text-center border border-white/10">
              <p className="text-xs text-white/50">Votre solde</p>
              <p className="text-xl font-bold text-[#D4A855]">{userCoins.toLocaleString()} 🪙 coins</p>
            </div>

            {/* Indicateur de pubs du jour */}
            <div className="mb-4 text-center">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
                isLimitReached ? 'bg-red-500/20' : 'bg-white/5'
              }`}>
                <TvIcon className={`w-3.5 h-3.5 ${isLimitReached ? 'text-red-400' : 'text-purple-400'}`} />
                <span className={`text-[10px] ${isLimitReached ? 'text-red-400' : 'text-white/60'}`}>
                  {isLimitReached 
                    ? `❌ Limite atteinte (${maxAdsPerDay}/${maxAdsPerDay})`
                    : `${adsUsed}/${maxAdsPerDay} pubs regardées aujourd'hui`
                  }
                </span>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {/* Option 1: Acheter avec coins */}
              <button
                onClick={onPurchase}
                disabled={isPurchasing || isWatchingAd}
                className={`w-full py-2 px-4 rounded-xl transition-all duration-300 flex items-center gap-3 ${
                  hasEnoughCoins
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:shadow-amber-500/30 active:scale-[0.98]'
                    : 'bg-gray-700/50 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <CurrencyDollarIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-bold text-white">Acheter avec des coins</p>
                  <p className="text-xs text-white/70">{episodePrice} coins</p>
                </div>
                {isPurchasing ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                ) : (
                  <span className="text-white text-sm font-bold">
                    {hasEnoughCoins ? '🪙 Acheter' : `${episodePrice - userCoins} coins manquants`}
                  </span>
                )}
              </button>

              {/* Séparateur */}
              {hasAdsLeft && (
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-[#0D0D0D] text-white/40 font-semibold">OU</span>
                  </div>
                </div>
              )}

              {/* Option 2: Publicité */}
              {hasAdsLeft && (
                <button
                  onClick={onWatchAd}
                  disabled={isPurchasing || isWatchingAd}
                  className={`w-full py-1 px-2 rounded-xl transition-all duration-300 flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/30 active:scale-[0.98] ${
                    isPurchasing || isWatchingAd ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <TvIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-white">Regarder une publicité</p>
                    <p className="text-xs text-white/70">
                      Gratuit • {remainingAds} pub{remainingAds > 1 ? 's' : ''} restante{remainingAds > 1 ? 's' : ''}
                    </p>
                  </div>
                  {isWatchingAd ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                      <span className="text-xs text-white">Publicité...</span>
                    </div>
                  ) : (
                    <span className="text-white font-bold text-sm">📺 Regarder</span>
                  )}
                </button>
              )}

              {/* Message limite atteinte */}
              {isLimitReached && (
                <div className="mt-4 p-4 bg-red-500/10 rounded-xl border border-red-500/20 text-center">
                  <TvIcon className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-red-400">Limite quotidienne atteinte</p>
                  <p className="text-xs text-red-400/80 mt-1">
                    Vous avez utilisé vos {maxAdsPerDay} publicités gratuites aujourd'hui.
                  </p>
                  <p className="text-xs text-red-400/70 mt-2">
                    Réessayez demain ou rechargez des coins pour continuer.
                  </p>
                </div>
              )}
            </div>

            {/* Message si solde insuffisant mais pubs disponibles */}
            {!hasEnoughCoins && hasAdsLeft && (
              <div className="mt-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <p className="text-xs text-purple-400 text-center flex items-center justify-center gap-1">
                  <SparklesIcon className="w-3.5 h-3.5" />
                  {remainingAds} publicité{remainingAds > 1 ? 's' : ''} gratuite{remainingAds > 1 ? 's' : ''} disponible{remainingAds > 1 ? 's' : ''} aujourd'hui !
                </p>
              </div>
            )}

            {/* Bouton recharge de coins */}
            {!hasEnoughCoins && (
              <div className="mt-2 text-center">
                <button
                  onClick={handleRechargeCoins}
                  className="text-xs text-[#D4A855] hover:text-[#FF6B35] transition font-semibold underline"
                >
                  💰 Recharger mes coins
                </button>
              </div>
            )}

            {/* Barre de progression des pubs */}
            {hasAdsLeft && (
              <div className="mt-3">
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(adsUsed / maxAdsPerDay) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-white/30 text-center mt-2">
                  {adsUsed}/{maxAdsPerDay} pubs regardées • {remainingAds} gratuite{remainingAds > 1 ? 's' : ''} restante{remainingAds > 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Petit espace en bas pour mieux scroller */}
            <div className="h-2" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.3s ease-out; }
      `}</style>
    </>
  )
}