// components/SessionGuard.tsx
"use client"

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SparklesIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

interface SessionGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireRole?: string | string[]
  fallback?: React.ReactNode
}

export default function SessionGuard({ 
  children, 
  requireAuth = false, 
  requireRole,
  fallback 
}: SessionGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Attendre que la session soit chargée
    if (status === 'loading') return

    setIsReady(true)

    // Redirection si auth requise et non connecté
    if (requireAuth && status === 'unauthenticated') {
      const returnUrl = encodeURIComponent(pathname)
      router.push(`/?auth=login&returnUrl=${returnUrl}`)
      return
    }

    // Vérification du rôle si spécifié
    if (requireRole && session?.user?.role) {
      const roles = Array.isArray(requireRole) ? requireRole : [requireRole]
      if (!roles.includes(session.user.role)) {
        router.push('/')
        return
      }
    }
  }, [status, session, requireAuth, requireRole, router, pathname])

  // État de chargement
  if (status === 'loading' || !isReady) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
  <div className="flex flex-col items-center gap-4">
    <div className="relative">
      <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center p-2 animate-pulse border border-[#D4A855]/20">
        <Image
          src="/logo-kahonyn.png"
          alt="Kahonyn"
          width={48}
          height={48}
          className="object-contain"
          priority
        />
      </div>
      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FF6B35] animate-bounce"></div>
    </div>
    <p className="text-[#8B5A2B]/80 text-sm font-bold">Vérification de la session...</p>
  </div>
</div>
    )
  }

  // Si auth requise et non connecté, afficher fallback ou rien
  if (requireAuth && status === 'unauthenticated') {
    return fallback || null
  }

  // Si rôle requis et non autorisé
  if (requireRole && session?.user?.role) {
    const roles = Array.isArray(requireRole) ? requireRole : [requireRole]
    if (!roles.includes(session.user.role)) {
      return fallback || null
    }
  }

  return <>{children}</>
}