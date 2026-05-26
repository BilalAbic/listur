/**
 * GPT-4o'ya göndermeden önce HTML içeriğini temizler.
 * - script, style, nav, footer, header, aside taglarını kaldırır
 * - Gereksiz boşlukları sıkıştırır
 * - Max 15.000 karakter (~8.000 token) ile kırpar
 */
export function cleanHtmlForAI(html: string, maxChars = 15_000): string {
  let cleaned = html
    // Gürültülü tagları kaldır
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
    .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '')
    // HTML taglarını kaldır, metin içeriğini koru
    .replace(/<[^>]+>/g, ' ')
    // HTML entity decode (temel)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Çoklu boşluk/satır temizle
    .replace(/\s+/g, ' ')
    .trim()

  // Token limitini aş → kırp
  if (cleaned.length > maxChars) {
    cleaned = cleaned.slice(0, maxChars) + '...'
  }

  return cleaned
}
