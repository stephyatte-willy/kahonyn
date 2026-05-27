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
} from '@heroicons/react/24/outline'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!session || session.user?.role !== 'admin') {
      router.push('/')
    }
  }, [session, sessionStatus, router])

  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!session || session.user?.role !== 'admin') {
    return null
  }

  const menuItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
    { name: 'Utilisateurs', href: '/admin/users', icon: UserGroupIcon }, 
    { name: 'Vidéos en attente', href: '/admin/videos/pending', icon: ClockIcon },
    { name: 'Toutes les vidéos', href: '/admin/videos/all', icon: VideoCameraIcon }, 
    { name: 'Gains', href: '/admin/finances/earnings', icon: CurrencyDollarIcon },
    { name: 'Retraits', href: '/admin/finances/withdrawals', icon: CurrencyDollarIcon },
    { name: 'Créateurs', href: '/admin/creators', icon: UserGroupIcon },
    { name: 'Paramètres', href: '/admin/settings', icon: Cog6ToothIcon },
  ]

  const isActive = (href: string) => router.pathname === href

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed left-0 top-0 bottom-0 w-64 bg-gray-900 text-white p-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-xl font-bold">Kahonyn Admin</h1>
            <button onClick={() => setSidebarOpen(false)} className="p-1">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  isActive(item.href)
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-gray-900 text-white">
          <div className="p-4 border-b border-gray-800">
            <h1 className="text-xl font-bold">Kahonyn Admin</h1>
            <p className="text-xs text-gray-400 mt-1">Tableau de bord</p>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  isActive(item.href)
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
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
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {session.user?.email || session.user?.phone}
              </span>
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-orange-500"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                Retour au site
              </button>
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