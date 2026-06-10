// components/VideoPlayer.tsx
"use client"

import { useState, useRef, useEffect } from 'react'

interface VideoPlayerProps {
  src: string
  poster?: string
  onEnded?: () => void
  onProgress?: (progress: number) => void
  autoPlay?: boolean
}

export default function VideoPlayer({ src, poster, onEnded, onProgress, autoPlay = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quality, setQuality] = useState<'auto' | 'low' | 'medium' | 'high'>('auto')

  // Adaptation automatique de la qualité selon la connexion
  useEffect(() => {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection
      if (conn) {
        const type = conn.effectiveType // '4g', '3g', '2g', 'slow-2g'
        if (type === 'slow-2g' || type === '2g') setQuality('low')
        else if (type === '3g') setQuality('medium')
        else setQuality('high')
      }
    }
  }, [])

  // Générer l'URL avec qualité adaptée (pour Cloudinary)
  const getOptimizedUrl = () => {
    if (!src.includes('cloudinary')) return src
    
    const qualityMap = { low: 'q_30', medium: 'q_60', high: 'q_80' }
    const qParam = qualityMap[quality]
    
    // Exemple: https://res.cloudinary.com/.../video/upload/v123/video.mp4
    // Devient: https://res.cloudinary.com/.../video/upload/q_30/v123/video.mp4
    return src.replace('/upload/', `/upload/${qParam}/`)
  }

  const handleError = () => {
    setError('Erreur de lecture. Vérifiez votre connexion.')
    setIsLoading(false)
  }

  const handleCanPlay = () => {
    setIsLoading(false)
    setError(null)
  }

  const handleTimeUpdate = () => {
    if (videoRef.current && onProgress) {
      const progress = videoRef.current.currentTime
      onProgress(progress)
    }
  }

  return (
    <div className="relative w-full bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-white text-sm">Chargement...</span>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
          <p className="text-red-400 text-sm mb-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#FF6B35] rounded-lg text-white text-sm"
          >
            Réessayer
          </button>
        </div>
      )}
      
      <video
        ref={videoRef}
        src={getOptimizedUrl()}
        poster={poster}
        controls
        autoPlay={autoPlay}
        className="w-full h-auto max-h-[80vh]"
        onEnded={onEnded}
        onTimeUpdate={handleTimeUpdate}
        onError={handleError}
        onCanPlay={handleCanPlay}
        playsInline
        preload="metadata"
      />
      
      {/* Indicateur de qualité */}
      {quality !== 'auto' && !isLoading && (
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded">
          {quality === 'low' ? '📶 Économie de données' : quality === 'medium' ? '📶 Standard' : '📶 HD'}
        </div>
      )}
    </div>
  )
}