import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Korumalı rotalar ve erişim için gereken minimum roller.
 * Rol hiyerarşisi: admin > moderator > verified_user > user > guest
 */
const PROTECTED_ROUTES: Record<string, string[]> = {
  '/admin': ['admin'],
  '/moderator': ['moderator', 'admin'],
  '/profil': ['user', 'verified_user', 'moderator', 'admin'],
  '/bildirimler': ['user', 'verified_user', 'moderator', 'admin'],
  '/etkinlik-gonder': ['user', 'verified_user', 'moderator', 'admin'],
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  // Korumalı rota mu kontrol et
  const matchedRoute = Object.keys(PROTECTED_ROUTES).find((route) =>
    pathname.startsWith(route)
  )

  if (matchedRoute) {
    // Giriş yapmamış kullanıcı → giriş sayfasına yönlendir
    if (!user) {
      const loginUrl = new URL('/giris', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Kullanıcı rolünü profiles tablosundan al
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role ?? 'user'
    const allowedRoles = PROTECTED_ROUTES[matchedRoute]

    // Yetersiz rol → ana sayfaya yönlendir
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Şunlar hariç tüm route'ları eşleştir:
     * - _next/static (statik dosyalar)
     * - _next/image (görsel optimizasyonu)
     * - favicon.ico, public/ dosyalar
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
