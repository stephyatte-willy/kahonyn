// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Stockage simple en mémoire (pour 1000 requêtes)
const rateLimit = new Map<string, number[]>()

export function middleware(request: NextRequest) {
  // Ne rate-limit que les API sensibles
  const sensitivePaths = [
    '/api/auth/register',
    '/api/auth/login',
    '/api/payment/',
    '/api/comments',
    '/api/ratings'
  ]
  
  const shouldLimit = sensitivePaths.some(path => request.nextUrl.pathname.startsWith(path))
  if (!shouldLimit) return NextResponse.next()
  
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'anonymous'
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = 30 // 30 requêtes/minute
  
  const requests = rateLimit.get(ip) || []
  const recent = requests.filter(time => now - time < windowMs)
  
  if (recent.length >= maxRequests) {
    return new NextResponse(
      JSON.stringify({ error: 'Trop de requêtes. Réessayez dans une minute.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    )
  }
  
  recent.push(now)
  rateLimit.set(ip, recent)
  
  // Nettoyage périodique
  if (rateLimit.size > 1000) {
    for (const [key, times] of rateLimit.entries()) {
      if (times.length === 0 || now - times[times.length - 1] > windowMs * 2) {
        rateLimit.delete(key)
      }
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}