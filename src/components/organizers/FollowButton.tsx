'use client'

import { useState } from 'react'
import { useFollows } from '@/hooks/useFollows'
import { useAuth } from '@/context/AuthContext'

interface Props {
  /** Hedef organizatörün handle'ı (URL parametresi olarak gider) */
  handle: string
  /** Hedef organizatörün UUID'si (state ve self-follow check için) */
  organizerId: string
  /** Misafir yönlendirmesinde geri dönüş URL'i */
  redirectTo?: string
  size?: 'sm' | 'md'
}

/**
 * FollowButton — login kullanıcının organizatörü takip etmesini sağlar.
 * Misafir tıklarsa /giris'e yönlendirilir. Kendi profilinde butonu render etmez.
 */
export function FollowButton({ handle, organizerId, redirectTo, size = 'md' }: Props) {
  const { user } = useAuth()
  const { isFollowing, toggleFollow } = useFollows()
  const [busy, setBusy] = useState(false)
  const following = isFollowing(organizerId)

  // Kendi profilini takip etme butonu gösterme
  if (user?.id === organizerId) return null

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    await toggleFollow(handle, organizerId, redirectTo)
    setBusy(false)
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-3 py-1.5 text-xs'
      : 'px-4 py-2 text-sm'

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-pressed={following}
      className={`inline-flex items-center gap-1.5 font-semibold rounded-xl transition-all disabled:opacity-60 ${sizeClasses} ${
        following
          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          : 'bg-indigo-600 text-white hover:bg-indigo-700'
      }`}
    >
      {following ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Takiptesin
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Takip et
        </>
      )}
    </button>
  )
}
