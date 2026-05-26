# CLAUDE.md — Listur
Bu dosya Claude Code'un her oturumda okuması gereken ana referans belgesidir.
Projeye başlamadan önce bu dosyayı tamamen oku.

---

## Proje Nedir
**Listur** — Türkiye'deki teknoloji ve topluluk etkinliklerini (hackathon, meetup, workshop, konferans) tek platformda toplayan, kullanıcıların ilgi alanına göre kişiselleştiren web uygulaması.

Tam gereksinimler için: `docs/platform-srs.md`

---

## Teknoloji Yığını
| Katman       | Teknoloji                         | Versiyon  |
|--------------|-----------------------------------|-----------|
| Framework    | Next.js (App Router, TypeScript)  | 16        |
| Veritabanı   | Supabase (PostgreSQL)             | latest    |
| Auth         | Supabase Auth                     | —         |
| Storage      | Supabase Storage                  | —         |
| AI Parse     | OpenAI GPT-4o                     | gpt-4o    |
| Link Scrape  | metascraper + got                 | latest    |
| Stil         | Tailwind CSS                      | v4        |
| Deploy       | Vercel                            | —         |
| Paket Yönet. | pnpm                              | latest    |

---

## Ortam ve Branch Yapısı
```
Git Branch       Ortam          Supabase Projesi    Vercel
─────────────────────────────────────────────────────────
development  →   Development    listur-dev          Preview
production   →   Production     listur-prod         Production
```

**Kural:** `development` branch'inde geliştir, test et. Stabil olunca `production`'a merge et.
**Asla** production Supabase projesinde doğrudan şema değişikliği yapma.

---

## Proje Dizin Yapısı
```
listur/
├── CLAUDE.md                        ← Bu dosya
├── docs/
│   └── platform-srs.md              ← Tam gereksinimler
├── .env.development                 ← Dev ortam değişkenleri
├── .env.production                  ← Prod ortam değişkenleri
├── .env.local                       ← Lokal override (git'e eklenmez)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── middleware.ts                    ← Rol bazlı rota koruması
│
├── supabase/
│   ├── migrations/                  ← SQL migration dosyaları
│   │   ├── 001_enums.sql
│   │   ├── 002_tables.sql
│   │   ├── 003_rls.sql
│   │   └── 004_storage.sql
│   ├── seed.sql                     ← Dev için örnek veri
│   └── config.toml
│
├── src/
│   ├── app/                         ← Next.js App Router sayfaları
│   │   ├── layout.tsx
│   │   ├── page.tsx                 ← Ana sayfa (/)
│   │   ├── giris/
│   │   │   └── page.tsx
│   │   ├── etkinlik/
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   ├── etkinlik-gonder/
│   │   │   └── page.tsx
│   │   ├── profil/
│   │   │   └── page.tsx
│   │   ├── bildirimler/
│   │   │   └── page.tsx
│   │   ├── moderator/
│   │   │   ├── layout.tsx           ← Moderatör auth guard
│   │   │   ├── page.tsx
│   │   │   ├── bekleyenler/
│   │   │   ├── onayladiklarim/
│   │   │   └── raporlar/
│   │   ├── admin/
│   │   │   ├── layout.tsx           ← Admin auth guard
│   │   │   ├── page.tsx
│   │   │   ├── bekleyenler/
│   │   │   ├── etkinlikler/
│   │   │   ├── raporlar/
│   │   │   └── kullanicilar/
│   │   └── api/
│   │       ├── parse-link/
│   │       │   └── route.ts         ← metascraper + GPT-4o
│   │       ├── events/
│   │       │   └── route.ts
│   │       ├── reports/
│   │       │   └── route.ts
│   │       └── storage/
│   │           └── upload-cover/
│   │               └── route.ts
│   │
│   ├── components/
│   │   ├── ui/                      ← Temel UI bileşenleri (Button, Modal, vb.)
│   │   ├── events/                  ← Etkinlik kartı, liste, filtreler
│   │   ├── forms/                   ← Etkinlik gönderme formu, auth formları
│   │   ├── notifications/           ← Çan ikonu, bildirim listesi
│   │   ├── modals/                  ← İlgi alanı seçimi, rapor, onay modalleri
│   │   └── layout/                  ← Header, Footer, Sidebar
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            ← Browser Supabase client
│   │   │   ├── server.ts            ← Server Supabase client
│   │   │   └── middleware.ts        ← Supabase middleware helper
│   │   ├── ai/
│   │   │   ├── parse-link.ts        ← metascraper + GPT-4o hibrit parse
│   │   │   └── prompts.ts           ← GPT-4o prompt şablonları
│   │   ├── storage/
│   │   │   └── upload-cover.ts      ← OG görseli → Supabase Storage
│   │   └── utils/
│   │       ├── slug.ts              ← Türkçe slug üretimi
│   │       └── html-cleaner.ts      ← GPT-4o için HTML temizleme
│   │
│   ├── types/
│   │   ├── database.ts              ← Supabase otomatik tip üretimi (gen types)
│   │   └── index.ts                 ← Genel tip tanımları
│   │
│   └── hooks/
│       ├── useAuth.ts
│       ├── useInterests.ts          ← localStorage ↔ Supabase senkronizasyonu
│       └── useNotifications.ts
```

---

## Ortam Değişkenleri
`.env.development` ve `.env.production` dosyaları bu şablona göre doldurulmalı:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[proje-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # SADECE server-side kullan

# OpenAI
OPENAI_API_KEY=sk-...                     # SADECE server-side kullan

# Uygulama
NEXT_PUBLIC_APP_URL=https://listur.dev    # Production için
# NEXT_PUBLIC_APP_URL=http://localhost:3000  # Development için
```

**KRİTİK:** `SUPABASE_SERVICE_ROLE_KEY` ve `OPENAI_API_KEY` asla `NEXT_PUBLIC_` öneki almaz. Client bundle'a sızmaz.

---

## Veritabanı
### Migration Kuralları
- Her migration `supabase/migrations/` altında numaralı SQL dosyasıdır.
- Migration'lar sırasıyla çalışır: `001_`, `002_`, `003_`...
- Mevcut migration'ları **asla** düzenleme; yeni migration ekle.
- Dev'de test et, sonra prod'a uygula.

### Komutlar
```bash
# Migration uygula (dev — supabase link ile bağlı proje)
pnpm supabase db push

# TypeScript tipleri üret
pnpm supabase gen types typescript --project-id [ID] --schema public > src/types/database.ts
```

### RLS Kuralları Özeti
```
profiles:   SELECT herkese açık | UPDATE sadece kendisi | admin hepsini görebilir
events:     SELECT published herkese | INSERT kayıtlı | UPDATE/DELETE mod+admin
reports:    INSERT herkese | SELECT/UPDATE mod+admin
moderation_logs: SELECT mod+admin | INSERT server-only | DELETE yok (kimse silemez)
```

### Supabase Storage
```
Bucket: event-covers
  Public okuma: evet
  Klasör yapısı: event-covers/[event-id]/cover.[ext]
  Max boyut: 5MB
  İzin verilen: image/jpeg, image/png, image/webp
```

---

## Yapay Zeka Kullanımı
### Parse Akışı (`/api/parse-link`)
```typescript
// 1. metascraper ile dene
const metadata = await scrapeWithMetascraper(url)
// 2. Eksik kritik alan varsa GPT-4o'ya gönder
const missingFields = getMissingFields(metadata)
if (missingFields.length > 0) {
  const html = await fetchAndCleanHtml(url)
  const aiResult = await parseWithGPT4o(html, missingFields, metadata)
  return mergeResults(metadata, aiResult)
}
return metadata
```

### GPT-4o Kuralları
- Model: `gpt-4o`
- Response format: `json_object`
- Max token (input): 8.000 (HTML temizlendikten sonra)
- Temperature: 0 (deterministik)
- Sadece eksik alanlar için çağır — gereksiz maliyet önlenir
- HTML temizle: `<script>`, `<style>`, `<nav>`, `<footer>` kaldır

### AI KULLANILMAYACAK YERLER
- İçerik moderasyonu → insan moderatör yapar
- Spam tespiti → IP rate limit yeterli
- Kullanıcı öneri sistemi → kategori filtresi yeterli
- Otomatik etkinlik toplama → organizatör onayı şart

---

## Middleware ve Yetkilendirme
`middleware.ts` tüm korumalı rotaları kontrol eder:

```typescript
// Korumalı rotalar ve gerekli roller
const PROTECTED_ROUTES = {
  '/admin':       ['admin'],
  '/moderator':   ['moderator', 'admin'],
  '/profil':      ['user', 'verified_user', 'moderator', 'admin'],
  '/bildirimler': ['user', 'verified_user', 'moderator', 'admin'],
  '/etkinlik-gonder': ['user', 'verified_user', 'moderator', 'admin'],
}
```

Rol hiyerarşisi: `admin > moderator > verified_user > user > guest`

---

## Kodlama Kuralları
### TypeScript
- `any` kullanma; tip bilmiyorsan `unknown` kullan.
- Supabase tipleri için `src/types/database.ts` dosyasını kullan.
- Her fonksiyon ve bileşen için açık tip tanımı yap.

### Bileşenler
- Server Component'ları varsayılan kullan; interaktivite gerektiriyorsa `'use client'` ekle.
- Supabase çağrılarını server component veya API route'larda yap, client'ta yapma.
- Her bileşen tek bir iş yapmalı.

### Supabase
- Browser client: `lib/supabase/client.ts`
- Server client: `lib/supabase/server.ts` (cookies ile)
- `service_role` key: sadece API route'larda, sadece admin işlemleri için.

### API Route'lar
- Her route başında auth kontrolü yap.
- Rol kontrolünü middleware'e bırak, route içinde tekrar yapma.
- Hata yanıtlarını tutarlı format ile döndür: `{ error: string, code: string }`

### Git
- Her faz için ayrı commit.
- Commit mesajları: `feat:`, `fix:`, `chore:`, `refactor:` prefix ile.
- `production` branch'ine direkt push yapma; `development`'tan PR aç.

---

## Sık Kullanılan Komutlar
```bash
# Geliştirme başlat
pnpm dev

# Migration uygula
pnpm supabase db push

# TypeScript tip üret
pnpm supabase gen types typescript --project-id [ID] --schema public > src/types/database.ts

# Build kontrol
pnpm build

# Vercel deploy (preview)
vercel

# Vercel deploy (production)
vercel --prod
```

---

## Önemli Notlar
1. **Görsel akışı:** OG URL'yi direkt kaydetme. Etkinlik onaylandığında `upload-cover` API route'u çağır, Storage'a yükle, CDN URL'sini kaydet.
2. **İlgi alanı senkronizasyonu:** Misafir localStorage'dan kayıt olunca `useInterests` hook'u otomatik Supabase'e taşır. Bu akışı bozmadan geliştir.
3. **Moderatör logları:** `moderation_logs` tablosuna RLS'te DELETE izni verme. Bu audit trail'dir, silinmemelidir.
4. **Slug üretimi:** `lib/utils/slug.ts` Türkçe karakterleri (`ğ→g`, `ü→u`, `ş→s`, `ı→i`, `ö→o`, `ç→c`) dönüştürür. Tüm slug üretimi buradan geçmeli.
5. **Rate limiting:** `/api/reports` endpoint'i için IP bazlı rate limit uygula (10 dakikada 1 rapor).
6. **Environment check:** Her API route'un başında `process.env.NODE_ENV` yerine Supabase URL'sini kontrol et — bu ortamın doğru olduğunu garantiler.

---

*Son güncelleme: Mayıs 2026 — SRS v1.2 ile senkron*
