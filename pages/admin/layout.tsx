"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  HomeIcon,
  VideoCameraIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon,
  StarIcon,
  GiftIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [premiumOpen, setPremiumOpen] = useState(false)
  const [financesOpen, setFinancesOpen] = useState(false)

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!session || (session.user as any)?.role !== 'admin') {
      router.push('/')
    }
  }, [session, sessionStatus, router])

  // Ouvrir automatiquement le menu Premium si on est sur une de ses pages
  useEffect(() => {
    const path = router.pathname
    if (path.includes('/admin/premium')) setPremiumOpen(true)
    if (path.includes('/admin/finances')) setFinancesOpen(true)
  }, [router.pathname])

  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!session || (session.user as any)?.role !== 'admin') {
    return null
  }

  const isActive = (href: string) => router.pathname === href

  const menuItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
    { name: 'Utilisateurs', href: '/admin/users', icon: UserGroupIcon },
    { name: 'Créditer Coins', href: '/admin/users/coins', icon: CurrencyDollarIcon },
    { name: 'Vidéos en attente', href: '/admin/videos/pending', icon: ClockIcon },
    { name: 'Toutes les vidéos', href: '/admin/videos/all', icon: VideoCameraIcon },
  ]

  // Sous-menu Premium
  const premiumItems = [
    { name: 'Abonnements', href: '/admin/premium/plans', icon: SparklesIcon },
    { name: 'Packs de coins', href: '/admin/premium/packs', icon: GiftIcon },
    { name: 'Avantages VIP', href: '/admin/premium/benefits', icon: StarIcon },
  ]

  // Sous-menu Finances
  const financeItems = [
    { name: 'Gains créateurs', href: '/admin/finances/earnings', icon: CurrencyDollarIcon },
    { name: 'Demandes de retrait', href: '/admin/finances/withdrawals', icon: CreditCardIcon },
  ]

  const bottomItems = [
    { name: 'Paramètres', href: '/admin/settings', icon: Cog6ToothIcon },
  ]

  // Composant pour un lien du menu
  const MenuLink = ({ item }: { item: { name: string; href: string; icon: any } }) => (
    <Link
      href={item.href}
      onClick={() => setSidebarOpen(false)}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
        isActive(item.href)
          ? 'bg-orange-500 text-white'
          : 'text-gray-300 hover:bg-gray-800'
      }`}
    >
      <item.icon className="w-5 h-5 flex-shrink-0" />
      <span>{item.name}</span>
    </Link>
  )

  // Composant pour la sidebar (utilisé dans mobile et desktop)
  const SidebarContent = () => (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold">Kahonyn</h1>
        <p className="text-xs text-gray-400 mt-1">Administration</p>
      </div>
      
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* Menu principal */}
        {menuItems.map((item) => (
          <MenuLink key={item.href} item={item} />
        ))}

        {/* Séparateur */}
        <div className="my-2 border-t border-gray-800" />

        {/* Menu Premium déroulant */}
        <button
          onClick={() => setPremiumOpen(!premiumOpen)}
          className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition text-gray-300 hover:bg-gray-800"
        >
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-5 h-5 flex-shrink-0 text-amber-400" />
            <span>Premium</span>
          </div>
          {premiumOpen ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
        </button>
        
        {premiumOpen && (
          <div className="ml-4 space-y-1 border-l border-gray-700 pl-3">
            {premiumItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  isActive(item.href)
                    ? 'bg-orange-500/80 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Menu Finances déroulant */}
        <button
          onClick={() => setFinancesOpen(!financesOpen)}
          className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition text-gray-300 hover:bg-gray-800"
        >
          <div className="flex items-center gap-3">
            <CurrencyDollarIcon className="w-5 h-5 flex-shrink-0 text-green-400" />
            <span>Finances</span>
          </div>
          {financesOpen ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
        </button>
        
        {financesOpen && (
          <div className="ml-4 space-y-1 border-l border-gray-700 pl-3">
            {financeItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  isActive(item.href)
                    ? 'bg-orange-500/80 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Séparateur */}
        <div className="my-2 border-t border-gray-800" />

        {/* Menu du bas */}
        {bottomItems.map((item) => (
          <MenuLink key={item.href} item={item} />
        ))}

        {/* Retour au site */}
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg transition text-gray-400 hover:bg-gray-800 hover:text-gray-200 mt-2"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
          <span>Retour au site</span>
        </Link>
      </nav>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-gray-900 text-white z-50">
            <div className="flex justify-between items-center p-4 border-b border-gray-800">
              <h1 className="text-lg font-bold">Kahonyn Admin</h1>
              <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-gray-800 rounded">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-gray-900 text-white">
          <SidebarContent />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="lg:pl-64">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-4 py-3 flex justify-between items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4 ml-auto">
              <span className="text-sm text-gray-600">
                {session.user?.name || (session.user as any)?.phone || 'Admin'}
              </span>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}