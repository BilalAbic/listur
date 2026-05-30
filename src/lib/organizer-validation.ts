/**
 * Organizatör başvuru ve handle doğrulama yardımcıları.
 * Server-side validation için merkezi.
 */

const HANDLE_REGEX = /^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])?$/

// Sistem rotalarıyla çakışmasın
const RESERVED_HANDLES = new Set([
  'admin', 'api', 'auth', 'login', 'logout', 'giris', 'register', 'kayit',
  'profil', 'profile', 'settings', 'ayarlar', 'about', 'hakkinda',
  'help', 'yardim', 'support', 'destek', 'contact', 'iletisim',
  'terms', 'privacy', 'kvkk', 'gizlilik', 'kosullar',
  'moderator', 'organizator', 'organizer', 'etkinlik', 'event', 'events',
  'bildirimler', 'notifications', 'takvim', 'calendar', 'ara', 'search',
  'kesfet', 'discover', 'trending', 'sana-ozel',
  'static', 'public', 'assets', '_next', 'images', 'img',
  'listur', 'system', 'root', 'support', 'staff', 'official',
])

export interface ApplicationInput {
  requested_handle?: unknown
  bio?: unknown
  website?: unknown
  twitter?: unknown
  github?: unknown
  reason?: unknown
}

export interface ApplicationFields {
  requested_handle: string
  bio: string | null
  website: string | null
  twitter: string | null
  github: string | null
  reason: string | null
}

export type ValidationResult =
  | { ok: true; data: ApplicationFields }
  | { ok: false; error: string; code: string }

/**
 * Başvuru form'unu doğrula ve normalize et.
 */
export function validateApplication(input: ApplicationInput): ValidationResult {
  // Handle
  const rawHandle = typeof input.requested_handle === 'string' ? input.requested_handle.trim().toLowerCase() : ''
  if (!rawHandle) {
    return { ok: false, error: 'Handle gerekli.', code: 'HANDLE_REQUIRED' }
  }
  if (!HANDLE_REGEX.test(rawHandle)) {
    return {
      ok: false,
      error: 'Handle 3-30 karakter; sadece harf, rakam, _ ve - içerebilir.',
      code: 'HANDLE_INVALID',
    }
  }
  if (RESERVED_HANDLES.has(rawHandle)) {
    return { ok: false, error: 'Bu handle rezerve edilmiştir.', code: 'HANDLE_RESERVED' }
  }

  // Bio
  const bio = typeof input.bio === 'string' ? input.bio.trim() : ''
  if (bio.length > 300) {
    return { ok: false, error: 'Bio en fazla 300 karakter olabilir.', code: 'BIO_TOO_LONG' }
  }

  // Reason
  const reason = typeof input.reason === 'string' ? input.reason.trim() : ''
  if (reason.length > 300) {
    return { ok: false, error: 'Neden alanı en fazla 300 karakter olabilir.', code: 'REASON_TOO_LONG' }
  }

  // Website
  const websiteRaw = typeof input.website === 'string' ? input.website.trim() : ''
  let website: string | null = null
  if (websiteRaw) {
    const normalized = websiteRaw.startsWith('http://') || websiteRaw.startsWith('https://')
      ? websiteRaw
      : `https://${websiteRaw}`
    try {
      const u = new URL(normalized)
      if (!['http:', 'https:'].includes(u.protocol)) {
        return { ok: false, error: 'Website URL geçersiz.', code: 'WEBSITE_INVALID' }
      }
      website = u.toString()
    } catch {
      return { ok: false, error: 'Website URL geçersiz.', code: 'WEBSITE_INVALID' }
    }
  }

  // Twitter / github — handle olarak temizle (@ ve URL parçalarını ayıkla)
  const twitter = normalizeSocialHandle(input.twitter)
  const github = normalizeSocialHandle(input.github)

  return {
    ok: true,
    data: {
      requested_handle: rawHandle,
      bio: bio || null,
      reason: reason || null,
      website,
      twitter,
      github,
    },
  }
}

function normalizeSocialHandle(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  // URL ise son segmenti al; @ varsa kaldır
  let handle = trimmed
  if (handle.includes('/')) {
    const parts = handle.split('/').filter(Boolean)
    handle = parts[parts.length - 1] ?? ''
  }
  handle = handle.replace(/^@/, '')

  // Boş veya geçersiz karakter varsa atla
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(handle)) return null
  return handle
}
