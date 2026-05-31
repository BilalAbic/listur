import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Env fallback: build prerender (özellikle _not-found, sitemap) sırasında
 * NEXT_PUBLIC_SUPABASE_URL/KEY undefined ise @supabase/ssr throw eder ve
 * build çöker. Placeholder fallback ile build geçer; runtime'da gerçek env
 * tanımlıysa onlar kullanılır.
 */
const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_KEY = 'placeholder-key'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || PLACEHOLDER_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component'ta çağrıldığında cookie set edilemez
            // Bu beklenen bir durumdur — middleware token yenilemeyi halleder
          }
        },
      },
    }
  )
}

/** Service role client — sadece API route'larda kullan */
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || PLACEHOLDER_KEY,
    {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    }
  )
}
