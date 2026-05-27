"use client"

import { useTheme } from '../context/ThemeContext'
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline'
import { useState, useRef, useEffect } from 'react'

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const themes = [
    { id: 'light', label: 'Clair', icon: SunIcon },
    { id: 'dark', label: 'Sombre', icon: MoonIcon },
    { id: 'system', label: 'Système', icon: ComputerDesktopIcon },
  ]

  const getCurrentIcon = () => {
    const current = themes.find(t => t.id === theme)
    if (current) {
      const Icon = current.icon
      return <Icon className="w-5 h-5" />
    }
    return <SunIcon className="w-5 h-5" />
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition text-gray-300 hover:text-white"
      >
        {getCurrentIcon()}
        <span className="text-sm hidden sm:inline">
          {themes.find(t => t.id === theme)?.label || 'Thème'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50 animate-fadeIn">
          {themes.map((t) => {
            const Icon = t.icon
            const isActive = theme === t.id
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id as 'light' | 'dark' | 'system')
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
                {isActive && <span className="ml-auto">✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}