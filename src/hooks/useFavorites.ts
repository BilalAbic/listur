'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'

interface FavoritePayload {
  event_id: string
}

/**
 * useFavorites — kullanıcının favori etkinliklerinin client-side state'i.
 *
 * Sadece login kullanıcı için aktif: misafir kullanıcı toggleFavorite çağırırsa
 * giriş sayfasına yönlendirilir (currentSlug parametresi ile geri dönüş için).
 *
 * Realtime subscription `favorites:{user_id}` kanalı üzerinden INSERT/DELETE
 * yakalar — başka sekmede yapılan değişiklik anında yansır.
 */
export function useFavorites() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteIds(new Set())
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('favorites')
      .select('event_id')
      .eq('user_id', user.id)

    if (data) {
      setFavoriteIds(new Set(data.map((row) => row.event_id)))
    }
    setLoading(false)
  }, [user, supabase])

  const isFavorited = useCallback(
    (eventId: string) => favoriteIds.has(eventId),
    [favoriteIds]
  )

  /**
   * Toggle: ekli ise siler, ekli değilse ekler.
   * @returns yeni durum: true = favori, false = değil. Misafirde null.
   */
  const toggleFavorite = useCallback(
    async (eventId: string, redirectTo?: string): Promise<boolean | null> => {
      if (!user) {
        // Misafir → giriş sayfasına yönlendir
        const target = redirectTo ?? window.location.pathname
        router.push(`/giris?redirect=${encodeURIComponent(target)}`)
        return null
      }

      const currentlyFavorited = favoriteIds.has(eventId)
      // Optimistic update
      setFavoriteIds((prev) => {
        const next = new Set(prev)
        if (currentlyFavorited) next.delete(eventId)
        else next.add(eventId)
        return next
      })

      const url = `/api/events/${eventId}/favorite`
      const method = currentlyFavorited ? 'DELETE' : 'POST'
      try {
        const res = await fetch(url, { method })
        if (!res.ok) throw new Error('İstek başarısız')
        return !currentlyFavorited
      } catch {
        // Rollback
        setFavoriteIds((prev) => {
          const next = new Set(prev)
          if (currentlyFavorited) next.add(eventId)
          else next.delete(eventId)
          return next
        })
        return currentlyFavorited
      }
    },
    [user, favoriteIds, router]
  )

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set())
      return
    }
    fetchFavorites()

    const channel = supabase
      .channel(`favorites:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'favorites',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as FavoritePayload
          setFavoriteIds((prev) => {
            if (prev.has(row.event_id)) return prev
            const next = new Set(prev)
            next.add(row.event_id)
            return next
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'favorites',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.old as Partial<FavoritePayload>
          if (!row.event_id) return
          setFavoriteIds((prev) => {
            if (!prev.has(row.event_id!)) return prev
            const next = new Set(prev)
            next.delete(row.event_id!)
            return next
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase, fetchFavorites])

  return {
    favoriteIds,
    isFavorited,
    toggleFavorite,
    loading,
    refetch: fetchFavorites,
  }
}
