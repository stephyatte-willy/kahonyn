// components/Footer.tsx - CORRIGÉ
"use client"

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import React from 'react'

interface FooterTab {
  id: string
  label: string
  icon: React.ElementType
  href: string
  requiresAuth?: boolean
  adminOnly?: boolean
  creatorOnly?: boolean
}

interface FooterProps {
  footerTabs: FooterTab[]
  activeFooterTab: string
  setActiveFooterTab: (id: string) => void
}

export default function Footer({ footerTabs, activeFooterTab, setActiveFooterTab }: FooterProps) {
  const { data: session, status } = useSession()
  const isCreator = footerTabs.length > 5
  const userRole = session?.user?.role as string | undefined

  // Filtrer les onglets selon le rôle et l'authentification
  const filteredTabs = footerTabs.filter((tab: FooterTab) => {
    // Si l'onglet nécessite d'être connecté
    if (tab.requiresAuth && status !== 'authenticated') {
      return false
    }
    // Si l'onglet est réservé aux admins
    if (tab.adminOnly && userRole !== 'admin') {
      return false
    }
    // Si l'onglet est réservé aux créateurs
    if (tab.creatorOnly && userRole !== 'creator' && userRole !== 'admin') {
      return false
    }
    return true
  })

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30">
      <div className="bg-gradient-to-r from-[#0D0D1A]/95 via-[#1A1A35]/95 to-[#0D0D1A]/95 backdrop-blur-2xl border-t border-white/[0.06] shadow-lg shadow-black/20">
        <div className="max-w-lg mx-auto">
          <div className={`flex ${isCreator ? 'justify-start overflow-x-auto scrollbar-hide' : 'justify-around'} items-center py-1.5 px-1 gap-0.5`}>
            {filteredTabs.map((tab: FooterTab) => {
              const Icon = tab.icon
              const isActive = activeFooterTab === tab.id
              return (
                <Link
                  key={tab.id}
                  href={status === 'authenticated' || !tab.requiresAuth ? tab.href : '#'}
                  onClick={(e) => {
                    if (tab.requiresAuth && status !== 'authenticated') {
                      e.preventDefault()
                      return
                    }
                    setActiveFooterTab(tab.id)
                  }}
                  className={`relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200 flex-shrink-0 min-w-[48px] ${
                    isActive 
                      ? 'text-[#FF6B35] bg-[#FF6B35]/10' 
                      : 'text-white/60 hover:text-white/90 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className={`p-1 rounded-lg transition-all duration-200 ${
                    isActive ? 'bg-[#FF6B35]/15' : ''
                  }`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className={`text-[9px] sm:text-[10px] font-bold tracking-wide ${
                    isActive ? 'text-[#FF6B35]' : 'text-white/70'
                  }`}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-1 h-1 bg-[#FF6B35] rounded-full shadow-lg shadow-[#FF6B35]/30"></div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </footer>
  )
}