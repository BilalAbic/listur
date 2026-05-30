import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/search?q=...&kategori=...&sehir=...&online=true|false
 *
 * Public — login gerekmez. Yayındaki etkinliklerde Türkçe full-text arama.
 *
 * - `q` (zorunlu, ≥2 karakter): websearch_to_tsquery parser ile sorgu.
 *   Kullanıcı "ankara hackathon" gibi doğal cümle yazabilir; AND/OR/"..." OK.
 * - `kategori`, `sehir`: opsiyonel exact match.
 * - `online`: opsiyonel "true"/"false" filter.
 *
 * Response: { results: Event[], total, query, filters }
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const q = url.searchParams.get('q')?.trim() ?? ''
  const kategori = url.searchParams.get('kategori')?.trim() ?? null
  const sehir = url.searchParams.get('sehir')?.trim() ?? null
  const onlineParam = url.searchParams.get('online')

  if (q.length < 2) {
    return NextResponse.json(
      { error: 'Arama sorgusu en az 2 karakter olmalı.', code: 'QUERY_TOO_SHORT' },
      { status: 400 }
    )
  }
  if (q.length > 200) {
    return NextResponse.json(
      { error: 'Arama sorgusu çok uzun.', code: 'QUERY_TOO_LONG' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // Base query — published events
  let query = supabase
    .from('events')
    .select(
      'id, title, slug, description, category, city, is_online, start_date, cover_image, tags, favorite_count, rsvp_count, view_count',
      { count: 'exact' }
    )
    .eq('status', 'published')
    .textSearch('search_vector', q, {
      type: 'websearch',
      config: 'turkish_unaccent',
    })

  if (kategori) query = query.eq('category', kategori)
  if (sehir) query = query.eq('city', sehir)
  if (onlineParam === 'true') query = query.eq('is_online', true)
  else if (onlineParam === 'false') query = query.eq('is_online', false)

  // Önce yaklaşan etkinlikleri ön plana çıkar, sonra tarihe göre
  query = query.order('start_date', { ascending: true }).limit(50)

  const { data, error, count } = await query

  if (error) {
    console.error('[api/search] failed:', error)
    return NextResponse.json(
      { error: 'Arama başarısız.', code: 'SEARCH_FAILED' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    query: q,
    filters: { kategori, sehir, online: onlineParam },
    total: count ?? 0,
    results: data ?? [],
  })
}
