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
    if (onSearchChange) {
      onSearchChange(value)
    }
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#0D0D1A]/95 via-[#1A1A35]/95 to-[#0D0D1A]/95 backdrop-blur-2xl shadow-lg shadow-black/20">
        {/* Partie supérieure : Logo + Recherche + Actions */}
        <div className={`${!hideCategories ? 'border-b border-white/[0.06]' : ''}`}>
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
            <div className="flex items-center justify-between h-12 sm:h-14">
              
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
                <div className="relative w-8 h-8 sm:w-9 sm:h-9">
                  <Image
                    src="/logo-kahonyn.png"
                    alt="Kahonyn"
                    width={36}
                    height={36}
                    className="object-contain group-hover:scale-105 transition-transform duration-300"
                    priority
                  />
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-bold text-sm sm:text-base text-white tracking-tight leading-tight">Kahonyn</h1>
                  <p className="text-[8px] sm:text-[9px] text-white/80 font-bold tracking-[0.15em] uppercase">Mini-séries</p>
                </div>
              </Link>

              {/* Barre de recherche */}
              {!hideCategories && (
                <div className="flex-1 max-w-[160px] sm:max-w-[250px] md:max-w-md mx-2 sm:mx-4">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/60" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={localSearch}
                      onChange={handleSearchChange}
                      className="w-full pl-8 sm:pl-10 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-[#1E1E3A]/80 border border-white/[0.08] rounded-full focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]/40 outline-none transition-all text-white font-bold placeholder-white/40 backdrop-blur-sm"
                    />
                  </div>
                </div>
              )}

              {hideCategories && <div className="flex-1" />}

              {/* Boutons droite */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Icône Bonus */}
                <button className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-r from-[#D4A855] to-[#E5C87B] rounded-full shadow-lg shadow-[#D4A855]/20 active:scale-95 hover:scale-105 transition-transform">
                  <GiftIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#0D0D1A]" />
                </button>

                {/* Mobile : Profil/Déconnexion */}
                <div className="md:hidden">
                  {session ? (
                    <button
                      onClick={() => signOut()}
                      className="flex items-center justify-center w-8 h-8 bg-red-500/20 rounded-full hover:bg-red-500/30 active:scale-95 transition-all"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 text-red-400" />
                    </button>
                  ) : (
                    <button
                      onClick={() => openAuth('login')}
                      className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-full hover:bg-white/20 active:scale-95 transition-all"
                    >
                      <UserCircleIcon className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>

                {/* Desktop : Actions */}
                <div className="hidden md:flex items-center gap-3">
                  {session ? (
                    <>
                      <div className="flex items-center gap-2.5 px-4 py-2 bg-[#1E1E3A]/80 rounded-xl border border-white/[0.06] backdrop-blur-sm">
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] flex items-center justify-center shadow-lg shadow-[#FF6B35]/20">
                          <UserCircleIcon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm text-white font-bold">
                          {session.user?.name || session.user?.phone || 'User'}
                        </span>
                      </div>
                      <button
                        onClick={() => signOut()}
                        className="flex items-center gap-2 px-3.5 py-2 text-sm text-white/70 hover:text-white font-bold transition-colors rounded-xl hover:bg-[#1E1E3A]/50"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        <span className="hidden lg:inline">Sortir</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openAuth('login')}
                        className="px-5 py-2.5 text-sm font-bold text-white/80 hover:text-white transition rounded-xl hover:bg-[#1E1E3A]/50 border border-white/[0.06]"
                      >
                        Connexion
                      </button>
                      <button
                        onClick={() => openAuth('register')}
                        className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white rounded-xl shadow-lg shadow-[#FF6B35]/20 hover:shadow-[#FF6B35]/30 transition-all"
                      >
                        Inscription
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barre des catégories - CENTRÉE */}
        {!hideCategories && (
          <div className="bg-gradient-to-r from-[#0D0D1A]/95 via-[#1A1A35]/95 to-[#0D0D1A]/95 backdrop-blur-xl border-b border-white/[0.06]">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 relative">
              <div className="flex items-center justify-center py-2.5">
                <div className="overflow-x-auto scrollbar-hide" ref={scrollContainerRef}>
                  <div className="flex items-center justify-center gap-1 px-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                          activeCategory === cat.id
                            ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-lg shadow-[#FF6B35]/20'
                            : 'bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:text-white border border-white/[0.04]'
                        }`}
                      >
                        <span className="mr-1.5">{cat.icon}</span>
                        {cat.label}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setShowCategoryModal(true)}
                      className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 ${
                        showCategoryModal 
                          ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-lg shadow-[#FF6B35]/20'
                          : 'bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:text-white border border-white/[0.04]'
                      }`}
                    >
                      <span>📂</span>
                      <span>Catégories</span>
                      <ChevronDownIcon className={`w-3 h-3 transition-transform duration-300 ${showCategoryModal ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className={hideCategories ? 'h-[48px] sm:h-[56px]' : 'h-[88px] sm:h-[96px]'} />

      {/* Modal catégories */}
      {showCategoryModal && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowCategoryModal(false)} />
          <div ref={modalRef} className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#1A1A35] to-[#202045] rounded-t-[2.5rem] z-50 animate-slideUp max-h-[80vh] overflow-hidden shadow-2xl border-t border-white/[0.06]">
            <div className="sticky top-0 bg-[#1A1A35]/95 backdrop-blur-xl p-6 border-b border-white/[0.04] flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white">Toutes les catégories</h2>
                <p className="text-xs text-white/60 font-bold mt-0.5">Choisissez votre univers</p>
              </div>
              <button onClick={() => setShowCategoryModal(false)} className="p-2.5 hover:bg-white/[0.05] rounded-xl transition">
                <XMarkIcon className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[70vh] p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {displayAllCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 ${
                      activeCategory === cat.id
                        ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-lg shadow-[#FF6B35]/20'
                        : 'bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:text-white border border-white/[0.04]'
                    }`}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="font-bold text-sm">{cat.label}</span>
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