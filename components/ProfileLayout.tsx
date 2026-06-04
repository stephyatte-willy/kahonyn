// components/ProfileLayout.tsx
"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import { HomeIcon, UserGroupIcon, BookmarkIcon, TrophyIcon, UserCircleIcon, ShieldCheckIcon, VideoCameraIcon, ChartBarIcon, CurrencyDollarIcon, Cog6ToothIcon, ArrowUpTrayIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline'

interface FooterTab { id: string; label: string; icon: React.ElementType; href: string; requiresAuth?: boolean; adminOnly?: boolean; creatorOnly?: boolean }
interface ProfileLayoutProps { children: React.ReactNode; title?: string; subtitle?: string; activeTab?: string }

export default function ProfileLayout({ children, title, subtitle, activeTab = 'profile' }: ProfileLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeFooterTab, setActiveFooterTab] = useState(activeTab)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const path = router.pathname
    const tabMap: Record<string, string> = { '/': 'home', '/for-you': 'for-you', '/my-list': 'my-list', '/premium': 'premium', '/profile': 'profile', '/dashboard': 'dashboard', '/creator/upload': 'upload', '/creator/videos': 'videos', '/creator/earnings': 'earnings', '/creator/stats': 'stats', '/creator/settings': 'settings' }
    const match = Object.entries(tabMap).find(([p]) => path === p)
    if (match) setActiveFooterTab(match[1])
    else if (path.includes('/admin')) setActiveFooterTab('admin')
  }, [router.pathname])

  const userRole = session?.user?.role as string | undefined
  const isAuth = status === 'authenticated'

  const getFooterTabs = (): FooterTab[] => {
    const tabs: FooterTab[] = [{ id: 'home', label: 'Accueil', icon: HomeIcon, href: '/' }]
    if (userRole === 'admin') tabs.push({ id: 'dashboard', label: 'Admin', icon: ShieldCheckIcon, href: '/admin/dashboard', adminOnly: true }, { id: 'premium', label: 'Primes', icon: TrophyIcon, href: '/premium' }, { id: 'profile', label: 'Profil', icon: UserCircleIcon, href: '/profile', requiresAuth: true })
    else if (userRole === 'creator') tabs.push({ id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon, href: '/dashboard', requiresAuth: true }, { id: 'upload', label: 'Upload', icon: ArrowUpTrayIcon, href: '/creator/upload', requiresAuth: true }, { id: 'videos', label: 'Vidéos', icon: VideoCameraIcon, href: '/creator/videos', requiresAuth: true }, { id: 'earnings', label: 'Gains', icon: CurrencyDollarIcon, href: '/creator/earnings', requiresAuth: true }, { id: 'stats', label: 'Stats', icon: ArrowTrendingUpIcon, href: '/creator/stats', requiresAuth: true }, { id: 'settings', label: 'Réglages', icon: Cog6ToothIcon, href: '/creator/settings', requiresAuth: true }, { id: 'profile', label: 'Profil', icon: UserCircleIcon, href: '/profile', requiresAuth: true })
    else tabs.push({ id: 'for-you', label: 'Pour vous', icon: UserGroupIcon, href: '/for-you' }, { id: 'my-list', label: 'Ma liste', icon: BookmarkIcon, href: '/my-list', requiresAuth: true }, { id: 'premium', label: 'Primes', icon: TrophyIcon, href: '/premium' }, { id: 'profile', label: 'Profil', icon: UserCircleIcon, href: '/profile', requiresAuth: true })
    return tabs
  }

  const footerTabs = getFooterTabs()
  const hideCategories = ['/dashboard', '/creator/upload', '/creator/videos', '/creator/earnings', '/creator/stats', '/creator/settings', '/profile', '/admin/dashboard'].some(path => router.pathname.startsWith(path))

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-16">
      <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} hideCategories={hideCategories} />
      {(title || subtitle) && (
        <div className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-xl sm:text-2xl font-bold">{title || 'Profil'}</h1>
            {subtitle && <p className="text-white/80 text-sm font-bold mt-1">{subtitle}</p>}
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">{children}</div>
      <Footer footerTabs={footerTabs} activeFooterTab={activeFooterTab} setActiveFooterTab={setActiveFooterTab} />
    </div>
  )
}