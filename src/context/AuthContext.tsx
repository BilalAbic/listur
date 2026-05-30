'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
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

  // initializedRef: getSession + onAuthStateChange race condition'ını önler.
  // İlk başarılı init'ten sonra onAuthStateChange INITIAL_SESSION event'i atlanır.
  const initializedRef = useRef(false)

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
      // Network hatası vb. — sessizce başarısız olma, profile'ı temizle
      console.error('[Auth] fetchProfile unexpected error:', err)
      setProfile(null)
    }
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  useEffect(() => {
    let isMounted = true

    // İlk oturum yükle
    const initSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()

        if (!isMounted) return

        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id)
        }
      } catch (err) {
        console.error('[Auth] getSession error:', err)
      } finally {
        if (isMounted) {
          initializedRef.current = true
          setLoading(false)
        }
      }
    }

    initSession()

    // Auth state değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return

        // INITIAL_SESSION event'ini atla — getSession zaten handle etti
        if (event === 'INITIAL_SESSION' && !initializedRef.current) {
          // getSession henüz bitmemiş, INITIAL_SESSION'ı da atla
          // çünkü getSession promise'i zaten handle edecek
          return
        }
        if (event === 'INITIAL_SESSION' && initializedRef.current) {
          // getSession zaten tamamlandı, tekrar profile çekmeye gerek yok
          return
        }

        // SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED vb. gerçek event'ler
        try {
          setSession(newSession)
          setUser(newSession?.user ?? null)

          if (newSession?.user) {
            await fetchProfile(newSession.user.id)
          } else {
            setProfile(null)
          }
        } catch (err) {
          console.error('[Auth] onAuthStateChange error:', err)
        } finally {
          if (isMounted) {
            setLoading(false)
          }
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
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
