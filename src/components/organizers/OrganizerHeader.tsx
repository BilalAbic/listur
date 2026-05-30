import Link from 'next/link'
import { VerifiedBadge } from './VerifiedBadge'
import { FollowButton } from './FollowButton'

interface OrganizerProfile {
  id: string
  handle: string | null
  name: string
  bio: string | null
  website: string | null
  twitter: string | null
  github: string | null
  is_organizer: boolean
  verified_at: string | null
  follower_count: number
}

interface Props {
  organizer: OrganizerProfile
}

/**
 * OrganizerHeader — `/organizator/[handle]` sayfasının üst bölümü.
 * Avatar (initial), ad + handle + doğrulama rozeti, bio, social linkler,
 * takipçi sayısı, Takip Et butonu.
 */
export function OrganizerHeader({ organizer }: Props) {
  const initial = (organizer.name || organizer.handle || 'O')[0].toUpperCase()
  const isVerified = !!organizer.verified_at

  return (
    <header className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-start gap-5">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-3xl sm:text-4xl font-bold flex items-center justify-center shadow-sm">
            {initial}
          </div>
        </div>

        {/* Bilgi */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{organizer.name || 'İsimsiz'}</h1>
            {isVerified && <VerifiedBadge size="lg" />}
          </div>
          {organizer.handle && (
            <p className="text-sm text-gray-500 mb-2">@{organizer.handle}</p>
          )}
          {organizer.bio && (
            <p className="text-sm text-gray-700 mb-3 whitespace-pre-line">{organizer.bio}</p>
          )}

          {/* Social linkler */}
          {(organizer.website || organizer.twitter || organizer.github) && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
              {organizer.website && (
                <a
                  href={normalizeUrl(organizer.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-indigo-600 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 000 18M12.5 3a17 17 0 010 18" />
                  </svg>
                  {trimUrl(organizer.website)}
                </a>
              )}
              {organizer.twitter && (
                <a
                  href={`https://twitter.com/${organizer.twitter.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-indigo-600 transition-colors"
                >
                  𝕏 @{organizer.twitter.replace(/^@/, '')}
                </a>
              )}
              {organizer.github && (
                <a
                  href={`https://github.com/${organizer.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-indigo-600 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 .5C5.4.5 0 5.9 0 12.5c0 5.3 3.4 9.8 8.2 11.4.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2.9-.3 1.9-.4 2.9-.4s2 .1 2.9.4c2.3-1.6 3.3-1.2 3.3-1.2.7 1.7.3 2.9.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.5-2.7 5.4-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6C20.6 22.3 24 17.8 24 12.5 24 5.9 18.6.5 12 .5z" />
                  </svg>
                  {organizer.github}
                </a>
              )}
            </div>
          )}

          {/* Takipçi + Takip butonu */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={`/organizator/${organizer.handle ?? ''}#takipciler`}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span className="font-semibold text-gray-900">{organizer.follower_count}</span>{' '}
              takipçi
            </Link>
            {organizer.handle && (
              <FollowButton
                handle={organizer.handle}
                organizerId={organizer.id}
                redirectTo={`/organizator/${organizer.handle}`}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

function normalizeUrl(url: string): string {
  if (!/^https?:\/\//i.test(url)) return `https://${url}`
  return url
}

function trimUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
}
