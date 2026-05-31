'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  /** Header'da kompakt mı, /ara sayfasında geniş mi */
  variant?: 'compact' | 'wide'
  /** İlk değer (örn. /ara sayfasında q parametresi). Server'dan prop ile gelir. */
  initialValue?: string
}

/**
 * SearchBar — etkinliklerde Türkçe full-text arama.
 *
 * Submit → /ara?q={query}
 * Header'da `compact` variant, /ara sayfasında `wide`.
 *
 * NOT: useSearchParams kullanmıyor (Suspense gerektirir, build fail eder).
 * /ara sayfası `initialValue` prop'unu server-side searchParams'tan alır.
 */
export function SearchBar({ variant = 'compact', initialValue }: Props) {
  const router = useRouter()
  const [value, setValue] = useState(initialValue ?? '')

  // initialValue değişirse (sayfa geçişi) input'u senkronla
  useEffect(() => {
    setValue(initialValue ?? '')
  }, [initialValue])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = value.trim()
    if (q.length < 2) return
    router.push(`/ara?q=${encodeURIComponent(q)}`)
  }

  const sizeClasses =
    variant === 'compact'
      ? 'h-9 text-sm pl-9 pr-3 w-48 lg:w-64'
      : 'h-12 text-base pl-12 pr-4 w-full'

  const iconClasses =
    variant === 'compact'
      ? 'w-4 h-4 left-3'
      : 'w-5 h-5 left-4'

  return (
    <form onSubmit={handleSubmit} className={variant === 'wide' ? 'w-full' : ''}>
      <div className="relative">
        <svg
          className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${iconClasses}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
        </svg>
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={variant === 'compact' ? 'Etkinlik ara…' : 'Hackathon, meetup, organizatör ara…'}
          aria-label="Etkinlik ara"
          maxLength={200}
          className={`${sizeClasses} rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
        />
      </div>
    </form>
  )
}
