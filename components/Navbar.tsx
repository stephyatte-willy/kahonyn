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
  XMarkIcon
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
  
  // Masquer la navbar sur les pages login et register
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

  // Menu items pour le mobile
  const menuItems = [
    { label: 'Accueil', href: '/' },
    { label: 'Pour vous', href: '/for-you' },
    { label: 'Ma liste', href: '/my-list' },
    { label: 'Primes', href: '/premium' },
    ...(isAdmin ? [{ label: 'Admin', href: '/admin/videos/pending' }] : []),
    { label: 'Profil', href: '/profile' },
  ]

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-kahonyn-sable/30 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="w-8 h-8 bg-gradient-to-br from-kahonyn-energie to-orange-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition">
              <span className="text-white text-sm font-bold">K</span>
            </div>
            <span className="font-bold text-lg text-kahonyn-terre hidden sm:block">
              Kahonyn
            </span>
          </Link>

          {/* Barre de recherche - desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une série, un film..."
                value={localSearch}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 text-sm bg-kahonyn-lumiere/50 border border-kahonyn-sable/30 rounded-full focus:ring-2 focus:ring-kahonyn-energie focus:border-transparent outline-none transition text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Actions utilisateur - desktop */}
          <div className="hidden md:flex items-center gap-4">
            {session ? (
              <>
                <span className="text-sm text-kahonyn-terre">
                  {session.user?.name || session.user?.phone || 'Utilisateur'}
                </span>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-kahonyn-energie transition-colors rounded-lg hover:bg-kahonyn-lumiere"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  className="px-4 py-1.5 text-sm text-kahonyn-terre hover:text-kahonyn-energie transition"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 text-sm bg-gradient-to-r from-kahonyn-energie to-orange-500 text-white rounded-full hover:shadow-md transition"
                >
                  Inscription
                </Link>
              </div>
            )}
          </div>

          {/* Bouton menu mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-kahonyn-lumiere transition"
          >
            {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
        </div>

        {/* Barre de recherche - mobile */}
        <div className="md:hidden pb-3">
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={localSearch}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 text-sm bg-kahonyn-lumiere/50 border border-kahonyn-sable/30 rounded-full focus:ring-2 focus:ring-kahonyn-energie focus:border-transparent outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Menu mobile déroulant */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-kahonyn-sable/20 py-2 px-4 shadow-lg">
          <div className="flex flex-col space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-gray-700 hover:bg-kahonyn-lumiere rounded-lg transition"
              >
                {item.label}
              </Link>
            ))}
            {!session && (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-gray-700 hover:bg-kahonyn-lumiere rounded-lg transition"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 bg-gradient-to-r from-kahonyn-energie to-orange-500 text-white rounded-lg text-center"
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
                className="px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition"
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