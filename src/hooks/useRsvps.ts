'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import type { Database } from '@/types/database'

export type RsvpStatus = Database['public']['Enums']['rsvp_status']

interface RsvpRow {
  event_id: string
  status: RsvpStatus
}

/**
 * useRsvps — kullanıcının RSVP durumlarının client-side state'i.
 *
 * Sadece login kullanıcı için aktif: misafir kullanıcı setRsvp çağırırsa
 * giriş sayfasına yönlendirilir.
 */
export function useRsvps() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  // event_id → status haritası
  const [rsvpsByEvent, setRsvpsByEvent] = useState<Map<string, RsvpStatus>>(new Map())
  const [loading, setLoading] = useState(false)

  const fetchRsvps = useCallback(async () => {
    if (!user) {
      setRsvpsByEvent(new Map())
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('rsvps')
      .select('event_id, status')
      .eq('user_id', user.id)

    if (data) {
      setRsvpsByEvent(new Map(data.map((row) => [row.event_id, row.status])))
    }
    setLoading(false)
  }, [user, supabase])

  const getStatus = useCallback(
    (eventId: string): RsvpStatus | null => rsvpsByEvent.get(eventId) ?? null,
    [rsvpsByEvent]
  )

  /**
   * setRsvp: yeni status'ü kaydeder (upsert). Aynı status tekrar set edilirse no-op.
   * @returns yeni status, misafirde null.
   */
  const setRsvp = useCallback(
    async (
      eventId: string,
      status: RsvpStatus,
      redirectTo?: string
    ): Promise<RsvpStatus | null> => {
      if (!user) {
        const target = redirectTo ?? window.location.pathname
        router.push(`/giris?redirect=${encodeURIComponent(target)}`)
        return null
      }

      const previous = rsvpsByEvent.get(eventId) ?? null
      if (previous === status) return status

      // Optimistic
      setRsvpsByEvent((prev) => {
        const next = new Map(prev)
        next.set(eventId, status)
        return next
      })

      try {
        const res = await fetch(`/api/events/${eventId}/rsvp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
        if (!res.ok) throw new Error('İstek başarısız')
        return status
      } catch {
        // Rollback
        setRsvpsByEvent((prev) => {
          const next = new Map(prev)
          if (previous === null) next.delete(eventId)
          else next.set(eventId, previous)
          return next
        })
        return previous
      }
    },
    [user, rsvpsByEvent, router]
  )

  /**
   * clearRsvp: RSVP'yi tamamen siler.
   */
  const clearRsvp = useCallback(
    async (eventId: string): Promise<boolean> => {
      if (!user) {
        router.push(`/giris?redirect=${encodeURIComponent(window.location.pathname)}`)
        return false
      }
      const previous = rsvpsByEvent.get(eventId) ?? null
      if (previous === null) return true

      // Optimistic
      setRsvpsByEvent((prev) => {
        const next = new Map(prev)
        next.delete(eventId)
        return next
      })

      try {
        const res = await fetch(`/api/events/${eventId}/rsvp`, { method: 'DELETE' })
        if (!res.ok) throw new Error('İstek başarısız')
        return true
      } catch {
        setRsvpsByEvent((prev) => {
          const next = new Map(prev)
          next.set(eventId, previous)
          return next
        })
        return false
      }
    },
    [user, rsvpsByEvent, router]
  )

  useEffect(() => {
    if (!user) {
      setRsvpsByEvent(new Map())
      return
    }
    fetchRsvps()

    const channel = supabase
      .channel(`rsvps:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rsvps',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const row = payload.old as Partial<RsvpRow>
            if (!row.event_id) return
            setRsvpsByEvent((prev) => {
              if (!prev.has(row.event_id!)) return prev
              const next = new Map(prev)
              next.delete(row.event_id!)
              return next
            })
            return
          }
          const row = payload.new as RsvpRow
          setRsvpsByEvent((prev) => {
            const existing = prev.get(row.event_id)
            if (existing === row.status) return prev
            const next = new Map(prev)
            next.set(row.event_id, row.status)
            return next
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase, fetchRsvps])

  return {
    rsvpsByEvent,
    getStatus,
    setRsvp,
    clearRsvp,
    loading,
    refetch: fetchRsvps,
  }
}
