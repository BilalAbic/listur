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

  /** localStorage'dan ilgi alanlar?n? oku */
  const getLocalInterests = (): InterestCategory[] => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(LS_KEY_INTERESTS)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  /** localStorage'a ilgi alanlar?n? kaydet */
  const setLocalInterests = (interests: InterestCategory[]) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(LS_KEY_INTERESTS, JSON.stringify(interests))
  }

  /** Modal?n daha ?nce g?sterilip g?sterilmedi?ini kontrol et */
  const isModalShown = (): boolean => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem(LS_KEY_SHOWN) === 'true'
  }

  /** Modal? g?sterildi olarak i?aretle */
  const markModalShown = () => {
    if (typeof window === 'undefined') return
    localStorage.setItem(LS_KEY_SHOWN, 'true')
  }

  /**
   * Kullan?c? giri? yapt?ktan sonra localStorage ilgi alanlar?n?
   * Supabase profile'?na ta??r
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
      // Ba?ar?l? sync ? localStorage'? temizle (art?k Supabase'de)
      localStorage.removeItem(LS_KEY_INTERESTS)
    }
  }, [user, supabase])

  /**
   * Kay?tl? kullan?c? i?in Supabase'den ilgi alanlar?n? g?ncelle
   */
  const updateSupabaseInterests = useCallback(
    async (interests: string[]) => {
      if (!user) return { error: new Error('Giri? yap?lmam??') }
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
