// hooks/useAuth.ts
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useCallback } from 'react'

export function useAuth() {
  const { data: session, status, update } = useSession()
  const router = useRouter()

  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated'
  const user = session?.user
  const role = user?.role

  const isAdmin = role === 'admin'
  const isCreator = role === 'creator'
  const isClient = role === 'client' || (!isAdmin && !isCreator)

  const requireAuth = useCallback((redirectTo?: string) => {
    if (!isAuthenticated && !isLoading) {
      const returnUrl = redirectTo || router.asPath
      router.push(`/?auth=login&returnUrl=${encodeURIComponent(returnUrl)}`)
      return false
    }
    return true
  }, [isAuthenticated, isLoading, router])

  const requireRole = useCallback((requiredRole: string | string[], redirectTo?: string) => {
    if (!requireAuth(redirectTo)) return false
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!roles.includes(role as string)) {
      router.push(redirectTo || '/')
      return false
    }
    return true
  }, [requireAuth, role, router])

  return {
    session,
    status,
    isLoading,
    isAuthenticated,
    user,
    role,
    isAdmin,
    isCreator,
    isClient,
    requireAuth,
    requireRole,
    update,
  }
}