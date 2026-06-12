"use client"

import { useState, useEffect, useRef } from 'react'
import { BellIcon } from '@heroicons/react/24/outline'
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import { getSession } from 'next-auth/react'

interface Notification {
  id: string
  type: string
  message: string
  isRead: boolean
  createdAt: string
  videoId: string | null
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // 🆕 Fermer la dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    // 🆕 Fermer avec la touche Escape
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const fetchNotifications = async () => {
  // ✅ Ajouter cette vérification
  const session = await getSession()
  if (!session) return
  
  try {
    const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Erreur notifications:', error)
    }
  }

  const markAsRead = async (id?: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      fetchNotifications()
      if (!id) setIsOpen(false)
    } catch (error) {}
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

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="relative p-2 hover:bg-white/10 rounded-full transition"
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="w-6 h-6 text-[#FF6B35]" />
        ) : (
          <BellIcon className="w-6 h-6 text-white" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-12 w-80 bg-[#1A1A35] rounded-2xl shadow-2xl border border-white/10 z-50 overflow-hidden"
        >
          <div className="p-3 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-white font-bold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  markAsRead()
                }}
                className="text-xs text-[#FF6B35] hover:underline font-bold"
              >
                Tout lire
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">
                Aucune notification
              </p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    markAsRead(notif.id)
                  }}
                  className={`p-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition ${
                    !notif.isRead ? 'bg-[#FF6B35]/5' : ''
                  }`}
                >
                  <p className="text-white text-xs font-medium">{notif.message}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{formatDate(notif.createdAt)}</p>
                </div>
              ))
            )}
          </div>

          <Link
            href="/notifications"
            onClick={() => setIsOpen(false)}
            className="block p-3 text-center text-xs text-[#FF6B35] hover:bg-white/5 transition font-bold"
          >
            Voir toutes les notifications
          </Link>
        </div>
      )}
    </div>
  )
}