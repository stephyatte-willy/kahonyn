// components/GiftModal.tsx - Version corrigée
"use client"

import { useState, useEffect } from 'react'
import { 
  XMarkIcon, GiftIcon, SparklesIcon, UserGroupIcon, 
  CheckCircleIcon, FireIcon, TrophyIcon,
  TvIcon, PlayIcon, ShareIcon, ClockIcon
} from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

interface DailyReward {
  day: number
  coins: number
  claimed: boolean
  available: boolean
}

interface Mission {
  id: string
  title: string
  reward: number
  progress: number
  target: number
  completed: boolean
  icon: React.ElementType
}

interface GiftModalProps {
  isOpen: boolean
  onClose: () => void
  userCoins: number
  onCoinsUpdated: () => void
}

export default function GiftModal({ isOpen, onClose, userCoins, onCoinsUpdated }: GiftModalProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'daily' | 'missions' | 'invite'>('daily')
  const [dailyRewards, setDailyRewards] = useState<DailyReward[]>([])
  const [streak, setStreak] = useState(0)
  const [hasClaimedToday, setHasClaimedToday] = useState(false)
  const [nextAvailableHours, setNextAvailableHours] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [claimingDay, setClaimingDay] = useState<number | null>(null)
  const [inviteLink, setInviteLink] = useState('')
  const [referralCount, setReferralCount] = useState(0)
  const [missions, setMissions] = useState<Mission[]>([
    { id: 'watch_ad', title: 'Regarder une publicité', reward: 10, progress: 0, target: 1, completed: false, icon: TvIcon },
    { id: 'watch_3_ads', title: 'Regarder 3 publicités', reward: 50, progress: 0, target: 3, completed: false, icon: TvIcon },
    { id: 'share_app', title: 'Partager l\'application', reward: 20, progress: 0, target: 1, completed: false, icon: ShareIcon },
    { id: 'watch_episode', title: 'Regarder 5 épisodes', reward: 100, progress: 0, target: 5, completed: false, icon: PlayIcon },
  ])

  // Chargement des données à l'ouverture
  useEffect(() => {
    if (isOpen && session) {
      loadDailyRewards()
      loadMissionsProgress()
      loadReferralData()
      generateInviteLink()
    }
  }, [isOpen, session])

  // 1. RÉCOMPENSES QUOTIDIENNES
  const loadDailyRewards = async () => {
    try {
      const res = await fetch('/api/user/daily-rewards')
      if (res.ok) {
        const data = await res.json()
        setDailyRewards(data.rewards)
        setStreak(data.streak)
        setHasClaimedToday(data.hasClaimedToday || false)
        setNextAvailableHours(data.nextAvailableIn || null)
        console.log('📊 Daily rewards loaded:', { 
          streak: data.streak, 
          hasClaimedToday: data.hasClaimedToday,
          rewards: data.rewards 
        })
      }
    } catch (error) {
      console.error('Erreur daily rewards:', error)
    }
  }

  const claimDailyReward = async (day: number, coins: number) => {
    if (loading) return
    if (hasClaimedToday) {
      toast.error(`Vous avez déjà réclamé aujourd'hui. Revenez demain !`, { duration: 3000 })
      return
    }
    
    setLoading(true)
    setClaimingDay(day)
    
    try {
      const res = await fetch('/api/user/claim-daily-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, coins })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast.success(`🎁 +${coins} coins !`, { duration: 3000 })
        onCoinsUpdated()
        await loadDailyRewards() // Recharger toutes les données
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
    } finally {
      setLoading(false)
      setClaimingDay(null)
    }
  }

  // 2. MISSIONS
  const loadMissionsProgress = async () => {
    try {
      const res = await fetch('/api/user/missions-progress')
      if (res.ok) {
        const data = await res.json()
        setMissions(prev => prev.map(m => ({
          ...m,
          progress: data[m.id]?.progress || 0,
          completed: data[m.id]?.completed || false
        })))
      }
    } catch (error) {
      console.error('Erreur missions:', error)
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
      
      if (res.ok) {
        toast.success(`🎉 +${reward} coins !`, { duration: 3000 })
        setMissions(prev => prev.map(m => 
          m.id === missionId ? { ...m, completed: true } : m
        ))
        onCoinsUpdated()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  // 3. PARRAINAGE
  const loadReferralData = async () => {
    try {
      const res = await fetch('/api/user/referrals')
      if (res.ok) {
        const data = await res.json()
        setReferralCount(data.count || 0)
      }
    } catch (error) {
      console.error('Erreur referrals:', error)
    }
  }

  const generateInviteLink = () => {
    if (!session?.user) return
    const userId = (session.user as any).id
    setInviteLink(`${window.location.origin}/?ref=${userId}`)
  }

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink)
    toast.success('Lien copié ! Partagez-le avec vos amis')
  }

  if (!isOpen) return null

  // Trouver le prochain jour disponible
  const nextAvailableDay = dailyRewards.find(r => !r.claimed && r.available)?.day

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100000]" onClick={onClose} />
      
      <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-[#1A1A2E] to-[#0D0D0D] rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col border border-[#D4A855]/30 animate-fadeInUp">
          
          {/* Header */}
          <div className="relative bg-gradient-to-r from-[#D4A855] to-[#E5C87B] p-2 text-center flex-shrink-0 rounded-t-3xl">
            <div className="absolute inset-0 bg-black/20 rounded-t-3xl"></div>
            <div className="relative">
              <div className="w-14 h-14 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-2 backdrop-blur-sm">
                <span className="text-[30px]">🎁</span>
              </div>
              <h2 className="text-[18px] font-bold text-white">Gagnez des coins chaque jour</h2>
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
          <div className="flex border-b border-white/10 flex-shrink-0 bg-[#1A1A2E]">
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
              👥 Inviter ({referralCount})
            </button>
          </div>

          {/* Contenu défilable */}
          <div className="flex-1 overflow-y-auto p-5" style={{ maxHeight: 'calc(90vh - 180px)' }}>
            
            {/* Onglet Quotidien */}
            {activeTab === 'daily' && (
              <div className="pb-4">
                
                {/* Grille des récompenses */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {dailyRewards.map((reward) => {
                    const isAvailable = reward.available && !hasClaimedToday
                    const isClaiming = claimingDay === reward.day
                    const isNextAvailable = !reward.claimed && !isAvailable && reward.day === streak + 1 && !hasClaimedToday
                    
                    return (
                      <div
                        key={reward.day}
                        className={`text-center p-1 rounded-[8px] transition-all ${
                          reward.claimed
                            ? 'bg-green-500/50 border border-green-500/60'
                            : isAvailable
                              ? 'bg-gradient-to-br from-[#D4A855] to-[#E5C87B] cursor-pointer hover:scale-105 active:scale-95'
                              : isNextAvailable
                                ? 'bg-white/10 border border-dashed border-[#D4A855]/30 opacity-70'
                                : 'bg-white/5 border border-white/10 opacity-40 cursor-not-allowed'
                        }`}
                        onClick={() => isAvailable && !hasClaimedToday && claimDailyReward(reward.day, reward.coins)}
                      >
                        <p className="text-[10px] font-bold text-white/70">Jour {reward.day}</p>
                        <p className="text-[16px]">🪙</p>
                        <p className="text-[10px] font-bold text-white"> + {reward.coins}</p>
                        
                        {reward.claimed && (
                          <CheckCircleIcon className="w-4 h-4 text-green-400 mx-auto mt-1" />
                        )}
                        
                        {isClaiming && (
                          <div className="mt-1">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mx-auto"></div>
                          </div>
                        )}
                        
                        {isAvailable && !reward.claimed && !isClaiming && !hasClaimedToday && (
                          <div className="mt-1">
                            <span className="text-[8px] bg-white/20 px-1 py-0.5 rounded-full text-white">Disponible</span>
                          </div>
                        )}
                        
                        {isNextAvailable && !hasClaimedToday && (
                          <div className="mt-1">
                            <span className="text-[8px] text-white/30">À venir</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                
                {streak === 7 && (
                  <div className="mt-5 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30 text-center">
                    <SparklesIcon className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                    <p className="text-xs text-white/80">🎉 Semaine complète !</p>
                    <p className="text-[10px] text-white/50">Cycle terminé, un nouveau cycle commence demain</p>
                  </div>
                )}
              </div>
            )}

            {/* Onglet Missions (inchangé) */}
            {activeTab === 'missions' && (
              <div className="space-y-3 pb-4">
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
                        <div className="w-10 h-10 bg-[#D4A855]/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-[#D4A855]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{mission.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-[#D4A855] to-[#E5C87B] rounded-full transition-all"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-white/50 flex-shrink-0">{mission.progress}/{mission.target}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {!mission.completed ? (
                            <button
                              onClick={() => isComplete && claimMission(mission.id, mission.reward)}
                              disabled={!isComplete || loading}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                                isComplete
                                  ? 'bg-gradient-to-r from-[#D4A855] to-[#E5C87B] text-[#1A0A00] hover:scale-105'
                                  : 'bg-white/10 text-white/40 cursor-not-allowed'
                              }`}
                            >
                              {loading ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-[#1A0A00]/30 border-t-[#1A0A00]"></div>
                                  <span>...</span>
                                </>
                              ) : isComplete ? `+${mission.reward} 🪙` : `${mission.reward} 🪙`}
                            </button>
                          ) : (
                            <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500/20 text-green-400 whitespace-nowrap">
                              ✅ Reçu
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Onglet Invitation (inchangé) */}
            {activeTab === 'invite' && (
              <div className="pb-4">
                <div className="text-center mb-6">
                  <UserGroupIcon className="w-16 h-16 text-[#D4A855] mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white">Parrainez vos amis</h3>
                  <p className="text-sm text-white/50 mt-1">
                    Recevez <span className="text-[#D4A855] font-bold">50 coins</span> par ami qui s'inscrit
                  </p>
                  {referralCount >= 10 && (
                    <p className="text-xs text-green-400 mt-2">🏆 Bonus atteint ! +500 coins</p>
                  )}
                </div>
                
                <div className="bg-white/5 rounded-xl p-3 mb-4">
                  <p className="text-xs text-white/50 mb-2">Votre lien d'invitation</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white/10 rounded-lg text-xs text-white/70 font-mono outline-none min-w-0"
                    />
                    <button
                      onClick={copyInviteLink}
                      className="px-4 py-2 bg-gradient-to-r from-[#D4A855] to-[#E5C87B] rounded-lg text-xs font-bold text-[#1A0A00] hover:scale-105 transition flex-shrink-0"
                    >
                      Copier
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-10 h-10 bg-[#D4A855]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <GiftIcon className="w-5 h-5 text-[#D4A855]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">50 coins par parrainage</p>
                      <p className="text-xs text-white/50">Pour chaque ami qui s'inscrit via votre lien</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-10 h-10 bg-[#D4A855]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <TrophyIcon className="w-5 h-5 text-[#D4A855]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Bonus parrainage</p>
                      <p className="text-xs text-white/50">10 invitations = 500 coins bonus</p>
                    </div>
                  </div>
                </div>
                
                {referralCount > 0 && (
                  <div className="mt-4 p-3 bg-[#D4A855]/10 rounded-xl">
                    <p className="text-center text-xs text-white/70">
                      Vous avez déjà parrainé <span className="text-[#D4A855] font-bold">{referralCount}</span> ami{referralCount > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-white/10 text-center flex-shrink-0">
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