import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseEventLink } from '@/lib/ai/parse-link'

export async function POST(request: NextRequest) {
  // Auth kontrolü — sadece giriş yapmış kullanıcılar
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Bu işlem için giriş yapmanız gerekiyor.', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  // URL al
  let url: string
  try {
    const body = await request.json()
    url = body.url
    new URL(url) // URL geçerliliğini kontrol et
  } catch {
    return NextResponse.json(
      { error: 'Geçerli bir URL girin.', code: 'INVALID_URL' },
      { status: 400 }
    )
  }

  if (!url) {
    return NextResponse.json(
      { error: 'URL zorunludur.', code: 'MISSING_URL' },
      { status: 400 }
    )
  }

  // Parse et
  try {
    const result = await parseEventLink(url)
    return NextResponse.json(result)
  } catch (error) {
    console.error('parse-link error:', error)
    return NextResponse.json(
      { error: 'Link parse edilemedi. Manuel doldurabilirsiniz.', code: 'PARSE_FAILED' },
      { status: 422 }
    )
  }
}
