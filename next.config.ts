import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage CDN
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Etkinlik sitelerinin OG görselleri için geniş izin
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Native Node.js modülleri ve metascraper paketlerini bundle etme
  // re2, got gibi native/CJS modüller Turbopack ile bundle edilemiyor
  serverExternalPackages: [
    're2',
    'metascraper',
    'metascraper-title',
    'metascraper-description',
    'metascraper-image',
    'metascraper-url',
    'metascraper-date',
    'metascraper-publisher',
    'got',
  ],
}

export default nextConfig
