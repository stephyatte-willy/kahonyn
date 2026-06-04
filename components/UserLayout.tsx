// components/UserLayout.tsx
"use client"

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { HomeIcon, VideoCameraIcon, ShoppingBagIcon, UserIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon, CurrencyDollarIcon, HeartIcon, ClockIcon, ChartBarIcon, TrophyIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

interface UserLayoutProps { children: React.ReactNode }

export default function UserLayout({ children }: UserLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => { if (session) fetchUserProfile() }, [session])

  const fetchUserProfile = async () => {
    try { const res = await fetch('/api/user/profile'); const data = await res.json(); setUserProfile(data) }
    catch (error) { console.error('Erreur chargement profil:', error) }
  }

  if (status === 'loading') return <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div></div>
  if (!session) { router.push('/login'); return null }

  const isAdmin = (session.user as any)?.role === 'admin'
  const isCreator = (session.user as any)?.role === 'creator'
  const userAvatar = userProfile?.avatar
  const displayName = session.user?.name || (session.user as any)?.phone || 'Utilisateur'
  const displayInitial = (displayName[0] || 'U').toUpperCase()

  const menuItems: any[] = [{ name: 'Tableau de bord', href: '/dashboard', icon: HomeIcon }]
  if (isAdmin) {
    menuItems.push({ name: 'Admin', href: '/admin/dashboard', icon: ChartBarIcon }, { name: 'Utilisateurs', href: '/admin/users', icon: UserIcon }, { name: 'Vidéos en attente', href: '/admin/videos/pending', icon: ClockIcon }, { name: 'Toutes les vidéos', href: '/admin/videos/all', icon: VideoCameraIcon }, { name: 'Gains', href: '/admin/finances/earnings', icon: CurrencyDollarIcon }, { name: 'Retraits', href: '/admin/finances/withdrawals', icon: CurrencyDollarIcon }, { name: 'Paramètres', href: '/admin/settings', icon: Cog6ToothIcon })
  } else if (isCreator) {
    menuItems.push({ name: 'Upload', href: '/creator/upload', icon: VideoCameraIcon }, { name: 'Mes vidéos', href: '/creator/videos', icon: VideoCameraIcon }, { name: 'Gains', href: '/creator/earnings', icon: CurrencyDollarIcon }, { name: 'Stats', href: '/creator/stats', icon: ChartBarIcon }, { name: 'Profil', href: '/profile', icon: UserIcon }, { name: 'Paramètres', href: '/settings', icon: Cog6ToothIcon })
  } else {
    menuItems.push({ name: 'Achats', href: '/user/purchases', icon: ShoppingBagIcon }, { name: 'Favoris', href: '/user/favorites', icon: HeartIcon }, { name: 'Historique', href: '/user/history', icon: ClockIcon }, { name: 'Profil', href: '/profile', icon: UserIcon }, { name: 'Paramètres', href: '/settings', icon: Cog6ToothIcon })
  }

  const isActive = (href: string) => router.pathname === href

  const SidebarContent = () => (
    <div className="flex flex-col flex-1">
      <div className="p-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] rounded-xl flex items-center justify-center shadow-lg">
            <Image src="/logo-kahonyn.png" alt="Logo" width={28} height={28} />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">Kahonyn</h1>
            <p className="text-[10px] text-white/40">Mini-séries</p>
          </div>
        </div>
      </div>
      <div className="mb-4 mx-3 mt-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
            {userAvatar ? <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" /> : displayInitial}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-white truncate">{displayName}</p>
            <p className="text-[10px] text-white/40 capitalize">{isAdmin ? 'Admin' : isCreator ? 'Créateur' : 'Client'}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive(item.href) ? 'bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/20' : 'text-white/60 hover:bg-white/[0.04] hover:text-white'}`}>
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">{item.name}</span>
          </Link>
        ))}
        <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition mt-4">
          <ArrowRightOnRectangleIcon className="w-5 h-5" /><span className="font-medium text-sm">Déconnexion</span>
        </button>
      </nav>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* Sidebar mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed left-0 top-0 bottom-0 w-72 bg-[#1A1A2E] shadow-2xl border-r border-white/[0.06]">
          <div className="flex justify-between items-center p-4 border-b border-white/[0.06]">
            <span className="font-bold text-white">Menu</span>
            <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-white/[0.06] rounded-full"><XMarkIcon className="w-5 h-5 text-white" /></button>
          </div>
          <SidebarContent />
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-1 bg-[#1A1A2E] border-r border-white/[0.06]">
          <SidebarContent />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="lg:pl-72">
        <header className="bg-[#0D0D0D]/98 backdrop-blur-xl sticky top-0 z-30 border-b border-white/[0.04]">
          <div className="px-4 md:px-6 py-3 flex justify-between items-center">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl text-white/60 hover:bg-white/[0.06]"><Bars3Icon className="w-6 h-6" /></button>
            <Link href="/profile" className="flex items-center gap-3 ml-auto group">
              <div className="w-9 h-9 bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden shadow-md group-hover:shadow-lg transition">
                {userAvatar ? <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" /> : displayInitial}
              </div>
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-white group-hover:text-[#FF6B35] transition">{displayName}</p>
                <p className="text-[10px] text-white/40 capitalize">{isAdmin ? 'Admin' : isCreator ? 'Créateur' : 'Client'}</p>
              </div>
            </Link>
          </div>
        </header>

        {isCreator && (
          <div className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <TrophyIcon className="w-5 h-5" />
                <div><p className="text-sm font-medium">Espace Créateur</p><p className="text-xs opacity-80">Gérez vos vidéos et revenus</p></div>
              </div>
              <Link href="/creator/upload" className="bg-white text-[#FF6B35] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100 transition shadow-md">+ Nouvelle vidéo</Link>
            </div>
          </div>
        )}

        <main className="p-4 md:p-6"><div className="max-w-7xl mx-auto">{children}</div></main>
      </div>
    </div>
  )
}