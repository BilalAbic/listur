import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Browser Supabase client — singleton.
 * Aynı instance'ı döndürür ki AuthContext (ve diğer hook'ların)
 * useEffect dependency'leri stable kalsın, sonsuz re-render olmasın.
 */
type Client = ReturnType<typeof createBrowserClient<Database>>
let cachedClient: Client | undefined

export function createClient(): Client {
  if (cachedClient) return cachedClient
  cachedClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return cachedClient
}
