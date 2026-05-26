/**
 * GPT-4o i?in prompt ?ablonlar?.
 * Temperature: 0 ? deterministik sonu?
 * Response format: json_object
 */

export interface ExistingFields {
  title?: string | null
  description?: string | null
  start_date?: string | null
  end_date?: string | null
  city?: string | null
  is_online?: boolean
  venue_name?: string | null
  category?: string | null
  registration_url?: string | null
}

export function buildParsePrompt(cleanedHtml: string, existing: ExistingFields): string {
  return `Sen bir etkinlik bilgisi ??karma asistan?s?n.
A?a??daki HTML sayfas?ndan etkinlik bilgilerini JSON format?nda ??kar.
Sadece kesin bilinen alanlar? doldur, tahmin etme.
Tarihler i?in ISO 8601 kullan (YYYY-MM-DDTHH:mm:ss).

??kar?lacak alanlar:
- title (string)
- description (string, max 500 karakter)
- start_date (ISO 8601 | null)
- end_date (ISO 8601 | null)
- city (string | null) ? T?rkiye ?ehri, online ise null
- is_online (boolean)
- venue_name (string | null) ? mekan ad?
- category (?u de?erlerden biri: "Blockchain / Web3" | "Yapay Zeka / ML" | "Mobil Geli?tirme" | "Backend / DevOps" | "Siber G?venlik" | "Giri?imcilik / Startup" | "Tasar?m / UX" | "Oyun Geli?tirme" | "Veri Bilimi" | "A??k Kaynak" | "Di?er")
- registration_url (string | null) ? kay?t/bilet linki

Sadece EKS?K olan alanlar? doldur. Mevcut de?erlere dokunma. null olan alanlar eksiktir.

Mevcut de?erler:
${JSON.stringify(existing, null, 2)}

HTML:
${cleanedHtml}`
}
