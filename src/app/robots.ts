import { MetadataRoute } from 'next'

/**
 * baseUrl çözümleme öncelik sırası:
 * 1. NEXT_PUBLIC_APP_URL (manuel set — production custom domain için)
 * 2. VERCEL_URL (Vercel her deploy'da otomatik set eder — preview için doğru)
 * 3. Fallback
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

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/moderator/', '/profil/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
