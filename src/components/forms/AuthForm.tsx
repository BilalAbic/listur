'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useInterests } from '@/hooks/useInterests'

type Tab = 'login' | 'signup' | 'magic'
type OAuthProvider = 'google' | 'github'

/**
 * Supabase emailRedirectTo için güvenli base URL döndürür.
 * NEXT_PUBLIC_APP_URL localhost değilse onu kullan (Vercel preview/prod).
 * Yoksa window.location.origin'i kullan (local dev / fallback).
 */
function getRedirectBase(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl && !appUrl.includes('localhost')) return appUrl.replace(/\/$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

/**
 * Supabase Auth hata mesajlarını kullanıcı dostu Türkçe'ye çevirir.
 * Bilinmeyen hatalar generic mesaja düşer.
 */
function translateAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('rate limit')) return 'Çok sık deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.'
  if (m.includes('invalid') && m.includes('email')) return 'Geçersiz e-posta adresi. Lütfen gerçek bir e-posta kullanın.'
  if (m.includes('already registered') || m.includes('already exists')) return 'Bu e-posta zaten kayıtlı. Giriş yapmayı deneyin.'
  if (m.includes('password should be at least') || m.includes('password is too short')) return 'Şifre en az 8 karakter olmalı.'
  if (m.includes('weak password')) return 'Şifre çok zayıf. Daha güçlü bir şifre seçin.'
  if (m.includes('email not confirmed')) return 'E-postanızı henüz doğrulamadınız. Gelen kutunuzu kontrol edin.'
  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) return 'E-posta veya şifre hatalı.'
  if (m.includes('user not found')) return 'Bu e-posta ile kayıtlı kullanıcı bulunamadı.'
  if (m.includes('signup') && m.includes('disabled')) return 'Kayıt geçici olarak kapalı. Lütfen daha sonra deneyin.'
  return 'Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.'
}

const CALLBACK_ERRORS: Record<string, string> = {
  session_exchange_failed: 'Giriş bağlantısı geçersiz veya süresi dolmuş. Lütfen yeni bağlantı isteyin.',
  no_code: 'Giriş bağlantısı eksik. Lütfen tekrar deneyin.',
}

// ─── SVG İkonlar ────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

// ─── OAuth Buton Grubu ────────────────────────────────────────────────────────

interface OAuthButtonsProps {
  onOAuth: (provider: OAuthProvider) => void
  loading: boolean
}

function OAuthButtons({ onOAuth, loading }: OAuthButtonsProps) {
  return (
    <div className="mt-6">
      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-gray-400">veya şununla devam et</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onOAuth('google')}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <GoogleIcon />
          Google
        </button>
        <button
          type="button"
          onClick={() => onOAuth('github')}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <GitHubIcon />
          GitHub
        </button>
      </div>
    </div>
  )
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

export function AuthForm() {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as Tab) || 'login'
  const redirectTo = searchParams.get('redirect') || '/'
  const callbackError = searchParams.get('error')

  const [tab, setTab] = useState<Tab>(initialTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  // Auth callback'ten gelen hata varsa başlangıç mesajı olarak göster
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    callbackError ? { type: 'error', text: CALLBACK_ERRORS[callbackError] ?? 'Giriş başarısız. Lütfen tekrar deneyin.' } : null
  )
  const [magicSent, setMagicSent] = useState(false)

  const supabase = createClient()
  const { syncInterestsToSupabase } = useInterests()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setMessage({ type: 'error', text: 'E-posta veya şifre hatalı.' })
        return
      }

      await syncInterestsToSupabase()
      // Tam sayfa yönlendirme — server session'ı middleware'den okusun
      window.location.href = redirectTo
    } catch {
      setMessage({ type: 'error', text: 'Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.' })
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${getRedirectBase()}/auth/callback`,
        },
      })

      if (error) {
        setMessage({ type: 'error', text: translateAuthError(error.message) })
        return
      }

      await syncInterestsToSupabase()
      setMessage({
        type: 'success',
        text: 'Hesabınız oluşturuldu! E-postanızı kontrol edin (gerekiyorsa).',
      })
      // Başarılı kayıt → tam sayfa yönlendirme
      setTimeout(() => {
        window.location.href = redirectTo
      }, 1500)
    } catch {
      setMessage({ type: 'error', text: 'Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.' })
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${getRedirectBase()}/auth/callback`,
        },
      })

      if (error) {
        setMessage({ type: 'error', text: translateAuthError(error.message) })
        return
      }

      setMagicSent(true)
    } catch {
      setMessage({ type: 'error', text: 'Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.' })
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: OAuthProvider) => {
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          // next param: callback route bunu okuyup doğru sayfaya yönlendirir
          redirectTo: `${getRedirectBase()}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      })

      if (error) {
        setMessage({ type: 'error', text: 'Sosyal giriş başlatılamadı. Lütfen tekrar deneyin.' })
      }
      // Hata yoksa tarayıcı provider'a yönlendirilir — loading finally'de temizlenir
    } catch {
      setMessage({ type: 'error', text: 'Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.' })
    } finally {
      setLoading(false)
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'login', label: 'Giriş Yap' },
    { id: 'signup', label: 'Kayıt Ol' },
    { id: 'magic', label: 'Magic Link' },
  ]

  if (magicSent) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">E-postanızı kontrol edin</h3>
        <p className="text-gray-500 text-sm">
          <strong>{email}</strong> adresine giriş bağlantısı gönderdik.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Tab */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setMessage(null) }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Giriş Yap */}
      {tab === 'login' && (
        <>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required placeholder="ornek@email.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            {message && (
              <p className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                {message.text}
              </p>
            )}
            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
            </button>
          </form>
          <OAuthButtons onOAuth={handleOAuth} loading={loading} />
        </>
      )}

      {/* Kayıt Ol */}
      {tab === 'signup' && (
        <>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                required placeholder="Adınız Soyadınız"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required placeholder="ornek@email.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required placeholder="En az 8 karakter" minLength={8}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            {message && (
              <p className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                {message.text}
              </p>
            )}
            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Hesap oluşturuluyor…' : 'Kayıt Ol'}
            </button>
          </form>
          <OAuthButtons onOAuth={handleOAuth} loading={loading} />
        </>
      )}

      {/* Magic Link — OAuth gösterilmez (zaten passwordless) */}
      {tab === 'magic' && (
        <form onSubmit={handleMagicLink} className="space-y-4">
          <p className="text-sm text-gray-500">
            E-posta adresinize şifresiz giriş bağlantısı göndereceğiz.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required placeholder="ornek@email.com"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          {message && (
            <p className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
              {message.text}
            </p>
          )}
          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Gönderiliyor…' : 'Bağlantı Gönder'}
          </button>
        </form>
      )}
    </div>
  )
}
