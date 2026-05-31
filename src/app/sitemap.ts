import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { getBaseUrl } from '@/lib/site'

// Build sırasında prerender denemesin — runtime'da gerçek env ile çalışır.
// Hem yeni eklenen etkinliklerin sitemap'e hızlı düşmesini hem build'in
// placeholder env'lerle de geçebilmesini sağlar.
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // saatte bir yeniden üret (cache hit'inde)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl()

  const staticUrls: MetadataRoute.Sitemap = [
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
    {
      url: `${baseUrl}/kesfet/trending`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
  ]

  // Env yoksa veya Supabase erişilemiyorsa sadece statik URL'leri dön —
  // sitemap.xml hiç olmamaktansa eksik olsun.
  try {
    const supabaseAdmin = createAdminClient()
    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select('slug, created_at, start_date')
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (error || !events) return staticUrls

    const eventUrls: MetadataRoute.Sitemap = events.map((event) => ({
      url: `${baseUrl}/etkinlik/${event.slug}`,
      lastModified: new Date(event.created_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    return [...staticUrls, ...eventUrls]
  } catch (err) {
    console.warn('[sitemap] Supabase fetch failed, returning static URLs only:', err)
    return staticUrls
  }
}
