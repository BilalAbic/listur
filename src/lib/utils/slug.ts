/**
 * Türkçe karakterleri dönüştürerek URL-safe slug üretir.
 * Tüm slug üretimi bu fonksiyondan geçmelidir.
 */
export function generateSlug(title: string, existingSlugs?: string[]): string {
  let slug = title
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/û/g, 'u')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-+|-+$/g, '') // baştaki ve sondaki tire

  if (!slug) {
    slug = 'etkinlik'
  }

  if (!existingSlugs || existingSlugs.length === 0) {
    return slug
  }

  // Çakışma varsa -2, -3, ... ekle
  let candidate = slug
  let counter = 2
  while (existingSlugs.includes(candidate)) {
    candidate = `${slug}-${counter++}`
  }
  return candidate
}
