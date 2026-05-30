'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types/database'

type Profile = Tables<'profiles'>

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  /** null = sorgulanmadı/yok, 'open' = beklemede, 'resolved' = sonuçlandı */
  organizerAppStatus: 'open' | 'resolved' | null
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  organizerAppStatus: null,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [organizerAppStatus, setOrganizerAppStatus] = useState<'open' | 'resolved' | null>(null)

  const supabase = createClient()

  const fetchProfile = useCallback(async (supabaseUser: User) => {
    // ── 1. Profil çek ──────────────────────────────────────────────────────────
    // Ayrı try-catch: organizatör sorgusu hata verse bile profile=null olmaz.
    try {
      let { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle()

      if (error) {
        console.error('[Auth] fetchProfile error:', error.message)
        setProfile(null)
        return
      }

      // Profile satırı yok — trigger başarısız olmuş olabilir, otomatik oluştur.
      if (!profileData) {
        const { data: created, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: supabaseUser.id,
            email: supabaseUser.email ?? '',
            name: (supabaseUser.user_metadata?.name as string | undefined)
              ?? (supabaseUser.user_metadata?.full_name as string | undefined)
              ?? '',
          })
          .select()
          .single()

        if (createError) {
          console.error('[Auth] createProfile error:', createError.message)
          setProfile(null)
          return
        }
        profileData = created
      }

      setProfile(profileData)
    } catch (err) {
      console.error('[Auth] fetchProfile unexpected error:', err)
      setProfile(null)
      return
    }

    // ── 2. Organizatör başvuru durumu ──────────────────────────────────────────
    // Ayrı try-catch: bu sorgu başarısız olursa profileya dokunmaz.
    try {
      const { data: appData } = await supabase
        .from('organizer_applications')
        .select('status')
        .eq('user_id', supabaseUser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setOrganizerAppStatus((appData?.status ?? null) as 'open' | 'resolved' | null)
    } catch {
      setOrganizerAppStatus(null)
    }
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user)
  }, [user, fetchProfile])

  useEffect(() => {
    let isMounted = true

    // Fallback: INITIAL_SESSION 3sn içinde gelmezse loading'i kapat.
    // Bu timeout, INITIAL_SESSION alındığında AWAIT'TEN ÖNCE temizlenir —
    // aksi hâlde fetchProfile sırasında erken tetiklenip profile=null iken
    // loading=false olur ve "Profil yüklenemedi" hatası görünür.
    const timeout = setTimeout(() => {
      if (isMounted) setLoading(false)
    }, 3000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return

        // CRITICAL: clearTimeout AWAIT'TEN ÖNCE — race condition önlenir.
        // fetchProfile yavaş olsa bile timeout artık loading'i erken kapatamaz.
        if (event === 'INITIAL_SESSION') {
          clearTimeout(timeout)
        }

        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          await fetchProfile(newSession.user)
        } else {
          setProfile(null)
          setOrganizerAppStatus(null)
        }

        if (event === 'INITIAL_SESSION') {
          if (isMounted) setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch {
      // signOut network hatası verse de sayfayı yenile — middleware session'ı temizler
    }
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, organizerAppStatus, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
