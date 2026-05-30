'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'

/**
 * useFollows — kullanıcının takip ettiği organizatörlerin client state'i.
 *
 * Login-only: misafir kullanıcı toggleFollow çağırırsa giriş sayfasına yönlenir.
 * Follows verisi genellikle statik kaldığı için Realtime subscription yok —
 * sayfa yenilemede fetch yeterli; optimistic update arada anlık geri bildirim verir.
 */
export function useFollows() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const fetchFollows = useCallback(async () => {
    if (!user) {
      setFollowingIds(new Set())
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('organizer_follows')
      .select('organizer_id')
      .eq('follower_id', user.id)

    if (data) {
      setFollowingIds(new Set(data.map((row) => row.organizer_id)))
    }
    setLoading(false)
  }, [user, supabase])

  const isFollowing = useCallback(
    (organizerId: string) => followingIds.has(organizerId),
    [followingIds]
  )

  /**
   * Toggle — kullanıcı zaten takip ediyorsa unfollow, etmiyorsa follow.
   * @param handle organizatörün handle'ı (URL'de görünen)
   * @param organizerId organizatörün UUID'si (state'i optimistic update için)
   * @param redirectTo misafirde /giris'e dönüşte hangi sayfaya gelsin
   * @returns yeni durum: true = takipte, false = değil, misafirde null
   */
  const toggleFollow = useCallback(
    async (
      handle: string,
      organizerId: string,
      redirectTo?: string
    ): Promise<boolean | null> => {
      if (!user) {
        const target = redirectTo ?? window.location.pathname
        router.push(`/giris?redirect=${encodeURIComponent(target)}`)
        return null
      }

      const currentlyFollowing = followingIds.has(organizerId)
      // Optimistic
      setFollowingIds((prev) => {
        const next = new Set(prev)
        if (currentlyFollowing) next.delete(organizerId)
        else next.add(organizerId)
        return next
      })

      try {
        const method = currentlyFollowing ? 'DELETE' : 'POST'
        const res = await fetch(`/api/organizers/${encodeURIComponent(handle)}/follow`, {
          method,
        })
        if (!res.ok) throw new Error('İstek başarısız')
        return !currentlyFollowing
      } catch {
        // Rollback
        setFollowingIds((prev) => {
          const next = new Set(prev)
          if (currentlyFollowing) next.add(organizerId)
          else next.delete(organizerId)
          return next
        })
        return currentlyFollowing
      }
    },
    [user, followingIds, router]
  )

  useEffect(() => {
    fetchFollows()
  }, [fetchFollows])

  return {
    followingIds,
    isFollowing,
    toggleFollow,
    loading,
    refetch: fetchFollows,
  }
}
