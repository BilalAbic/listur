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
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('[Auth] fetchProfile error:', error.message)
        setProfile(null)
        return
      }

      setProfile(data)
    } catch (err) {
      console.error('[Auth] fetchProfile unexpected error:', err)
      setProfile(null)
    }
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  useEffect(() => {
    let isMounted = true

    // INITIAL_SESSION gelmezse loading=true'da takılmayalım (güvenlik timeout)
    const timeout = setTimeout(() => {
      if (isMounted) setLoading(false)
    }, 3000)

    // onAuthStateChange'i primary kaynak olarak kullan.
    // INITIAL_SESSION eventi getSession'ın eşdeğeri — hem SSR cookie'sini
    // hem de client storage'ı kontrol eder.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return

        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          await fetchProfile(newSession.user.id)
        } else {
          setProfile(null)
        }

        // INITIAL_SESSION geldiğinde loading biter (timeout'tan önce)
        if (event === 'INITIAL_SESSION') {
          clearTimeout(timeout)
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
    await supabase.auth.signOut()
    // Tam sayfa yenileme — server session state'ini sıfırla, middleware cookie'lerini temizle
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
