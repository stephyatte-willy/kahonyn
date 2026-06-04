"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { 
  PlayIcon, 
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  Cog6ToothIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface VideoPlayerProps {
  src: string
  title?: string
  subtitle?: string
  onClose: () => void
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
  onTimeUpdate?: (currentTime: number) => void
  initialTime?: number
}

export default function VideoPlayer({ 
  src, 
  title, 
  subtitle, 
  onClose,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  onTimeUpdate,
  initialTime = 0
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const [selectedQuality, setSelectedQuality] = useState('auto')
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null)

  // Qualités disponibles
  const qualities = [
    { label: 'Auto', value: 'auto' },
    { label: '1080p', value: '1080p' },
    { label: '720p', value: '720p' },
    { label: '480p', value: '480p' },
    { label: '360p', value: '360p' },
  ]

  // Reprendre à la position sauvegardée
  useEffect(() => {
    if (videoRef.current && initialTime > 0) {
      videoRef.current.currentTime = initialTime
    }
  }, [initialTime])

  // Masquer les contrôles après 3 secondes
  useEffect(() => {
    if (showControls) {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
      controlsTimeout.current = setTimeout(() => setShowControls(false), 3000)
    }
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
    }
  }, [showControls])

  // Mettre à jour le temps
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      onTimeUpdate?.(video.currentTime)
    }
    const handleLoadedMetadata = () => setDuration(video.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [onTimeUpdate])

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlayPause()
          break
        case 'ArrowLeft':
          e.preventDefault()
          skip(-10)
          break
        case 'ArrowRight':
          e.preventDefault()
          skip(10)
          break
        case 'ArrowUp':
          e.preventDefault()
          adjustVolume(0.1)
          break
        case 'ArrowDown':
          e.preventDefault()
          adjustVolume(-0.1)
          break
        case 'm':
          toggleMute()
          break
        case 'f':
          toggleFullscreen()
          break
        case 'Escape':
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }
    setShowControls(true)
  }

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, videoRef.current.duration))
    }
    setShowControls(true)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume || 1
        setIsMuted(false)
      } else {
        videoRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }

  const adjustVolume = (delta: number) => {
    const newVolume = Math.max(0, Math.min(1, volume + delta))
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const handleQualityChange = (quality: string) => {
    setSelectedQuality(quality)
    setShowQualityMenu(false)
    
    if (quality === 'auto') {
      toast.success('Qualité : Auto (adaptative)')
    } else {
      toast.success(`Qualité : ${quality}`)
    }
    // Note : La vraie gestion de qualité nécessite des URLs HLS/MPEG-DASH
  }

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        videoRef.current.requestFullscreen()
      }
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercent = () => {
    if (!duration) return 0
    return (currentTime / duration) * 100
  }

  return (
    <div className="fixed inset-0 bg-black z-50" onClick={() => setShowControls(!showControls)}>
      <video
        ref={videoRef}
        src={src}
        autoPlay
        className="absolute inset-0 w-full h-full object-contain"
        playsInline
        onClick={(e) => {
          e.stopPropagation()
          togglePlayPause()
        }}
      />

      {/* Indicateur de volume */}
      {showVolumeSlider && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 rounded-xl p-4 z-30 flex items-center gap-3">
          <button onClick={toggleMute} className="text-white">
            {isMuted || volume === 0 ? (
              <SpeakerXMarkIcon className="w-6 h-6" />
            ) : (
              <SpeakerWaveIcon className="w-6 h-6" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#FF6B35]"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="text-white text-xs font-bold w-8">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>
      )}

      {/* Overlay contrôles */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`} onClick={(e) => e.stopPropagation()}>
        
        {/* Bouton retour */}
        <button onClick={onClose} className="absolute top-4 left-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition z-10">
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Titre */}
        <div className="absolute top-4 left-16 right-16 text-white">
          {title && <h2 className="font-semibold text-sm truncate">{title}</h2>}
          {subtitle && <p className="text-xs text-gray-300">{subtitle}</p>}
        </div>

        {/* Bouton qualité */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowQualityMenu(!showQualityMenu)
            }}
            className="text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </button>

          {/* Menu qualité */}
          {showQualityMenu && (
            <div className="absolute right-0 top-12 bg-[#1A1A35] rounded-xl shadow-2xl border border-white/10 overflow-hidden z-20 min-w-[120px]">
              {qualities.map((q) => (
                <button
                  key={q.value}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleQualityChange(q.value)
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold transition ${
                    selectedQuality === q.value
                      ? 'bg-[#FF6B35] text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {q.label}
                  {selectedQuality === q.value && <CheckCircleIcon className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation épisodes (si série) */}
        {onPrevious && onNext && (
          <div className="absolute inset-0 flex items-center justify-center gap-6 pointer-events-none">
            <button
              onClick={(e) => { e.stopPropagation(); onPrevious() }}
              disabled={!hasPrevious}
              className={`pointer-events-auto text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition ${!hasPrevious ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <span className="text-2xl">⏮</span>
            </button>
            
            <button
              onClick={(e) => { e.stopPropagation(); togglePlayPause() }}
              className="pointer-events-auto text-white bg-black/50 rounded-full p-4 hover:bg-black/70 transition transform hover:scale-110"
            >
              {isPlaying ? <PauseIcon className="w-10 h-10" /> : <PlayIcon className="w-10 h-10" />}
            </button>
            
            <button
              onClick={(e) => { e.stopPropagation(); onNext() }}
              disabled={!hasNext}
              className={`pointer-events-auto text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition ${!hasNext ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <span className="text-2xl">⏭</span>
            </button>
          </div>
        )}

        {/* Barre de progression */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Indicateur de preview sur la barre */}
          <div className="relative h-1 bg-gray-600 rounded-full mb-3 cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation()
              const rect = e.currentTarget.getBoundingClientRect()
              const percent = (e.clientX - rect.left) / rect.width
              if (videoRef.current) {
                videoRef.current.currentTime = percent * duration
              }
            }}
          >
            <div className="absolute h-full bg-[#FF6B35] rounded-full" style={{ width: `${getProgressPercent()}%` }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#FF6B35] rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition"
              style={{ left: `calc(${getProgressPercent()}% - 6px)` }} />
          </div>

          <div className="flex items-center gap-3">
            {/* Temps */}
            <span className="text-white text-xs w-10 text-right">{formatTime(currentTime)}</span>
            
            {/* Barre de progression (alternative) */}
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#FF6B35]"
              onClick={(e) => e.stopPropagation()}
            />
            
            <span className="text-white text-xs w-10">{formatTime(duration)}</span>

            {/* Volume */}
            <div className="relative flex items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleMute()
                  setShowVolumeSlider(!showVolumeSlider)
                }}
                className="text-white hover:text-[#FF6B35] transition p-1"
              >
                {isMuted || volume === 0 ? (
                  <SpeakerXMarkIcon className="w-5 h-5" />
                ) : volume < 0.5 ? (
                  <SpeakerWaveIcon className="w-5 h-5 opacity-70" />
                ) : (
                  <SpeakerWaveIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Raccourcis clavier info */}
      <div className="absolute bottom-20 left-4 text-white/40 text-[10px] hidden lg:block">
        Espace: Play/Pause • ← → : -10s/+10s • ↑ ↓ : Volume • M: Muet • F: Plein écran
      </div>
    </div>
  )
}