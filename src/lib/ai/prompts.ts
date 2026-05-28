/**
 * GPT-4o için prompt şablonları.
 * Temperature: 0 → deterministik sonuç
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
  return `Sen bir etkinlik bilgisi çıkarma asistanısın.
Aşağıdaki HTML sayfasından etkinlik bilgilerini JSON formatında çıkar.
Sadece kesin bilinen alanları doldur, tahmin etme.
Tarihler için ISO 8601 kullan (YYYY-MM-DDTHH:mm:ss).

Çıkarılacak alanlar:
- title (string)
- description (string, max 500 karakter)
- start_date (ISO 8601 | null)
- end_date (ISO 8601 | null)
- city (string | null) — Türkiye şehri, online ise null
- is_online (boolean)
- venue_name (string | null) — mekan adı
- category (şu değerlerden biri: "Blockchain / Web3" | "Yapay Zeka / ML" | "Mobil Geliştirme" | "Backend / DevOps" | "Siber Güvenlik" | "Girişimcilik / Startup" | "Tasarım / UX" | "Oyun Geliştirme" | "Veri Bilimi" | "Açık Kaynak" | "Diğer")
- registration_url (string | null) — kayıt/bilet linki

Sadece EKSİK olan alanları doldur. Mevcut değerlere dokunma. null olan alanlar eksiktir.

Mevcut değerler:
${JSON.stringify(existing, null, 2)}

HTML:
${cleanedHtml}`
}
