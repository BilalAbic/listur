'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useInterests } from '@/hooks/useInterests'
import { INTEREST_CATEGORIES } from '@/types/index'
import type { InterestCategory } from '@/types/index'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

export function InterestsModal() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const { isModalShown, markModalShown, setLocalInterests, updateSupabaseInterests } = useInterests()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<InterestCategory[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // 1. Initial auth check bitmeden karar verme
    if (authLoading) return
    // 2. Kullanıcı giriş yapmış ama profil henüz fetch edilmemiş (user set, profile null = loading)
    //    Bu durumda modal açma — sonraki render'da profil gelince tekrar çalışır
    if (user !== null && profile === null) return
    // 3. Modal daha önce gösterildiyse açma
    if (isModalShown()) return
    // 4. Profili olan kullanıcı → zaten seçim yapmış, modal gereksiz
    if (user && profile && (profile.interests as string[] | null)?.length) {
      markModalShown()
      return
    }
    // 5. Misafir (user=null) veya ilgi alanı seçmemiş kullanıcı → aç
    setOpen(true)
  }, [user, profile, authLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (cat: InterestCategory) => {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    markModalShown()

    if (user) {
      // Kayıtlı kullanıcı → Supabase'e kaydet
      await updateSupabaseInterests(selected)
      await refreshProfile()
    } else {
      // Misafir → localStorage'a kaydet
      setLocalInterests(selected)
    }

    setSaving(false)
    setOpen(false)
  }

  const handleSkip = () => {
    markModalShown()
    setOpen(false)
  }

  return (
    <Modal
      open={open}
      onClose={handleSkip}
      size="md"
      closeOnBackdrop={false} // İlk açılış modalı — bilinçli seçim istiyoruz
      data-testid="interests-modal"
    >
      {/* Başlık */}
      <div className="mb-6">
        <h2 id="interests-modal-title" className="text-2xl font-bold text-gray-900 mb-2">
          Seni hangi konular ilgilendiriyor?
        </h2>
        <p className="text-gray-500 text-sm">
          Seçimlerine göre etkinlikleri öne çıkaracağız. İstediğin zaman değiştirebilirsin.
        </p>
      </div>

      {/* Kategori grid */}
      <div className="grid grid-cols-2 gap-2 mb-8">
        {INTEREST_CATEGORIES.map((cat) => {
          const isSelected = selected.includes(cat)
          return (
            <button
              key={cat}
              onClick={() => toggle(cat)}
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

      {/* Butonlar */}
      <div className="flex gap-3">
        <Button variant="secondary" fullWidth onClick={handleSkip}>
          Şimdilik atla
        </Button>
        <Button
          variant="primary"
          fullWidth
          onClick={handleSave}
          disabled={saving || selected.length === 0}
        >
          {saving ? 'Kaydediliyor…' : `Devam et (${selected.length})`}
        </Button>
      </div>
    </Modal>
  )
}
