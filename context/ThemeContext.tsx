// context/ThemeContext.tsx
"use client"

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'
interface ThemeContextType { theme: Theme; setTheme: (theme: Theme) => void; resolvedTheme: 'dark' | 'light' }
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('kahonyn-theme') as Theme | null
    if (saved && ['dark', 'light', 'system'].includes(saved)) setTheme(saved)
  }, [])

  useEffect(() => {
    localStorage.setItem('kahonyn-theme', theme)
    const resolve = () => setResolvedTheme(theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme)
    resolve()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => { if (theme === 'system') setResolvedTheme(mq.matches ? 'dark' : 'light') }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}