import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Browser Supabase client — singleton.
 * Aynı instance'ı döndürür ki AuthContext (ve diğer hook'ların)
 * useEffect dependency'leri stable kalsın, sonsuz re-render olmasın.
 *
 * Env fallback: NEXT_PUBLIC_SUPABASE_URL/KEY undefined ise build sırasında
 * (özellikle _not-found ve layout prerender'da) @supabase/ssr "URL and API
 * key required" throw eder ve build çöker. Placeholder fallback ile build
 * geçer; runtime'da gerçek env tanımlıysa o kullanılır.
 */
const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_KEY = 'placeholder-key'

type Client = ReturnType<typeof createBrowserClient<Database>>
let cachedClient: Client | undefined

export function createClient(): Client {
  if (cachedClient) return cachedClient
  cachedClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || PLACEHOLDER_KEY
  )
  return cachedClient
}
