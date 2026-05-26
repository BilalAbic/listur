import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage CDN (dev)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Yaygın etkinlik siteleri OG görselleri için
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Sunucu taraflı environment değişkenlerini sızdırma kontrolü
  // SUPABASE_SERVICE_ROLE_KEY ve OPENAI_API_KEY hiçbir zaman
  // NEXT_PUBLIC_ öneki almamalıdır.
}

export default nextConfig
