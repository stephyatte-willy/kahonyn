// components/SessionGuard.tsx
"use client"

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'

interface SessionGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireRole?: string | string[]
  fallback?: React.ReactNode
}

export default function SessionGuard({ children, requireAuth = false, requireRole, fallback }: SessionGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    setIsReady(true)
    if (requireAuth && status === 'unauthenticated') { router.push(`/?auth=login&returnUrl=${encodeURIComponent(pathname)}`); return }
    if (requireRole && session?.user?.role) { const roles = Array.isArray(requireRole) ? requireRole : [requireRole]; if (!roles.includes(session.user.role)) { router.push('/'); return } }
  }, [status, session, requireAuth, requireRole, router, pathname])

  if (status === 'loading' || !isReady) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center p-2 animate-pulse border border-white/[0.06]">
              <Image src="/logo-kahonyn.png" alt="Kahonyn" width={48} height={48} className="object-contain" priority />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FF6B35] animate-bounce"></div>
          </div>
          <p className="text-white/60 text-sm font-semibold">Vérification de la session...</p>
        </div>
      </div>
    )
  }

  if (requireAuth && status === 'unauthenticated') return fallback || null
  if (requireRole && session?.user?.role) { const roles = Array.isArray(requireRole) ? requireRole : [requireRole]; if (!roles.includes(session.user.role)) return fallback || null }

  return <>{children}</>
}