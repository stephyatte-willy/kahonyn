"use client"

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'  // ← Correction ici : "from" manquait
import Image from 'next/image'
import { ArrowRightOnRectangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

interface NavbarProps {
  searchTerm?: string
  onSearchChange?: (value: string) => void
}

export default function Navbar({ searchTerm = '', onSearchChange }: NavbarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [localSearch, setLocalSearch] = useState(searchTerm)
  
  // Masquer la navbar sur les pages login et register
  const hideNavbar = router.pathname === '/login' || router.pathname === '/register'

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearch(value)
    if (onSearchChange) {
      onSearchChange(value)
    }
  }

  const userName = session?.user?.name || session?.user?.email || 'Utilisateur'

  if (hideNavbar) {
    return null
  }

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="w-full px-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 py-0.5 sm:py-1 lg:py-0">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <Image 
                src="/logo-kahonyn.png" 
                alt="Kahonyn" 
                width={32} 
                height={32} 
                className="navbar-logo-img"
              />
              <span className="font-bold text-lg bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent hidden sm:inline">
                Kahonyn
              </span>
            </Link>

            {/* Recherche visible sans contour */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Recherche rapide..."
                  value={localSearch}
                  onChange={handleSearchChange}
                  className="w-full min-w-0 pl-11 pr-10 py-1.5 lg:py-0.5 text-sm bg-gray-800/90 rounded-full focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-300 text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Utilisateur + Déconnexion */}
            <div className="flex items-center gap-3 flex-shrink-0 max-w-[140px] sm:max-w-xs">
              {session ? (
                <div className="flex items-center gap-2 truncate text-white">
                  <span className="font-medium truncate text-xs sm:text-sm">{userName}</span>
                </div>
              ) : null}

              <button 
                onClick={() => signOut()} 
                className="flex items-center gap-1.5 text-gray-200 hover:text-orange-500 transition-colors duration-300"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span className="text-sm hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>

          {/* Slogan centré sous la ligne principale */}
          <div className="flex items-center justify-center py-0">
            <div className="text-xs lg:text-[10px] text-gray-300">🎬 Mini séries & films ivoiriens</div>
          </div>
        </div>
      </div>
    </nav>
  )
}