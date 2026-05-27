"use client"

import Link from 'next/link'
import React from 'react'

type Tab = { id: string; label: string; icon: any; href: string }

interface FooterProps {
  footerTabs: Tab[]
  activeFooterTab: string
  setActiveFooterTab: (id: string) => void
}

export default function Footer({ footerTabs, activeFooterTab, setActiveFooterTab }: FooterProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-900 via-gray-700/30 to-gray-800 border-t border-gray-800 z-30 shadow-lg text-white">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around items-center py-1">
          {footerTabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all duration-300 ${
                activeFooterTab === tab.id
                  ? 'text-white bg-kahonyn-energie'
                  : 'text-gray-200 hover:text-white hover:bg-gray-700'
              }`}
              onClick={() => setActiveFooterTab(tab.id)}
            >
              <tab.icon className={`w-4 h-4 ${activeFooterTab === tab.id ? 'fill-kahonyn-energie' : ''}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {activeFooterTab === tab.id && <div className="w-1 h-1 bg-kahonyn-energie rounded-full mt-0.5"></div>}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
