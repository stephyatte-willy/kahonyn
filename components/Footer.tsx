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
    if (tab.requiresAuth && status !== 'authenticated') return false
    if (tab.adminOnly && userRole !== 'admin') return false
    if (tab.creatorOnly && userRole !== 'creator' && userRole !== 'admin') return false
    return true
  })

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30">
      <div className="bg-gradient-to-r from-[#0D0D1A]/95 via-[#1A1A35]/95 to-[#0D0D1A]/95 backdrop-blur-2xl border-t border-white/[0.06] shadow-lg shadow-black/20">
        <div className="max-w-lg mx-auto">
          <div className={`flex ${isCreator ? 'justify-start overflow-x-auto scrollbar-hide' : 'justify-around'} items-center py-1.5 px-1 gap-0`}>
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
                  className={`relative flex flex-col items-center gap-0 px-1.5 py-1 rounded-lg transition-all duration-200 flex-shrink-0 ${
                    isActive 
                      ? 'text-[#FF6B35]' 
                      : 'text-white/100 hover:text-white/60'
                  }`}
                >
                  <div className={`rounded-md transition-all duration-200 ${
                    isActive ? 'bg-[#FF6B35]/10' : ''
                  }`}>
                    <Icon className={`${isActive ? 'w-[18px] h-[18px]' : 'w-[18px] h-[18px]'} sm:w-[22px] sm:h-[22px]`} />
                  </div>
                  <span className={`text-[8px] sm:text-[9px] font-bold tracking-wide leading-none ${
                    isActive ? 'text-[#FF6B35]' : 'text-white/100'
                  }`}>
                    {tab.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </footer>
  )
}