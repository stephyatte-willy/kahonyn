// components/RewardedAdButton.tsx
"use client"

import { useState, useEffect } from 'react'
import { PlayIcon, TvIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface RewardedAdButtonProps {
  episodeId: string
  episodeNumber: number
  onSuccess: () => void
  variant?: 'primary' | 'secondary'
}

export default function RewardedAdButton({ 
  episodeId, 
  episodeNumber, 
  onSuccess, 
  variant = 'primary' 
}: RewardedAdButtonProps) {
  const [loading, setLoading] = useState(false)
  const [canWatchAd, setCanWatchAd] = useState(true)
  const [remainingAds, setRemainingAds] = useState(5)
  const [watchingAd, setWatchingAd] = useState(false)

  useEffect(() => {
    checkAdAvailability()
  }, [])

  const checkAdAvailability = async () => {
    try {
      const res = await fetch('/api/ad/rewarded')
      const data = await res.json()
      setCanWatchAd(data.canWatchAd)
      setRemainingAds(data.remainingAds)
    } catch (error) {
      console.error('Erreur vérification pub:', error)
    }
  }

  // Simulation de lecture de publicité
  // En production, intégrer Google AdMob, Unity Ads, ou AppLovin
  const showRewardedAd = () => {
    return new Promise<boolean>((resolve) => {
      // 🔴 SIMULATION - À remplacer par votre SDK publicitaire
      setWatchingAd(true)
      
      // Simuler une publicité de 5 secondes
      toast.loading('Publicité en cours... 5s', { duration: 5000 })
      
      setTimeout(() => {
        setWatchingAd(false)
        // 80% de chance que la pub soit vue jusqu'au bout
        const completed = Math.random() > 0.2
        resolve(completed)
      }, 5000)
      
      // En production avec Google AdMob :
      // const rewardAd = new RewardedAd(adUnitId)
      // rewardAd.load()
      // rewardAd.show()
      // rewardAd.onReward(() => resolve(true))
      // rewardAd.onError(() => resolve(false))
    })
  }

  const handleWatchAd = async () => {
    if (!canWatchAd) {
      toast.error(`Limite quotidienne atteinte (${remainingAds}/5 pubs). Réessayez demain.`)
      return
    }

    setLoading(true)

    try {
      // Afficher la publicité récompensée
      const adCompleted = await showRewardedAd()

      if (!adCompleted) {
        toast.error('Publicité non visionnée complètement. Réessayez.')
        setLoading(false)
        return
      }

      // Valider la récompense
      const res = await fetch('/api/ad/rewarded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId, rewardType: 'free_episode' })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(`🎉 Épisode ${episodeNumber} débloqué !`, { duration: 3000 })
        onSuccess()
        await checkAdAvailability()
      } else {
        toast.error(data.error || 'Erreur lors du déblocage')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleWatchAd}
      disabled={loading || watchingAd || !canWatchAd}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold transition-all duration-300 ${
        variant === 'primary'
          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/20'
          : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading || watchingAd ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
          <span className="text-sm">{watchingAd ? 'Publicité...' : 'Chargement...'}</span>
        </>
      ) : (
        <>
          <TvIcon className="w-4 h-4" />
          <span className="text-sm">
            {canWatchAd ? `Regarder une pub (${remainingAds}/5 restantes)` : 'Limite pubs atteinte'}
          </span>
        </>
      )}
    </button>
  )
}