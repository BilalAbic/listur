'use client'

import { useState } from 'react'

interface Props {
  value: string[]
  onChange: (next: string[]) => void
  /** Maksimum etiket sayısı. Default 8. */
  max?: number
  placeholder?: string
}

/**
 * TagInput — chip-based etiket girişi.
 *
 * - Enter veya virgül → mevcut input'u tag olarak ekle
 * - Backspace (input boşken) → son tag'i sil
 * - Otomatik kebab-case (küçük harf, boşluk → -, Türkçe karakter ASCII'ye)
 * - Default max 8 tag
 */
export function TagInput({ value, onChange, max = 8, placeholder }: Props) {
  const [input, setInput] = useState('')

  const normalize = (raw: string): string => {
    return raw
      .toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30)
  }

  const addTag = (raw: string) => {
    const t = normalize(raw)
    if (!t) return
    if (value.includes(t)) return
    if (value.length >= max) return
    onChange([...value, t])
    setInput('')
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  const handleBlur = () => {
    if (input.trim()) addTag(input)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent bg-white min-h-[44px]">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-sm font-medium px-2 py-0.5 rounded-full"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-indigo-500 hover:text-indigo-800 text-xs font-bold leading-none"
              aria-label={`${tag} etiketini kaldır`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder ?? 'react, ai, hackathon…' : ''}
          maxLength={30}
          disabled={value.length >= max}
          className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {value.length}/{max} etiket · Enter veya virgülle ekle · Türkçe karakter otomatik dönüştürülür
      </p>
    </div>
  )
}
