import Link from 'next/link'
import { VerifiedBadge } from './VerifiedBadge'

interface MiniOrganizer {
  handle: string | null
  name: string
  verified_at: string | null
}

interface Props {
  organizer: MiniOrganizer
  /** Etkinlik kartı altında küçük chip mi, yoksa standalone mı? */
  size?: 'chip' | 'card'
}

/**
 * OrganizerCard — etkinlik kartlarında veya keşif sayfasında küçük organizatör link'i.
 * Handle yoksa render etmez (henüz doğrulanmamış organizatör — public sayfası yok).
 */
export function OrganizerCard({ organizer, size = 'chip' }: Props) {
  if (!organizer.handle) return null

  const isVerified = !!organizer.verified_at

  if (size === 'chip') {
    return (
      <Link
        href={`/organizator/${organizer.handle}`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition-colors"
      >
        <span className="truncate">@{organizer.handle}</span>
        {isVerified && <VerifiedBadge size="sm" />}
      </Link>
    )
  }

  // card variant — daha büyük, standalone
  return (
    <Link
      href={`/organizator/${organizer.handle}`}
      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-base font-bold flex items-center justify-center">
        {(organizer.name || organizer.handle)[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-gray-900 truncate">
            {organizer.name || `@${organizer.handle}`}
          </span>
          {isVerified && <VerifiedBadge size="sm" />}
        </div>
        <p className="text-xs text-gray-500">@{organizer.handle}</p>
      </div>
    </Link>
  )
}
