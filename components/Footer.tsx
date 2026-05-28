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
      <div className="bg-gradient-to-r from-[#0D0D1A]/95 via-[#1A1A35]/95 to-[#0D0D1A]/95 backdrop-blur-2xl border-t border-white/[0.06]">
        <div className="max-w-md mx-auto">
          <div className="flex justify-around items-center py-3 px-2">
            {footerTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeFooterTab === tab.id
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  onClick={() => setActiveFooterTab(tab.id)}
                  className={`relative flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl transition-all duration-300 group ${
                    isActive ? 'text-[#FF6B35]' : 'text-[#D4A855]/50 hover:text-[#D4A855]'
                  }`}
                >
                  {isActive && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#FF6B35] rounded-full shadow-lg shadow-[#FF6B35]/50"></div>
                  )}
                  <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                    isActive ? 'bg-[#FF6B35]/10' : 'group-hover:bg-white/[0.04]'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </footer>
  )
}