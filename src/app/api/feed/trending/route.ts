import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTrendingFeed } from '@/lib/feeds'

/**
 * GET /api/feed/trending?limit=20
 *
 * Public — login gerekmez. Engagement skoruna göre sıralı yaklaşan
 * etkinlikler. Sayaçlar denormalize (Sprint 1) — JOIN gerekmez.
 *
 * Score = view_count * 1 + favorite_count * 3 + rsvp_count * 5
 *
 * Cache: 5 dakika CDN cache + 1 dakika browser cache. Engagement skoru
 * sık değişir ama trending sıralama dakikalık takip gerektirmez.
 *
 * Response: { results: ScoredEvent[], count, generatedAt }
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const limitParam = url.searchParams.get('limit')

  // limit: 1-50 arası, default 20
  let limit = 20
  if (limitParam) {
    const parsed = parseInt(limitParam, 10)
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 50) {
      limit = parsed
    }
  }

  const supabase = await createClient()
  const results = await getTrendingFeed(supabase, { limit })

  return NextResponse.json(
    {
      results,
      count: results.length,
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    }
  )
}
