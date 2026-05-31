import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(`${origin}/giris?error=no_code`)
  }

  // Response objesi ÖNCE oluşturulur — setAll bu response'a cookie yazar.
  // Eski yöntemde cookieStore.set() implicit response'a yazıyor,
  // NextResponse.redirect() ise ayrı bir response döndürüyordu: cookies kayboluyordu.
  const successResponse = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Cookie'leri doğrudan döndüreceğimiz response'a yaz
          cookiesToSet.forEach(({ name, value, options }) =>
            successResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(`${origin}/giris?error=session_exchange_failed`)
  }

  // successResponse zaten auth cookie'lerini taşıyor
  return successResponse
}
