"use client"

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  HomeIcon,
  VideoCameraIcon,
  ShoppingBagIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  CurrencyDollarIcon,
  HeartIcon,
  ClockIcon,
  ChartBarIcon,
  TrophyIcon,
  FireIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface UserLayoutProps {
  children: React.ReactNode
}

export default function UserLayout({ children }: UserLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    if (session) {
      fetchUserProfile()
    }
  }, [session])

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      const data = await res.json()
      setUserProfile(data)
    } catch (error) {
      console.error('Erreur chargement profil:', error)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!session) {
    router.push('/login')
    return null
  }

  const isAdmin = session.user?.role === 'admin'
  const isCreator = session.user?.role === 'creator'
  const userAvatar = userProfile?.avatar

  // Menu en fonction du rôle
  const menuItems = [
    { name: 'Tableau de bord', href: '/dashboard', icon: HomeIcon, color: 'text-blue-500' },
  ]

  if (isAdmin) {
    menuItems.push(
      { name: 'Admin Dashboard', href: '/admin/dashboard', icon: ChartBarIcon, color: 'text-purple-500' },
      { name: 'Utilisateurs', href: '/admin/users', icon: UserIcon, color: 'text-green-500' },
      { name: 'Vidéos en attente', href: '/admin/videos/pending', icon: ClockIcon, color: 'text-yellow-500' },
      { name: 'Toutes les vidéos', href: '/admin/videos/all', icon: VideoCameraIcon, color: 'text-red-500' },
      { name: 'Gains', href: '/admin/finances/earnings', icon: CurrencyDollarIcon, color: 'text-emerald-500' },
      { name: 'Retraits', href: '/admin/finances/withdrawals', icon: CurrencyDollarIcon, color: 'text-rose-500' },
      { name: 'Paramètres', href: '/admin/settings', icon: Cog6ToothIcon, color: 'text-gray-500' }
    )
  } else if (isCreator) {
    menuItems.push(
      { name: 'Upload vidéo', href: '/creator/upload', icon: VideoCameraIcon, color: 'text-red-500' },
      { name: 'Mes vidéos', href: '/creator/videos', icon: VideoCameraIcon, color: 'text-orange-500' },
      { name: 'Mes gains', href: '/creator/earnings', icon: CurrencyDollarIcon, color: 'text-green-500' },
      { name: 'Stats & performances', href: '/creator/stats', icon: ChartBarIcon, color: 'text-purple-500' },
      { name: 'Mon profil', href: '/profile', icon: UserIcon, color: 'text-blue-500' },
      { name: 'Paramètres', href: '/settings', icon: Cog6ToothIcon, color: 'text-gray-500' }
    )
  } else {
    menuItems.push(
      { name: 'Mes achats', href: '/user/purchases', icon: ShoppingBagIcon, color: 'text-purple-500' },
      { name: 'Favoris', href: '/user/favorites', icon: HeartIcon, color: 'text-red-500' },
      { name: 'Historique', href: '/user/history', icon: ClockIcon, color: 'text-blue-500' },
      { name: 'Mon profil', href: '/profile', icon: UserIcon, color: 'text-green-500' },
      { name: 'Paramètres', href: '/settings', icon: Cog6ToothIcon, color: 'text-gray-500' }
    )
  }

  const isActive = (href: string) => router.pathname === href


  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Sidebar mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed left-0 top-0 bottom-0 w-72 bg-white shadow-2xl p-5">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-white rounded-xl flex items-center justify-center">
                <Image src="/logo-kahonyn.png" alt="Logo" width={24} height={24} />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Kahonyn
              </span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Profil utilisateur dans sidebar mobile */}
          <div className="mb-6 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                {userAvatar ? (
                  <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  (session.user?.name?.[0] || session.user?.phone?.[0] || 'U').toUpperCase()
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{session.user?.name || session.user?.phone}</p>
                <p className="text-xs text-gray-500 capitalize">{isAdmin ? 'Administrateur' : isCreator ? 'Créateur' : 'Utilisateur'}</p>
              </div>
            </div>
          </div>
          
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'text-white' : item.color}`} />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 mt-4"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span className="font-medium">Déconnexion</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-1 bg-white/80 backdrop-blur-sm shadow-xl">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-white rounded-xl flex items-center justify-center shadow-md">
                <Image src="/logo-kahonyn.png" alt="Logo" width={60} height={60} />
              </div>
              <div>
                <h1 className="font-bold text-xl bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Kahonyn
                </h1>
                <p className="text-xs text-gray-400">Plateforme de mini-séries</p>
              </div>
            </div>
          </div>

          
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'text-white' : item.color}`} />
                <span className="font-medium">{item.name}</span>
                {isActive(item.href) && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
              </Link>
            ))}
          </nav>
          
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span className="font-medium">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="lg:pl-72">
        {/* Header moderne */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-30 border-b border-gray-100">
          <div className="px-4 md:px-6 py-3 flex justify-between items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            
            {/* Section droite du header avec photo de profil */}
            <div className="flex items-center gap-4 ml-auto">
              {/* Notification (optionnel) */}
              <button className="relative p-2 rounded-full hover:bg-gray-100 transition">
                <div className="w-2 h-2 bg-red-500 rounded-full absolute top-1 right-1"></div>
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              
              {/* Profil utilisateur avec photo */}
              <Link href="/profile" className="flex items-center gap-3 group cursor-pointer">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden shadow-md group-hover:shadow-lg transition-all">
                  {userAvatar ? (
                    <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    (session.user?.name?.[0] || session.user?.phone?.[0] || 'U').toUpperCase()
                  )}
                </div>
                <div className="hidden md:block text-right">
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-gray-800 group-hover:text-orange-600 transition">
                {session.user?.name || session.user?.phone}</span>
                </div>
                  <p className="text-xs text-gray-400 capitalize">
                    {isAdmin ? 'Administrateur' : isCreator ? 'Créateur' : 'Membre'}
                  </p>
                  
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Bannière de bienvenue pour créateur */}
        {isCreator && (
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <TrophyIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Espace Créateur</p>
                    <p className="text-xs opacity-90">Gérez vos vidéos et suivez vos revenus</p>
                  </div>
                </div>
                <Link href="/creator/upload" className="bg-white text-orange-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100 transition shadow-md">
                  + Nouvelle vidéo
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Contenu principal avec fond amélioré */}
        <main className="p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}