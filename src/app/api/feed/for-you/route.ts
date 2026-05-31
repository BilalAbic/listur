import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getForYouFeed } from '@/lib/feeds'

/**
 * GET /api/feed/for-you?limit=30
 *
 * Login REQUIRED — kişiselleştirilmiş feed.
 * - interests (kategori): +5 ağırlık
 * - takip edilen organizatör: +10 ağırlık
 * - engagement boost: skor * 0.1
 *
 * Cache: yok (kullanıcıya özel; CDN'de saklanamaz).
 *
 * Response: 200 { results, count, generatedAt }
 *           401 { error, code }
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const limitParam = url.searchParams.get('limit')

  let limit = 30
  if (limitParam) {
    const parsed = parseInt(limitParam, 10)
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 50) {
      limit = parsed
    }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Bu özellik giriş yapan kullanıcılar içindir.', code: 'AUTH_REQUIRED' },
      { status: 401 }
    )
  }

  const results = await getForYouFeed(supabase, user.id, { limit })

  return NextResponse.json(
    {
      results,
      count: results.length,
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        // Kullanıcıya özel — CDN cache YOK, sadece tarayıcı kısa süre cache
        'Cache-Control': 'private, max-age=60',
      },
    }
  )
}
