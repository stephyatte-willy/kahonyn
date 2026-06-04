"use client"

import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline'
import { useState, useRef, useEffect } from 'react'

interface ThemeSwitcherProps { theme?: string; setTheme?: (theme: string) => void }

export default function ThemeSwitcher({ theme = 'dark', setTheme }: ThemeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false) }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const themes = [
    { id: 'light', label: 'Clair', icon: SunIcon },
    { id: 'dark', label: 'Sombre', icon: MoonIcon },
    { id: 'system', label: 'Système', icon: ComputerDesktopIcon },
  ]

  const CurrentIcon = themes.find(t => t.id === theme)?.icon || SunIcon

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition text-white/70 hover:text-white border border-white/[0.06]">
        <CurrentIcon className="w-4 h-4" />
        <span className="text-xs hidden sm:inline font-medium">{themes.find(t => t.id === theme)?.label || 'Thème'}</span>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-[#1A1A2E] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-50">
          {themes.map((t) => {
            const Icon = t.icon; const isActive = theme === t.id
            return (
              <button key={t.id} onClick={() => { setTheme?.(t.id); setIsOpen(false) }} className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-[#FF6B35] text-white' : 'text-white/60 hover:bg-white/[0.04] hover:text-white'}`}>
                <Icon className="w-4 h-4" /><span>{t.label}</span>{isActive && <span className="ml-auto">✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}