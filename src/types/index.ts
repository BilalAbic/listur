/**
 * Genel tip tanımları — database.ts'den türetilmiş yardımcı tipler.
 * database.ts dosyası `pnpm supabase gen types` ile otomatik üretilir.
 */

// Kullanıcı rolleri
export type UserRole = 'user' | 'verified_user' | 'moderator' | 'admin'

// Etkinlik durumları
export type EventStatus = 'pending' | 'published' | 'rejected' | 'removed'

// Bildirim tipleri
export type NotifType = 'new_event' | 'submission_approved' | 'submission_rejected' | 'report_resolved'

// Parse kaynağı
export type ParseSourceType = 'og' | 'gpt4o' | 'manual'

// Rapor sebepleri
export type ReportReason = 'misleading' | 'spam' | 'irrelevant' | 'inappropriate' | 'other'

// Rapor durumu
export type ReportStatus = 'open' | 'resolved'

// Moderasyon aksiyonu
export type ModAction = 'approved' | 'rejected' | 'removed' | 'edited'

// İlgi alanı kategorileri
export const INTEREST_CATEGORIES = [
  'Blockchain / Web3',
  'Yapay Zeka / ML',
  'Mobil Geliştirme',
  'Backend / DevOps',
  'Siber Güvenlik',
  'Girişimcilik / Startup',
  'Tasarım / UX',
  'Oyun Geliştirme',
  'Veri Bilimi',
  'Açık Kaynak',
] as const

export type InterestCategory = (typeof INTEREST_CATEGORIES)[number]

// Parse sonucu tipi (API yanıtı)
export interface ParsedEventData {
  title?: string | null
  description?: string | null
  cover_image?: string | null
  url?: string | null
  start_date?: string | null
  end_date?: string | null
  city?: string | null
  is_online?: boolean
  venue_name?: string | null
  category?: string | null
  registration_url?: string | null
  parse_source: ParseSourceType
}

// API hata yanıtı
export interface ApiError {
  error: string
  code: string
}
