"use client"

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { 
  ArrowRightOnRectangleIcon, 
  MagnifyingGlassIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'

interface NavbarProps {
  searchTerm?: string
  onSearchChange?: (value: string) => void
}

export default function Navbar({ searchTerm = '', onSearchChange }: NavbarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [localSearch, setLocalSearch] = useState(searchTerm)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const hideNavbar = router.pathname === '/login' || router.pathname === '/register'
  const isAdmin = session?.user?.role === 'admin'

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearch(value)
    if (onSearchChange) {
      onSearchChange(value)
    }
  }

  if (hideNavbar) {
    return null
  }

  const menuItems = [
    { label: 'Accueil', href: '/' },
    { label: 'Pour vous', href: '/for-you' },
    { label: 'Ma liste', href: '/my-list' },
    { label: 'Primes', href: '/premium' },
    ...(isAdmin ? [{ label: 'Admin', href: '/admin/videos/pending' }] : []),
    { label: 'Profil', href: '/profile' },
  ]

  return (
    <nav className="bg-gray-950/95 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition">
              <span className="text-white text-sm font-bold">K</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-lg bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Kahonyn
              </span>
              <p className="text-[10px] text-gray-500 -mt-0.5">Mini-séries & films</p>
            </div>
          </Link>

          {/* Barre de recherche - desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher une série, un film..."
                value={localSearch}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-900 border border-gray-700 rounded-full focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition text-gray-200 placeholder-gray-500"
              />
            </div>
          </div>

          {/* Actions utilisateur - desktop */}
          <div className="hidden md:flex items-center gap-4">
            {session ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/50 rounded-full">
                  <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                    <UserCircleIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-gray-300">
                    {session.user?.name || session.user?.phone || 'Utilisateur'}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-amber-400 transition-colors rounded-lg hover:bg-gray-800"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  className="px-4 py-1.5 text-sm text-gray-300 hover:text-amber-400 transition"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full hover:shadow-lg hover:shadow-amber-500/25 transition"
                >
                  Inscription
                </Link>
              </div>
            )}
          </div>

          {/* Bouton menu mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:bg-gray-800 transition"
          >
            {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
        </div>

        {/* Barre de recherche - mobile */}
        <div className="md:hidden pb-3">
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={localSearch}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-900 border border-gray-700 rounded-full focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition text-gray-200"
            />
          </div>
        </div>
      </div>

      {/* Menu mobile déroulant */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-950 border-t border-gray-800 py-2 px-4 shadow-xl">
          <div className="flex flex-col space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition"
              >
                {item.label}
              </Link>
            ))}
            {!session && (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-center"
                >
                  Inscription
                </Link>
              </>
            )}
            {session && (
              <button
                onClick={() => {
                  signOut()
                  setMobileMenuOpen(false)
                }}
                className="px-3 py-2 text-left text-red-400 hover:bg-red-500/10 rounded-lg transition"
              >
                Déconnexion
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}