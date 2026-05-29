import { createAdminClient } from '@/lib/supabase/server'

const BUCKET = 'event-covers'
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

/**
 * OG görsel URL'sini Supabase Storage'a yükler ve CDN URL döndürür.
 * Etkinlik onaylandığında çağrılır.
 */
export async function uploadEventCover(
  eventId: string,
  imageUrl: string
): Promise<string | null> {
  try {
    // Görseli server-side fetch et
    const response = await fetch(imageUrl, {
      signal: AbortSignal.timeout(10_000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Listur/1.0; +https://listur.bilalabic.com)',
      },
    })

    if (!response.ok) return null

    // Content-Type kontrol
    const contentType = response.headers.get('content-type') ?? 'image/jpeg'
    const mimeType = contentType.split(';')[0].trim()

    if (!ALLOWED_TYPES.includes(mimeType)) {
      console.warn('uploadEventCover: izin verilmeyen format:', mimeType)
      return null
    }

    // Buffer'a al
    const buffer = Buffer.from(await response.arrayBuffer())

    // Boyut kontrolü
    if (buffer.byteLength > MAX_SIZE) {
      console.warn('uploadEventCover: görsel çok büyük:', buffer.byteLength)
      return null
    }

    // Uzantı belirle
    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'
    const path = `${eventId}/cover.${ext}`

    // Supabase Storage'a yükle
    const supabase = createAdminClient()
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: true, // Yeniden yükleme halinde üzerine yaz
      })

    if (error) {
      console.error('uploadEventCover storage error:', error)
      return null
    }

    // Public CDN URL'i döndür
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  } catch (error) {
    console.error('uploadEventCover error:', error)
    return null
  }
}
