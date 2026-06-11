// components/GiftModal.tsx
"use client"

import { useState, useEffect } from 'react'
import { 
  XMarkIcon, GiftIcon, SparklesIcon, UserGroupIcon, 
  CheckCircleIcon, FireIcon, TrophyIcon,
  TvIcon, PlayIcon
} from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface DailyReward {
  day: number
  coins: number
  claimed: boolean
  available: boolean
}

interface GiftModalProps {
  isOpen: boolean
  onClose: () => void
  userCoins: number
  onCoinsUpdated: () => void
}

export default function GiftModal({ isOpen, onClose, userCoins, onCoinsUpdated }: GiftModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'daily' | 'missions' | 'invite'>('daily')
  const [dailyRewards, setDailyRewards] = useState<DailyReward[]>([])
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [missions, setMissions] = useState([
    { id: 'watch_ad', title: 'Regarder une pub', reward: 10, progress: 0, target: 1, completed: false, icon: TvIcon },
    { id: 'watch_3_ads', title: 'Regarder 3 pubs', reward: 50, progress: 0, target: 3, completed: false, icon: TvIcon },
    { id: 'share_app', title: 'Partager l\'application', reward: 20, progress: 0, target: 1, completed: false, icon: UserGroupIcon },
    { id: 'watch_episode', title: 'Regarder 5 épisodes', reward: 100, progress: 0, target: 5, completed: false, icon: PlayIcon },
  ])

  useEffect(() => {
    if (isOpen) {
      loadDailyRewards()
      loadMissionsProgress()
      generateInviteLink()
    }
  }, [isOpen])

  const loadDailyRewards = () => {
    const today = new Date().toDateString()
    const saved = localStorage.getItem(`kahonyn_daily_reward_${today}`)
    const savedStreak = localStorage.getItem(`kahonyn_daily_streak`)
    
    const currentStreak = savedStreak ? parseInt(savedStreak) : 0
    setStreak(currentStreak)
    
    const rewards = []
    for (let i = 0; i < 7; i++) {
      const dayReward = i === 0 ? 10 : i === 1 ? 20 : i === 2 ? 30 : i === 3 ? 50 : i === 4 ? 70 : i === 5 ? 100 : 200
      rewards.push({
        day: i + 1,
        coins: dayReward,
        claimed: saved === `claimed_day_${i}`,
        available: i === currentStreak && !saved
      })
    }
    setDailyRewards(rewards)
  }

  const loadMissionsProgress = async () => {
    try {
      const res = await fetch('/api/user/missions-progress')
      const data = await res.json()
      if (data) {
        setMissions(prev => prev.map(m => ({
          ...m,
          progress: data[m.id]?.progress || 0,
          completed: data[m.id]?.completed || false
        })))
      }
    } catch (error) {
      console.error('Erreur chargement missions:', error)
    }
  }

  const generateInviteLink = () => {
    const userId = localStorage.getItem('userId') || 'user'
    setInviteLink(`${window.location.origin}/?ref=${userId}`)
  }

  const claimDailyReward = async (day: number, coins: number) => {
    if (loading) return
    setLoading(true)
    
    try {
      const res = await fetch('/api/user/claim-daily-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, coins })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast.success(`🎁 +${coins} coins !`, { duration: 3000 })
        const today = new Date().toDateString()
        localStorage.setItem(`kahonyn_daily_reward_${today}`, `claimed_day_${day-1}`)
        localStorage.setItem(`kahonyn_daily_streak`, String(day))
        onCoinsUpdated()
        loadDailyRewards()
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const claimMission = async (missionId: string, reward: number) => {
    if (loading) return
    setLoading(true)
    
    try {
      const res = await fetch('/api/user/claim-mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId, reward })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast.success(`🎉 +${reward} coins !`, { duration: 3000 })
        setMissions(prev => prev.map(m => 
          m.id === missionId ? { ...m, completed: true } : m
        ))
        onCoinsUpdated()
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink)
    toast.success('Lien copié ! Partagez-le avec vos amis')
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100000]" onClick={onClose} />
      
      <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-[#1A1A2E] to-[#0D0D0D] rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden border border-[#D4A855]/30 animate-fadeInUp">
          
          {/* Header */}
          <div className="relative bg-gradient-to-r from-[#D4A855] to-[#E5C87B] p-5 text-center">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative">
              <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-2 backdrop-blur-sm">
                <GiftIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">🎁 Cadeaux & Bonus</h2>
              <p className="text-sm text-white/80">Gagnez des coins gratuits chaque jour</p>
              <p className="text-xs text-white/60 mt-1">Solde actuel: {userCoins} 🪙</p>
            </div>
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
            >
              <XMarkIcon className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex-1 py-3 text-sm font-semibold transition-all ${
                activeTab === 'daily' 
                  ? 'text-[#D4A855] border-b-2 border-[#D4A855]' 
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              📅 Quotidien
            </button>
            <button
              onClick={() => setActiveTab('missions')}
              className={`flex-1 py-3 text-sm font-semibold transition-all ${
                activeTab === 'missions' 
                  ? 'text-[#D4A855] border-b-2 border-[#D4A855]' 
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              🎯 Missions
            </button>
            <button
              onClick={() => setActiveTab('invite')}
              className={`flex-1 py-3 text-sm font-semibold transition-all ${
                activeTab === 'invite' 
                  ? 'text-[#D4A855] border-b-2 border-[#D4A855]' 
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              👥 Inviter
            </button>
          </div>

          {/* Contenu */}
          <div className="overflow-y-auto max-h-[60vh] p-5">
            
            {/* Onglet Récompenses quotidiennes */}
            {activeTab === 'daily' && (
              <div>
                {/* Indicateur de streak */}
                <div className="text-center mb-5">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A855]/10 rounded-full">
                    <FireIcon className="w-5 h-5 text-orange-400" />
                    <span className="text-sm font-bold text-white">
                      Série de {streak} jour{streak > 1 ? 's' : ''}
                    </span>
                    {streak === 7 && <TrophyIcon className="w-5 h-5 text-yellow-400" />}
                  </div>
                </div>
                
                {/* Grille des récompenses */}
                <div className="grid grid-cols-7 gap-2">
                  {dailyRewards.map((reward) => (
                    <div
                      key={reward.day}
                      className={`text-center p-2 rounded-xl transition-all ${
                        reward.claimed
                          ? 'bg-green-500/20 border border-green-500/30'
                          : reward.available
                            ? 'bg-gradient-to-br from-[#D4A855] to-[#E5C87B] cursor-pointer hover:scale-105 active:scale-95'
                            : 'bg-white/5 border border-white/10 opacity-50'
                      }`}
                      onClick={() => reward.available && claimDailyReward(reward.day, reward.coins)}
                    >
                      <p className="text-xs font-bold text-white/70">Jour {reward.day}</p>
                      <p className="text-sm font-bold text-white">{reward.coins}</p>
                      <p className="text-[8px] text-white/50">🪙</p>
                      {reward.claimed && <CheckCircleIcon className="w-4 h-4 text-green-400 mx-auto mt-1" />}
                    </div>
                  ))}
                </div>
                
                {/* Bonus semaine complète */}
                {streak === 7 && (
                  <div className="mt-5 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30 text-center">
                    <SparklesIcon className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                    <p className="text-xs text-white/80">🎉 Semaine complète !</p>
                    <p className="text-[10px] text-white/50">Revenez demain pour un nouveau cycle</p>
                  </div>
                )}
              </div>
            )}

            {/* Onglet Missions */}
            {activeTab === 'missions' && (
              <div className="space-y-3">
                {missions.map((mission) => {
                  const Icon = mission.icon
                  const progressPercent = (mission.progress / mission.target) * 100
                  const isComplete = mission.progress >= mission.target && !mission.completed
                  
                  return (
                    <div
                      key={mission.id}
                      className={`p-3 rounded-xl transition-all ${
                        mission.completed
                          ? 'bg-green-500/10 border border-green-500/30'
                          : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#D4A855]/20 rounded-full flex items-center justify-center">
                          <Icon className="w-5 h-5 text-[#D4A855]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">{mission.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-[#D4A855] to-[#E5C87B] rounded-full transition-all"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-white/50">{mission.progress}/{mission.target}</span>
                          </div>
                        </div>
                        {!mission.completed ? (
                          <button
                            onClick={() => isComplete && claimMission(mission.id, mission.reward)}
                            disabled={!isComplete || loading}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isComplete
                                ? 'bg-gradient-to-r from-[#D4A855] to-[#E5C87B] text-[#1A0A00] hover:scale-105'
                                : 'bg-white/10 text-white/40 cursor-not-allowed'
                            }`}
                          >
                            {isComplete ? `+${mission.reward} 🪙` : `${mission.reward} 🪙`}
                          </button>
                        ) : (
                          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500/20 text-green-400">
                            ✅ Reçu
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Onglet Invitation */}
            {activeTab === 'invite' && (
              <div>
                <div className="text-center mb-6">
                  <UserGroupIcon className="w-16 h-16 text-[#D4A855] mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white">Parrainez vos amis</h3>
                  <p className="text-sm text-white/50 mt-1">
                    Recevez <span className="text-[#D4A855] font-bold">50 coins</span> par ami qui s'inscrit
                  </p>
                </div>
                
                {/* Lien d'invitation */}
                <div className="bg-white/5 rounded-xl p-3 mb-4">
                  <p className="text-xs text-white/50 mb-2">Votre lien d'invitation</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white/10 rounded-lg text-xs text-white/70 font-mono outline-none"
                    />
                    <button
                      onClick={copyInviteLink}
                      className="px-4 py-2 bg-gradient-to-r from-[#D4A855] to-[#E5C87B] rounded-lg text-xs font-bold text-[#1A0A00] hover:scale-105 transition"
                    >
                      Copier
                    </button>
                  </div>
                </div>
                
                {/* Avantages */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-10 h-10 bg-[#D4A855]/20 rounded-full flex items-center justify-center">
                      <GiftIcon className="w-5 h-5 text-[#D4A855]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">50 coins par parrainage</p>
                      <p className="text-xs text-white/50">Pour chaque ami qui s'inscrit via votre lien</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-10 h-10 bg-[#D4A855]/20 rounded-full flex items-center justify-center">
                      <TrophyIcon className="w-5 h-5 text-[#D4A855]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Bonus parrainage</p>
                      <p className="text-xs text-white/50">10 invitations = 500 coins bonus</p>
                    </div>
                  </div>
                </div>
                
                {/* Historique des parrainages */}
                <button
                  onClick={() => router.push('/profile?tab=referrals')}
                  className="w-full mt-4 py-2 text-center text-xs text-[#D4A855] hover:text-[#FF6B35] transition font-semibold"
                >
                  Voir mon historique de parrainage →
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 text-center">
            <p className="text-[10px] text-white/30">
              💡 Les récompenses sont réinitialisées chaque jour à minuit
            </p>
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