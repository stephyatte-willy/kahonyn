"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import { 
  ArrowRightOnRectangleIcon, 
  MagnifyingGlassIcon,
  UserCircleIcon,
  GiftIcon,
  ChevronDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useState, useRef, useEffect } from 'react'
import AuthSlidePanel from './AuthSlidePanel'
import NotificationBell from './NotificationBell'

interface Category {
  id: string
  label: string
  icon: string
}

interface NavbarProps {
  searchTerm?: string
  onSearchChange?: (value: string) => void
  activeCategory?: string
  onCategoryChange?: (category: string) => void
  categories?: Category[]
  allCategories?: Category[]
  hideCategories?: boolean
}

const horizontalCategories = [
  { id: 'popular', label: 'Populaires', icon: '🔥' },
  { id: 'anime', label: 'Animé', icon: '🎌' },
  { id: 'unpublished', label: 'Inédit', icon: '✨' },
  { id: 'ranking', label: 'Classement', icon: '🏆' },
  { id: 'dubbed', label: 'Doublés', icon: '🎤' },
  { id: 'vip', label: 'VIP', icon: '👑' },
  { id: 'women', label: 'Femmes', icon: '👩' },
  { id: 'men', label: 'Hommes', icon: '👨' },
]

export default function Navbar({ 
  searchTerm = '', 
  onSearchChange, 
  activeCategory = 'popular',
  onCategoryChange,
  categories = horizontalCategories,
  allCategories,
  hideCategories = false
}: NavbarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [localSearch, setLocalSearch] = useState(searchTerm)
  const [authPanelOpen, setAuthPanelOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  const hideNavbar = router.pathname === '/login' || router.pathname === '/register'
  const displayAllCategories = allCategories || categories

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowCategoryModal(false)
      }
    }
    if (showCategoryModal) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCategoryModal])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearch(value)
    if (onSearchChange) { onSearchChange(value) }
  }

  const handleCategorySelect = (categoryId: string) => {
    onCategoryChange?.(categoryId)
    setShowCategoryModal(false)
  }

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode)
    setAuthPanelOpen(true)
  }

  if (hideNavbar) return null

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#331900]/30 backdrop-blur-2xl shadow-2xl shadow-black/50">
        {/* Partie supérieure */}
        <div className={`${!hideCategories ? 'border-b border-white/[0.06]' : ''}`}>
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
            <div className="flex items-center justify-between h-14 sm:h-16">
              
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
                  <Image
                    src="/logo-kahonyn.png"
                    alt="Kahonyn"
                    width={70}
                    height={70}
                    className="object-contain"
                    priority
                  />
                <div className="hidden sm:block">
                  <h1 className="font-extrabold text-lg sm:text-xl text-white tracking-tight leading-none">Kahonyn</h1>
                  <p className="text-[9px] sm:text-[10px] text-[#D4A855] font-bold tracking-[0.2em] uppercase">RACONTE UNE HISTOIRE</p>
                </div>
              </Link>

              {/* Barre de recherche */}
              {!hideCategories && (
                <div className="flex-1 max-w-[180px] sm:max-w-[280px] md:max-w-md mx-3 sm:mx-6">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={localSearch}
                      onChange={handleSearchChange}
                      className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-2.5 text-sm bg-white/[0.08] border border-white/[0.08] rounded-full focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]/50 outline-none transition-all text-white font-medium placeholder-white/70 backdrop-blur-sm"
                    />
                  </div>
                </div>
              )}

              {hideCategories && <div className="flex-1" />}

              {/* Boutons droite */}
              <div className="flex items-center gap-2 sm:gap-3">
                <NotificationBell />
                
                {/* Bouton Bonus */}
                <button className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-[#D4A855] to-[#E5C87B] rounded-full shadow-lg shadow-[#D4A855]/20 active:scale-95 hover:scale-105 transition-transform">
                  <GiftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#0D0D0D]" />
                </button>

                {/* Mobile : Profil/Déconnexion */}
                <div className="md:hidden">
                  {session ? (
                    <button onClick={() => signOut()} className="flex items-center justify-center w-9 h-9 bg-red-500/20 rounded-full hover:bg-red-500/30 active:scale-95 transition-all">
                      <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-400" />
                    </button>
                  ) : (
                    <button onClick={() => openAuth('login')} className="flex items-center justify-center w-9 h-9 bg-white/10 rounded-full hover:bg-white/20 active:scale-95 transition-all">
                      <UserCircleIcon className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>

                {/* Desktop */}
                <div className="hidden md:flex items-center gap-3">
                  {session ? (
                    <>
                      <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.04] rounded-xl border border-white/[0.06]">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] flex items-center justify-center shadow-lg">
                          <UserCircleIcon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm text-white font-semibold">
                          {session.user?.name || session.user?.phone || 'User'}
                        </span>
                      </div>
                      <button onClick={() => signOut()} className="flex items-center gap-2 px-3.5 py-2 text-sm text-white/60 hover:text-white font-semibold transition rounded-xl hover:bg-white/[0.04]">
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        <span className="hidden lg:inline">Sortir</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => openAuth('login')} className="px-5 py-2.5 text-sm font-semibold text-white/80 hover:text-white transition rounded-xl hover:bg-white/[0.04] border border-white/[0.06]">
                        Connexion
                      </button>
                      <button onClick={() => openAuth('register')} className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white rounded-xl shadow-lg shadow-[#FF6B35]/20 hover:shadow-[#FF6B35]/40 transition-all">
                        Inscription
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barre des catégories - Bouton Catégories FIXE à droite */}
        {!hideCategories && (
          <div className="bg-[#0D0D0D]/98 backdrop-blur-xl border-b border-white/[0.04]">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 relative">
              <div className="flex items-center py-2">
                {/* Zone défilante des catégories */}
                <div className="flex-1 overflow-x-auto scrollbar-hide" ref={scrollContainerRef}>
                  <div className="flex items-center gap-1.5 pr-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                          activeCategory === cat.id
                            ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-lg shadow-[#FF6B35]/20'
                            : 'bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white border border-white/[0.04]'
                        }`}
                      >
                        <span className="mr-1.5 text-sm">{cat.icon}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* 🆕 Bouton Catégories FIXE à droite */}
                <div className="flex-shrink-0 pl-2 border-l border-white/[0.06] ml-1">
                  <button
                    onClick={() => setShowCategoryModal(true)}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 ${
                      showCategoryModal 
                        ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-lg shadow-[#FF6B35]/20'
                        : 'bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white border border-white/[0.04]'
                    }`}
                  >
                    <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-300 ${showCategoryModal ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className={hideCategories ? 'h-[56px] sm:h-[64px]' : 'h-[104px] sm:h-[112px]'} />

      {/* Modal catégories */}
      {showCategoryModal && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={() => setShowCategoryModal(false)} />
          <div ref={modalRef} className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#1A1A2E] to-[#0D0D0D] rounded-t-[2.5rem] z-50 animate-slideUp max-h-[80vh] overflow-hidden shadow-2xl border-t border-white/[0.06]">
            <div className="sticky top-0 bg-[#0D0D0D]/98 backdrop-blur-xl p-5 border-b border-white/[0.04] flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Toutes les catégories</h2>
                <p className="text-sm text-white/50 font-medium mt-0.5">Choisissez votre univers</p>
              </div>
              <button onClick={() => setShowCategoryModal(false)} className="p-2.5 hover:bg-white/[0.06] rounded-xl transition">
                <XMarkIcon className="w-6 h-6 text-white" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[70vh] p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {displayAllCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 ${
                      activeCategory === cat.id
                        ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-lg shadow-[#FF6B35]/20'
                        : 'bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white border border-white/[0.04]'
                    }`}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="font-semibold text-base">{cat.label}</span>
                    {activeCategory === cat.id && <span className="ml-auto text-white">✦</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <AuthSlidePanel 
        isOpen={authPanelOpen} 
        onClose={() => setAuthPanelOpen(false)} 
        initialMode={authMode}
        onSwitchMode={setAuthMode}
      />
    </>
  )
}