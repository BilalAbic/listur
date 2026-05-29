/**
 * Site URL çözümleme — tüm sayfa/route'lar için tek kaynak.
 *
 * Öncelik sırası:
 * 1. `NEXT_PUBLIC_APP_URL` — Manuel set edilmiş (production custom domain için).
 *    `localhost` içeriyorsa atlanır (yerel `pnpm dev` dışında anlamsız).
 * 2. `VERCEL_BRANCH_URL` — Vercel system env (stabil branch alias).
 *    Örn: `listur-git-development-bilalabics-projects.vercel.app`
 *    Branch deploy'larında her zaman aynı URL ile erişilir.
 *    Bkz: https://vercel.com/docs/environment-variables/system-environment-variables
 * 3. `VERCEL_URL` — Her deploy'un benzersiz URL'i.
 *    Preview deploy'larda branch alias dışındaki spesifik commit URL'i.
 * 4. `https://listur.dev` — Son fallback (build-time / lokal test için).
 *
 * Bu helper'ı kullan, doğrudan `process.env.NEXT_PUBLIC_APP_URL` çağırma —
 * Vercel Preview env'inde yanlış değer set edildiğinde tek noktada düzeltilir.
 */
export function getBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL
  if (explicit && !explicit.includes('localhost')) {
    return stripTrailingSlash(explicit)
  }

  if (process.env.VERCEL_BRANCH_URL) {
    return `https://${process.env.VERCEL_BRANCH_URL}`
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Lokal `pnpm dev` için NEXT_PUBLIC_APP_URL=http://localhost:3000 set edilmiş
  // olabilir; bu durumda explicit'i kullan (yukarıda localhost'u skip ettik).
  if (explicit) return stripTrailingSlash(explicit)

  return 'https://listur.dev'
}

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}
