'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'

interface FavoritePayload {
  event_id: string
}

interface FavoritesContextValue {
  favoriteIds: Set<string>
  isFavorited: (eventId: string) => boolean
  toggleFavorite: (eventId: string, redirectTo?: string) => Promise<boolean | null>
  loading: boolean
}

const FavoritesContext = createContext<FavoritesContextValue>({
  favoriteIds: new Set(),
  isFavorited: () => false,
  toggleFavorite: async () => null,
  loading: false,
})

/**
 * FavoritesProvider — favori subscription'ı uygulama genelinde tek bir yerde yönetir.
 *
 * Önceki mimaride her FavoriteButton kendi useFavorites() hook'unu çağırıyordu.
 * Bu, aynı kullanıcı için birden fazla `favorites:{userId}` kanalı oluşturuyordu ve
 * Supabase "cannot add postgres_changes callbacks after subscribe()" hatası veriyordu.
 *
 * Çözüm: Tek bir context provider ile tüm uygulamada tek bir realtime channel.
 */
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const fetchFavorites = useCallback(async (userId: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('favorites')
      .select('event_id')
      .eq('user_id', userId)

    if (data) {
      setFavoriteIds(new Set(data.map((row) => row.event_id)))
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set())
      return
    }

    fetchFavorites(user.id)

    // Tek bir realtime channel — provider seviyesinde yönetilir
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

  const isFavorited = useCallback(
    (eventId: string) => favoriteIds.has(eventId),
    [favoriteIds]
  )

  const toggleFavorite = useCallback(
    async (eventId: string, redirectTo?: string): Promise<boolean | null> => {
      if (!user) {
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

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorited, toggleFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavoritesContext() {
  return useContext(FavoritesContext)
}
