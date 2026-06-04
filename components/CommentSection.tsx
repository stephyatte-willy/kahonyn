"use client"

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { TrashIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string | null
    phone: string
    avatar: string | null
  }
}

interface CommentSectionProps {
  videoId: string
}

export default function CommentSection({ videoId }: CommentSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (videoId) fetchComments()
  }, [videoId])

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments/${videoId}`)
      const data = await res.json()
      setComments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erreur chargement commentaires:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) {
      toast.error('Connectez-vous pour commenter')
      return
    }
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/comments/${videoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() })
      })

      if (res.ok) {
        const comment = await res.json()
        setComments(prev => [comment, ...prev])
        setNewComment('')
        toast.success('Commentaire ajouté !')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('Supprimer ce commentaire ?')) return

    try {
      const res = await fetch('/api/comments/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId })
      })

      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId))
        toast.success('Commentaire supprimé')
      } else {
        toast.error('Erreur')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    }
  }

  const getInitial = (comment: Comment): string => {
    if (comment.user.name) return comment.user.name[0].toUpperCase()
    if (comment.user.phone) return comment.user.phone[0]
    return '?'
  }

  const getDisplayName = (comment: Comment): string => {
    if (comment.user.name) return comment.user.name
    if (comment.user.phone) return comment.user.phone.slice(-4)
    return 'Anonyme'
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `Il y a ${minutes}min`
    if (hours < 24) return `Il y a ${hours}h`
    if (days < 7) return `Il y a ${days}j`
    return date.toLocaleDateString('fr-FR')
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF6B35] mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
        💬 Commentaires ({comments.length})
      </h3>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={session ? 'Ajouter un commentaire...' : 'Connectez-vous pour commenter'}
            disabled={!session || submitting}
            maxLength={500}
            className="w-full px-4 py-2.5 bg-[#EDE4D8] border border-[#D4A855]/20 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#FF6B35] outline-none disabled:opacity-50 placeholder-gray-400"
          />
          <span className="absolute right-3 bottom-1 text-[10px] text-gray-400">
            {newComment.length}/500
          </span>
        </div>
        <button
          type="submit"
          disabled={!session || submitting || !newComment.trim()}
          className="px-4 py-2.5 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-[#FF8C5A] transition disabled:opacity-50"
        >
          {submitting ? (
            <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
          ) : (
            <PaperAirplaneIcon className="w-4 h-4" />
          )}
        </button>
      </form>

      {/* Liste */}
      {comments.length === 0 ? (
        <p className="text-center text-sm text-gray-500 py-6">
          Aucun commentaire. Soyez le premier à commenter !
        </p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 bg-[#EDE4D8] rounded-xl">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {getInitial(comment)}
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900">
                    {getDisplayName(comment)}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-0.5 break-words">
                  {comment.content}
                </p>
              </div>

              {/* Supprimer */}
              {(session && (comment.user.id === (session.user as any).id || (session.user as any).role === 'admin')) && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-gray-400 hover:text-red-500 transition flex-shrink-0 self-start"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}