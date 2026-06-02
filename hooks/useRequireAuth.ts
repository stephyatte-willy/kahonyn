// hooks/useRequireAuth.ts
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export function useRequireAuth(redirectTo: string = '/') {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      toast.error('🔒 Veuillez vous connecter pour accéder à cette page', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#1A1A35',
          color: '#FFF',
          borderRadius: '16px',
          border: '1px solid rgba(255,107,53,0.3)',
          fontWeight: 'bold',
        },
      })
      
      // Rediriger après un court délai pour que le toast soit visible
      setTimeout(() => {
        router.push(`/?auth=login&returnUrl=${encodeURIComponent(router.asPath)}`)
      }, 1500)
      
      setIsAuthorized(false)
    } else {
      setIsAuthorized(true)
    }
  }, [status, router, redirectTo])

  return {
    session,
    status,
    isAuthorized,
    isLoading: status === 'loading',
  }
}