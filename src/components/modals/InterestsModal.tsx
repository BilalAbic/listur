'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useInterests } from '@/hooks/useInterests'
import { INTEREST_CATEGORIES } from '@/types/index'
import type { InterestCategory } from '@/types/index'

export function InterestsModal() {
  const { user, profile, refreshProfile } = useAuth()
  const { isModalShown, markModalShown, setLocalInterests, updateSupabaseInterests } = useInterests()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<InterestCategory[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Modal zaten g?sterildiyse a?ma
    if (isModalShown()) return
    // Giri? yapm?? kullan?c? zaten ilgi alan? se?mi?se a?ma
    if (user && profile && profile.interests.length > 0) {
      markModalShown()
      return
    }
    setOpen(true)
  }, [user, profile, isModalShown, markModalShown])

  const toggle = (cat: InterestCategory) => {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    markModalShown()

    if (user) {
      // Kay?tl? kullan?c? ? Supabase'e kaydet
      await updateSupabaseInterests(selected)
      await refreshProfile()
    } else {
      // Misafir ? localStorage'a kaydet
      setLocalInterests(selected)
    }

    setSaving(false)
    setOpen(false)
  }

  const handleSkip = () => {
    markModalShown()
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        {/* Ba?l?k */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Seni hangi konular ilgilendiriyor?
          </h2>
          <p className="text-gray-500 text-sm">
            Se?imlerine g?re etkinlikleri ?ne ??karaca??z. ?stedi?in zaman de?i?tirebilirsin.
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
          <button
            onClick={handleSkip}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            ?imdilik atla
          </button>
          <button
            onClick={handleSave}
            disabled={saving || selected.length === 0}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Kaydediliyor?' : `Devam et (${selected.length})`}
          </button>
        </div>
      </div>
    </div>
  )
}
