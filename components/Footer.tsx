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
    <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-kahonyn-sable/30 z-30 shadow-lg">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around items-center py-2">
          {footerTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeFooterTab === tab.id
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'text-kahonyn-energie bg-kahonyn-lumiere'
                    : 'text-gray-500 hover:text-kahonyn-energie hover:bg-kahonyn-lumiere'
                }`}
                onClick={() => setActiveFooterTab(tab.id)}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'fill-kahonyn-energie' : ''}`} />
                <span className="text-[10px] font-medium">{tab.label}</span>
                {isActive && <div className="w-1 h-1 bg-kahonyn-energie rounded-full mt-0.5"></div>}
              </Link>
            )
          })}
        </div>
      </div>
    </footer>
  )
}