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
    <footer className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur-xl border-t border-gray-800 z-30 shadow-2xl">
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
                    ? 'text-amber-400 bg-gradient-to-br from-amber-500/10 to-orange-500/10'
                    : 'text-gray-500 hover:text-amber-400 hover:bg-gray-800/50'
                }`}
                onClick={() => setActiveFooterTab(tab.id)}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-glow' : ''}`} />
                <span className="text-[10px] font-medium">{tab.label}</span>
                {isActive && (
                  <div className="w-1 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mt-0.5"></div>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        .drop-shadow-glow {
          filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.5));
        }
      `}</style>
    </footer>
  )
}