'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { INTEREST_CATEGORIES } from '@/types/index'
import type { InterestCategory } from '@/types/index'

export default function ProfilPage() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [interests, setInterests] = useState<InterestCategory[]>([])
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Giriş yapmamış kullanıcıyı yönlendir
  useEffect(() => {
    if (!loading && !user) {
      router.push('/giris?redirect=/profil')
    }
  }, [user, loading, router])

  // Profil verisini forma yükle
  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setInterests((profile.interests as InterestCategory[]) || [])
      setNotifyEmail(profile.notify_email)
    }
  }, [profile])

  const toggleInterest = (cat: InterestCategory) => {
    setInterests((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('profiles')
      .update({ name, interests, notify_email: notifyEmail })
      .eq('id', user.id)

    if (error) {
      setMessage({ type: 'error', text: 'Kaydedilirken hata oluştu.' })
    } else {
      await refreshProfile()
      setMessage({ type: 'success', text: 'Profil güncellendi!' })
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user || !profile) return null

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Profil Ayarları</h1>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Temel bilgiler */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Kişisel Bilgiler</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Adınız Soyadınız"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
              <input
                type="email" value={user.email || ''} disabled
                className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-gray-400 text-sm cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">E-posta adresi değiştirilemez.</p>
            </div>
          </div>
        </section>

        {/* İlgi alanları */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-1">İlgi Alanları</h2>
          <p className="text-sm text-gray-500 mb-4">Seçtiğin alanlardaki etkinlikler için bildirim alırsın.</p>
          <div className="grid grid-cols-2 gap-2">
            {INTEREST_CATEGORIES.map((cat) => {
              const isSelected = interests.includes(cat)
              return (
                <button
                  key={cat} type="button"
                  onClick={() => toggleInterest(cat)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all border-2 ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </section>

        {/* Bildirim tercihleri */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Bildirim Tercihleri</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">E-posta bildirimleri</p>
              <p className="text-xs text-gray-500">İlgi alanlarınla eşleşen yeni etkinlikler için e-posta al.</p>
            </div>
          </label>
        </section>

        {/* Gönderim geçmişi */}
        <SubmissionHistory userId={user.id} />

        {/* Kaydet butonu */}
        {message && (
          <p className={`text-sm text-center ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {message.text}
          </p>
        )}
        <button
          type="submit" disabled={saving}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet'}
        </button>
      </form>
    </main>
  )
}

// Gönderim geçmişi bileşeni
function SubmissionHistory({ userId }: { userId: string }) {
  const supabase = createClient()
  const [submissions, setSubmissions] = useState<Array<{
    id: string
    raw_url: string
    submitted_at: string
    events: { title: string; status: string; slug: string } | null
  }>>([])

  useEffect(() => {
    supabase
      .from('submissions')
      .select('id, raw_url, submitted_at, events(title, status, slug)')
      .eq('submitted_by', userId)
      .order('submitted_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setSubmissions(data as typeof submissions)
      })
  }, [userId, supabase])

  if (submissions.length === 0) return null

  const statusLabel: Record<string, { label: string; className: string }> = {
    pending: { label: 'Beklemede', className: 'bg-yellow-100 text-yellow-700' },
    published: { label: 'Yayında', className: 'bg-green-100 text-green-700' },
    rejected: { label: 'Reddedildi', className: 'bg-red-100 text-red-700' },
    removed: { label: 'Kaldırıldı', className: 'bg-gray-100 text-gray-600' },
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-800 mb-4">Gönderim Geçmişi</h2>
      <div className="space-y-3">
        {submissions.map((s) => {
          const st = statusLabel[s.events?.status ?? 'pending']
          return (
            <div key={s.id} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {s.events?.title || s.raw_url}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(s.submitted_at).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${st.className}`}>
                {st.label}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
