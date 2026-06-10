// utils/cache.ts
interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

const cache = new Map<string, CacheItem<any>>()

export async function cachedFetch<T>(
  url: string,
  ttlSeconds: number = 60, // 1 minute par défaut
  options?: RequestInit
): Promise<T> {
  const key = `${url}-${JSON.stringify(options)}`
  const cached = cache.get(key)
  
  if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
    return cached.data
  }
  
  const res = await fetch(url, options)
  const data = await res.json()
  
  cache.set(key, { data, timestamp: Date.now(), ttl: ttlSeconds })
  
  // Nettoyer le cache si trop volumineux
  if (cache.size > 100) {
    const now = Date.now()
    for (const [k, item] of cache.entries()) {
      if (now - item.timestamp > item.ttl * 1000) {
        cache.delete(k)
      }
    }
  }
  
  return data
}

// Utilisation dans vos pages
// const categories = await cachedFetch('/api/public/categories', 300) // 5 minutes