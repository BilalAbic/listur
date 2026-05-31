'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import type { Tables } from '@/types/database'

type Notification = Tables<'notifications'>

export function useNotifications() {
  const { user } = useAuth()
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter((n) => !n.read_at).length)
    }
    setLoading(false)
  }, [user, supabase])

  const markAsRead = useCallback(
    async (notificationId: string) => {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    },
    [supabase]
  )

  const markAllAsRead = useCallback(async () => {
    if (!user) return
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null)

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    )
    setUnreadCount(0)
  }, [user, supabase])

  // Logout sırasında notification state'i temizleme + Realtime subscription
  // restore pattern. React Compiler tavsiyesi bilinçli kabul.
  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotifications([])
       
      setUnreadCount(0)
      return
    }

    fetchNotifications()

    // Realtime subscription
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification
          setNotifications((prev) => [newNotif, ...prev])
          setUnreadCount((prev) => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase, fetchNotifications])

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch: fetchNotifications }
}
