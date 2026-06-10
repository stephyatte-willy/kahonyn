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

  const filteredTabs = footerTabs.filter((tab: FooterTab) => {
    if (tab.requiresAuth && status !== 'authenticated') return false
    if (tab.adminOnly && userRole !== 'admin') return false
    if (tab.creatorOnly && userRole !== 'creator' && userRole !== 'admin') return false
    return true
  })

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30">
      <div className="bg-[#402000]/98 backdrop-blur-2xl border-t border-white/[0.06] shadow-2xl shadow-black/50">
        <div className="max-w-lg mx-auto">
          <div className={`flex ${isCreator ? 'justify-start overflow-x-auto scrollbar-hide' : 'justify-around'} items-center py-2 px-1 gap-0.5`}>
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
                  className={`relative flex flex-col items-center gap-1 px-2 py-1.5  ${
                    isActive 
                      ? 'text-[#FF6B35]' 
                      : 'text-white/60 hover:text-white/90'
                  }`}
                >
                  <div className={`p-1 rounded-lg transition-all duration-200 ${
                    isActive ? 'bg-[#FF6B35]/15' : ''
                  }`}>
                    <Icon className="w-[22px] h-[22px] sm:w-[24px] sm:h-[24px]" />
                  </div>
                  <span className={`text-[10px] sm:text-[11px] font-semibold tracking-wide ${
                    isActive ? 'text-[#FF6B35]' : 'text-white/80'
                  }`}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-[#FF6B35] rounded-full shadow-lg shadow-[#FF6B35]/30"></div>
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