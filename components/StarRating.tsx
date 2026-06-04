"use client"

import { useState, useEffect } from 'react'
import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

interface StarRatingProps {
  videoId: string
}

export default function StarRating({ videoId }: StarRatingProps) {
  const { data: session } = useSession()
  const [average, setAverage] = useState(0)
  const [count, setCount] = useState(0)
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (videoId) fetchRating()
  }, [videoId])

  const fetchRating = async () => {
    try {
      const res = await fetch(`/api/ratings/${videoId}`)
      const data = await res.json()
      setAverage(data.average || 0)
      setCount(data.count || 0)
      setUserRating(data.userRating || 0)
    } catch (error) {
      console.error('Erreur chargement note:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRate = async (value: number) => {
    if (!session) {
      toast.error('Connectez-vous pour noter')
      return
    }

    try {
      const res = await fetch(`/api/ratings/${videoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      })

      if (res.ok) {
        const data = await res.json()
        setAverage(data.average)
        setCount(data.count)
        setUserRating(data.userRating)
        toast.success(value === userRating ? 'Note retirée' : `Noté ${value}/5 !`)
      }
    } catch (error) {
      toast.error('Erreur réseau')
    }
  }

  if (loading) return null

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= (hoverRating || userRating || average)
          return (
            <button
              key={star}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5 transition-transform hover:scale-110"
              title={`${star} étoile${star > 1 ? 's' : ''}`}
            >
              {isFilled ? (
                <StarIcon className={`w-5 h-5 ${
                  (hoverRating || userRating) ? 'text-yellow-400' : 'text-yellow-500'
                }`} />
              ) : (
                <StarOutlineIcon className="w-5 h-5 text-gray-400 hover:text-yellow-400" />
              )}
            </button>
          )
        })}
      </div>
      <span className="text-sm font-bold text-gray-700">
        {average > 0 ? average.toFixed(1) : '-'}
      </span>
      {count > 0 && (
        <span className="text-xs text-gray-500">
          ({count} vote{count > 1 ? 's' : ''})
        </span>
      )}
      {userRating > 0 && (
        <span className="text-[10px] text-[#FF6B35] font-bold bg-[#FF6B35]/10 px-2 py-0.5 rounded-full">
          Ta note : {userRating}/5
        </span>
      )}
    </div>
  )
}