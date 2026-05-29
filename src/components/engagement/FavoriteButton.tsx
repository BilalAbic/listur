'use client'

import { useState } from 'react'
import { useFavorites } from '@/hooks/useFavorites'

type Variant = 'overlay' | 'full'

interface Props {
  eventId: string
  variant?: Variant
  /** Etkinlik slug'ı veya rota — misafir yönlendirmesi için. Yoksa current path kullanılır. */
  redirectTo?: string
  /** Detay sayfasında favori sayacı göstermek için. */
  count?: number
}

/**
 * FavoriteButton — etkinliği favorilere ekler/çıkarır.
 *
 * `overlay`: kartın sağ üst köşesine yerleşen küçük yuvarlak ikon
 * `full`: detay sayfasında metin + ikon büyük buton
 *
 * Misafir kullanıcı tıklarsa `/giris?redirect=...`'e yönlenir.
 */
export function FavoriteButton({ eventId, variant = 'overlay', redirectTo, count }: Props) {
  const { isFavorited, toggleFavorite } = useFavorites()
  const [busy, setBusy] = useState(false)
  const favorited = isFavorited(eventId)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    await toggleFavorite(eventId, redirectTo)
    setBusy(false)
  }

  if (variant === 'overlay') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-label={favorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        aria-pressed={favorited}
        className={`absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${
          favorited
            ? 'bg-red-500 text-white shadow-md hover:bg-red-600'
            : 'bg-white/90 text-gray-700 hover:bg-white hover:text-red-500'
        } disabled:opacity-60`}
      >
        <HeartIcon filled={favorited} />
      </button>
    )
  }

  // full
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-pressed={favorited}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        favorited
          ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
      } disabled:opacity-60`}
    >
      <HeartIcon filled={favorited} />
      <span>{favorited ? 'Favorilerimde' : 'Favorilere ekle'}</span>
      {typeof count === 'number' && count > 0 && (
        <span className="text-xs text-gray-500 font-normal">({count})</span>
      )}
    </button>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="w-5 h-5"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"
      />
    </svg>
  )
}
