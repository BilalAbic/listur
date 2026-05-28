'use client'

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import type { InterestCategory } from '@/types/index'

const LS_KEY_INTERESTS = 'listur_interests'
const LS_KEY_SHOWN = 'listur_interests_shown'

export function useInterests() {
  const { user } = useAuth()
  const supabase = createClient()

  /** localStorage'dan ilgi alanlarını oku */
  const getLocalInterests = (): InterestCategory[] => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(LS_KEY_INTERESTS)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  /** localStorage'a ilgi alanlarını kaydet */
  const setLocalInterests = (interests: InterestCategory[]) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(LS_KEY_INTERESTS, JSON.stringify(interests))
  }

  /** Modalın daha önce gösterilip gösterilmediğini kontrol et */
  const isModalShown = (): boolean => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem(LS_KEY_SHOWN) === 'true'
  }

  /** Modalı gösterildi olarak işaretle */
  const markModalShown = () => {
    if (typeof window === 'undefined') return
    localStorage.setItem(LS_KEY_SHOWN, 'true')
  }

  /**
   * Kullanıcı giriş yaptıktan sonra localStorage ilgi alanlarını
   * Supabase profile'ına taşır
   */
  const syncInterestsToSupabase = useCallback(async () => {
    if (!user) return
    const localInterests = getLocalInterests()
    if (localInterests.length === 0) return

    const { error } = await supabase
      .from('profiles')
      .update({ interests: localInterests })
      .eq('id', user.id)

    if (!error) {
      // Başarılı sync → localStorage'ı temizle (artık Supabase'de)
      localStorage.removeItem(LS_KEY_INTERESTS)
    }
  }, [user, supabase])

  /**
   * Kayıtlı kullanıcı için Supabase'den ilgi alanlarını güncelle
   */
  const updateSupabaseInterests = useCallback(
    async (interests: string[]) => {
      if (!user) return { error: new Error('Giriş yapılmamış') }
      const { error } = await supabase
        .from('profiles')
        .update({ interests })
        .eq('id', user.id)
      return { error }
    },
    [user, supabase]
  )

  return {
    getLocalInterests,
    setLocalInterests,
    isModalShown,
    markModalShown,
    syncInterestsToSupabase,
    updateSupabaseInterests,
  }
}
