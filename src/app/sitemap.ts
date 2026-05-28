import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * baseUrl çözümleme öncelik sırası:
 * 1. NEXT_PUBLIC_APP_URL (manuel set — production custom domain için)
 * 2. VERCEL_URL (Vercel her deploy'da otomatik set eder — preview için doğru)
 * 3. Fallback (son çare — production fallback)
 */
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://listur.dev'
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl()

  const supabaseAdmin = createAdminClient()
  const { data: events } = await supabaseAdmin
    .from('events')
    .select('slug, created_at, start_date')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const eventUrls: MetadataRoute.Sitemap = (events ?? []).map((event) => ({
    url: `${baseUrl}/etkinlik/${event.slug}`,
    lastModified: new Date(event.created_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/giris`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    ...eventUrls,
  ]
}
