"use client"

import Link from 'next/link'
import React from 'react'

type Tab = { id: string; label: string; icon: React.ElementType; href: string }

interface FooterProps {
  footerTabs: Tab[]
  activeFooterTab: string
  setActiveFooterTab: (id: string) => void
}

export default function Footer({ footerTabs, activeFooterTab, setActiveFooterTab }: FooterProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30">
      <div className="bg-gradient-to-r from-[#0D0D1A]/95 via-[#1A1A35]/95 to-[#0D0D1A]/95 backdrop-blur-2xl border-t border-white/[0.06] shadow-lg shadow-black/20">
        <div className="max-w-md mx-auto">
          <div className="flex justify-around items-center py-1.5 px-1">
            {footerTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeFooterTab === tab.id
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  onClick={() => setActiveFooterTab(tab.id)}
                  className={`relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'text-[#FF6B35]' 
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <div className={`p-1 rounded-lg transition-all duration-200 ${
                    isActive ? 'bg-[#FF6B35]/15' : ''
                  }`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-bold tracking-wide">
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