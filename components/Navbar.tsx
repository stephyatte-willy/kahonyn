"use client"

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import { 
  ArrowRightOnRectangleIcon, 
  MagnifyingGlassIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import AuthSlidePanel from './AuthSlidePanel'

interface NavbarProps {
  searchTerm?: string
  onSearchChange?: (value: string) => void
}

export default function Navbar({ searchTerm = '', onSearchChange }: NavbarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [localSearch, setLocalSearch] = useState(searchTerm)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authPanelOpen, setAuthPanelOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  
  const hideNavbar = router.pathname === '/login' || router.pathname === '/register'
  const isAdmin = session?.user?.role === 'admin'

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearch(value)
    if (onSearchChange) {
      onSearchChange(value)
    }
  }

  const openLogin = () => {
    setAuthMode('login')
    setAuthPanelOpen(true)
  }

  const openRegister = () => {
    setAuthMode('register')
    setAuthPanelOpen(true)
  }

  if (hideNavbar) return null

  const menuItems = [
    { label: 'Accueil', href: '/' },
    { label: 'Pour vous', href: '/for-you' },
    { label: 'Ma liste', href: '/my-list' },
    { label: 'Primes', href: '/premium' },
    ...(isAdmin ? [{ label: 'Admin', href: '/admin/videos/pending' }] : []),
    { label: 'Profil', href: '/profile' },
  ]

  return (
    <>
      <nav className="bg-gradient-to-r from-[#0D0D1A]/95 via-[#1A1A35]/95 to-[#0D0D1A]/95 backdrop-blur-2xl border-b border-white/[0.06] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] flex items-center justify-center shadow-xl shadow-[#FF6B35]/25 group-hover:shadow-[#FF6B35]/40 group-hover:scale-105 transition-all duration-500">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-lg text-white tracking-tight leading-tight">Kahonyn</h1>
                <p className="text-[9px] text-[#D4A855]/60 font-medium tracking-[0.2em] uppercase">Mini-séries</p>
              </div>
            </Link>

            {/* Barre de recherche */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B35]/10 to-[#D4A855]/10 rounded-full blur-md opacity-50"></div>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4A855]/50" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={localSearch}
                    onChange={handleSearchChange}
                    className="w-full pl-11 pr-5 py-2.5 text-sm bg-[#1E1E3A]/80 border border-white/[0.08] rounded-full focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]/40 outline-none transition-all text-white placeholder-[#D4A855]/30 backdrop-blur-sm"
                  />
                </div>
              </div>
            </div>

            {/* Actions utilisateur */}
            <div className="hidden md:flex items-center gap-3">
              {session ? (
                <>
                  <div className="flex items-center gap-2.5 px-4 py-2 bg-[#1E1E3A]/80 rounded-xl border border-white/[0.06] backdrop-blur-sm">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] flex items-center justify-center shadow-lg shadow-[#FF6B35]/20">
                      <UserCircleIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-white/90 font-medium">
                      {session.user?.name || session.user?.phone || 'User'}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 px-3.5 py-2 text-sm text-[#D4A855]/70 hover:text-[#FF6B35] transition-colors rounded-xl hover:bg-[#1E1E3A]/50"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span className="hidden lg:inline">Sortir</span>
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={openLogin}
                    className="px-5 py-2.5 text-sm font-medium text-[#D4A855] hover:text-white transition rounded-xl hover:bg-[#1E1E3A]/50 border border-white/[0.06]"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={openRegister}
                    className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white rounded-xl shadow-lg shadow-[#FF6B35]/20 hover:shadow-[#FF6B35]/30 transition-all"
                  >
                    Inscription
                  </button>
                </div>
              )}
            </div>

            {/* Menu mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl text-[#D4A855] hover:bg-[#1E1E3A]/50 transition"
            >
              {mobileMenuOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
            </button>
          </div>

          {/* Recherche mobile */}
          <div className="md:hidden pb-3">
            <div className="relative w-full">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4A855]/50" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={localSearch}
                onChange={handleSearchChange}
                className="w-full pl-11 pr-4 py-2.5 text-sm bg-[#1E1E3A]/80 border border-white/[0.08] rounded-full focus:ring-2 focus:ring-[#FF6B35]/20 outline-none transition text-white placeholder-[#D4A855]/30"
              />
            </div>
          </div>
        </div>

        {/* Menu mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#1A1A35]/95 backdrop-blur-2xl border-t border-white/[0.06] py-3 px-4 shadow-2xl">
            <div className="flex flex-col space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-[#D4A855]/80 hover:bg-[#1E1E3A]/50 rounded-xl transition text-sm font-medium"
                >
                  {item.label}
                </Link>
              ))}
              {!session && (
                <>
                  <button onClick={() => { setMobileMenuOpen(false); openLogin() }} className="px-4 py-3 text-[#D4A855] hover:bg-[#1E1E3A]/50 rounded-xl transition text-sm font-medium text-left">
                    Connexion
                  </button>
                  <button onClick={() => { setMobileMenuOpen(false); openRegister() }} className="px-4 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white rounded-xl text-center text-sm font-medium mt-1">
                    Inscription
                  </button>
                </>
              )}
              {session && (
                <button onClick={() => { signOut(); setMobileMenuOpen(false) }} className="px-4 py-3 text-red-400 hover:bg-red-500/5 rounded-xl transition text-sm text-left">
                  Déconnexion
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      <AuthSlidePanel isOpen={authPanelOpen} onClose={() => setAuthPanelOpen(false)} initialMode={authMode} />
    </>
  )
}