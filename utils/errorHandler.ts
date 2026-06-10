// utils/errorHandler.ts
import toast from 'react-hot-toast'

export type ErrorType = 'network' | 'auth' | 'payment' | 'notFound' | 'server' | 'validation'

export const errorMessages: Record<ErrorType, string> = {
  network: '📡 Problème de connexion. Vérifiez votre réseau.',
  auth: '🔒 Veuillez vous reconnecter.',
  payment: '💳 Erreur de paiement. Réessayez.',
  notFound: '📺 Contenu introuvable.',
  server: '⚠️ Erreur serveur. Réessayez plus tard.',
  validation: '📝 Vérifiez les informations saisies.'
}

// Fonction principale de gestion d'erreur
export function handleError(error: any, context?: string): string {
  console.error(`[${context || 'Error'}]:`, error)
  
  // Erreurs réseau (fetch failed)
  if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
    toast.error(errorMessages.network)
    return errorMessages.network
  }
  
  // Erreurs avec statut HTTP
  if (error?.status === 401 || error?.status === 403) {
    toast.error(errorMessages.auth)
    return errorMessages.auth
  }
  
  if (error?.status === 404) {
    toast.error(errorMessages.notFound)
    return errorMessages.notFound
  }
  
  if (error?.status === 429) {
    toast.error('⏳ Trop de requêtes. Attendez un moment.')
    return 'Trop de requêtes'
  }
  
  if (error?.status === 422) {
    toast.error(errorMessages.validation)
    return errorMessages.validation
  }
  
  if (error?.status === 500 || error?.status === 502 || error?.status === 503) {
    toast.error(errorMessages.server)
    return errorMessages.server
  }
  
  // Message d'erreur par défaut
  const defaultMsg = error?.message || error?.error || 'Une erreur est survenue'
  toast.error(defaultMsg)
  return defaultMsg
}

// Wrapper pour fetch avec gestion d'erreur automatique
export async function safeFetch<T>(
  url: string, 
  options?: RequestInit,
  errorContext?: string
): Promise<T | null> {
  try {
    const res = await fetch(url, options)
    
    if (!res.ok) {
      const error = new Error(`HTTP ${res.status}`)
      ;(error as any).status = res.status
      throw error
    }
    
    return await res.json()
  } catch (error) {
    handleError(error, errorContext)
    return null
  }
}

// Version qui ne toast pas (pour les appels silencieux / background)
export async function silentFetch<T>(
  url: string, 
  options?: RequestInit
): Promise<T | null> {
  try {
    const res = await fetch(url, options)
    if (!res.ok) return null
    return await res.json()
  } catch (error) {
    console.error('[silentFetch]', error)
    return null
  }
}

// Version avec gestion d'erreur personnalisée (callback)
export async function fetchWithHandler<T>(
  url: string,
  onError?: (error: any) => void,
  options?: RequestInit
): Promise<T | null> {
  try {
    const res = await fetch(url, options)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (error) {
    if (onError) {
      onError(error)
    } else {
      handleError(error)
    }
    return null
  }
}