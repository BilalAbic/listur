<div align="center">

# 🎯 Listur

**Türkiye'nin Teknoloji Etkinlik Platformu**

Hackathon, meetup, workshop ve konferansları keşfet. Toplulukla buluş.

[![CI](https://github.com/BilalAbic/listur/actions/workflows/ci.yml/badge.svg?branch=development)](https://github.com/BilalAbic/listur/actions/workflows/ci.yml)
[![CodeQL](https://github.com/BilalAbic/listur/actions/workflows/codeql.yml/badge.svg)](https://github.com/BilalAbic/listur/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[**🌐 Canlı Site**](https://listur.bilalabic.com) · [**🧪 Dev Preview**](https://listur-git-development-bilalabics-projects.vercel.app) · [**📋 SRS Dokümanı**](docs/platform-srs.md)

</div>

---

## 📖 Proje Hakkında

Listur, Türkiye'deki teknoloji ve topluluk etkinliklerini tek bir platformda toplayan, kullanıcıların ilgi alanına göre kişiselleştiren açık kaynaklı bir web uygulamasıdır.

**Hedef kitle:** Geliştirici, tasarımcı, girişimci ve topluluk üyeleri.

**Temel fikir:** Etkinlik arayan herkes hangi etkinliğin nerede, ne zaman olduğunu kolayca bulsun. Organizatörler minimal çabayla etkinliklerini platforma ekleyebilsin.

---

## ✨ Özellikler

### Keşif & Kişiselleştirme
- 🎯 **İlgi alanı bazlı sıralama** — Misafir (localStorage) ve kayıtlı kullanıcı (Supabase) desteği
- 🗺️ **Gelişmiş filtreler** — Kategori, şehir, tarih aralığı, online/yüz yüze
- 📅 **Takvim görünümü** — Etkinlikleri aylık takvimde görüntüle
- 🔍 **SEO dostu** — SSR, sitemap, Open Graph meta tag'leri

### Etkinlik Yönetimi
- 🔗 **Akıllı link parse** — metascraper → GPT-4o fallback → manuel düzeltme
- 📝 **Etkinlik gönderme** — Link yapıştır, otomatik bilgi çekme, önizleme ve gönder
- 🖼️ **Görsel yönetimi** — OG görseli otomatik Supabase Storage'a yüklenir (CDN)

### Etkileşim
- ❤️ **Favoriler** — Beğendiğin etkinlikleri kaydet
- 📋 **RSVP** — Katılım durumu: Gideceğim / İlgileniyorum / Gitmeyeceğim
- 👁️ **Görüntülenme sayacı** — Günlük unique view takibi (kayıtlı + anonim)
- 📤 **Takvim export** — .ics dosyası ile Google Calendar / Apple Calendar'a ekle
- ⏰ **Hatırlatıcılar** — Etkinlikten 24 saat ve 1 saat önce otomatik bildirim (Vercel Cron)

### Organizatör Hub
- 👤 **Organizatör profili** — Handle, bio, sosyal linkler, verified badge
- 📊 **Organizatör dashboard** — Etkinlik istatistikleri, takipçi sayısı
- 👥 **Takip sistemi** — Organizatörleri takip et, yeni etkinlik bildirimi al
- ✅ **Doğrulama akışı** — Başvuru → Admin inceleme → Verified organizatör

### Moderasyon & Güvenlik
- 🛡️ **Moderatör paneli** — Onay/red/düzenleme + audit log
- 🏢 **Admin paneli** — Kullanıcı yönetimi, rol atama, tüm raporlar
- 🚩 **İçerik raporlama** — Herkes (misafir dahil) uygunsuz içerik bildirebilir
- 🔔 **Bildirim sistemi** — 7 farklı bildirim tipi (in-app)
- 🔐 **4 kullanıcı rolü** — `user` → `verified_user` → `moderator` → `admin`
- 🔒 **Row Level Security** — Tüm tablolarda satır bazlı erişim kontrolü

---

## 🛠️ Teknoloji Stack

| Katman | Teknoloji | Versiyon |
|--------|-----------|----------|
| Framework | [Next.js](https://nextjs.org) (App Router, TypeScript) | 16 |
| UI | [React](https://react.dev) | 19 |
| Stil | [Tailwind CSS](https://tailwindcss.com) | v4 |
| Veritabanı | [Supabase](https://supabase.com) (PostgreSQL + RLS) | latest |
| Auth | Supabase Auth (email + magic link) | — |
| Storage | Supabase Storage (CDN) | — |
| AI | [OpenAI GPT-4o](https://openai.com) (link parse fallback) | gpt-4o |
| Scraping | [metascraper](https://github.com/microlinkhq/metascraper) + [got](https://github.com/sindresorhq/got) | latest |
| Deploy | [Vercel](https://vercel.com) (Turbopack build) | — |
| CI/CD | [GitHub Actions](https://github.com/features/actions) | — |
| Paket Yöneticisi | [pnpm](https://pnpm.io) | latest |

---

## 🚀 Kurulum

### Ön Gereksinimler

- [Node.js](https://nodejs.org) v20+
- [pnpm](https://pnpm.io) v9+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (opsiyonel, lokal DB için)

### Adımlar

```bash
# 1. Repo'yu klonla
git clone https://github.com/BilalAbic/listur.git
cd listur

# 2. Bağımlılıkları yükle
pnpm install

# 3. Ortam değişkenlerini ayarla
cp .env.development.example .env.local
# .env.local dosyasını düzenle — aşağıdaki tabloya bak

# 4. (Opsiyonel) Lokal Supabase başlat
pnpm supabase start
pnpm supabase db push

# 5. Geliştirme sunucusunu başlat
pnpm dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini aç.

---

## ⚙️ Ortam Değişkenleri

| Değişken | Gerekli | Açıklama | Güvenlik |
|----------|---------|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase proje URL'i | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon (public) key | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key | 🔒 Server-only |
| `OPENAI_API_KEY` | ✅ | OpenAI API key (GPT-4o parse) | 🔒 Server-only |
| `NEXT_PUBLIC_APP_URL` | ✅ | Uygulama base URL | Public |
| `CRON_SECRET` | ⚠️ | Vercel Cron Job auth token | 🔒 Server-only |

> **⚠️ Güvenlik:** `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` ve `CRON_SECRET` asla `NEXT_PUBLIC_` öneki almaz. Bu değişkenler sadece server-side API route'larda kullanılır.

---

## 🌿 Branch Akışı & Deploy

```
development ──→ Vercel Preview  (listur-dev Supabase)
production  ──→ Vercel Production (listur-prod Supabase)
main        ──→ Deploy devre dışı
```

### Geliştirme Döngüsü

```bash
# 1. Issue aç
gh issue create --title "feat: yeni özellik" --label "enhancement"

# 2. Branch oluştur (issue'ya bağlı)
gh issue develop <ISSUE_NO> --checkout

# 3. Geliştir ve commit at
git commit -m "feat(scope): açıklama

Refs #<ISSUE_NO>"

# 4. PR aç (base: development)
gh pr create --base development

# 5. Merge (squash)
gh pr merge --squash --delete-branch
```

**Kurallar:**
- `production` branch'ine direkt push yasak — PR zorunlu
- Commit mesajı formatı: `<tip>(<kapsam>): <açıklama>` + `Refs #N`
- Tipler: `feat` | `fix` | `ui` | `docs` | `refactor` | `test` | `chore`

---

## 📁 Proje Yapısı

```
listur/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Ana sayfa — etkinlik listesi + filtreler
│   │   ├── giris/                    # Giriş / Kayıt
│   │   ├── etkinlik/[slug]/          # Etkinlik detay sayfası
│   │   ├── etkinlik-gonder/          # Etkinlik gönderme formu
│   │   ├── takvim/                   # Takvim görünümü
│   │   ├── profil/                   # Kullanıcı profili
│   │   │   ├── organizator/          # Organizatör dashboard
│   │   │   └── organizator-basvuru/  # Organizatör başvurusu
│   │   ├── organizator/[handle]/     # Organizatör public profili
│   │   ├── bildirimler/              # Bildirim listesi
│   │   ├── moderator/                # Moderatör paneli (3 alt sayfa)
│   │   ├── admin/                    # Admin paneli (5 alt sayfa)
│   │   ├── auth/callback/            # Supabase auth callback
│   │   └── api/                      # API Routes
│   │       ├── parse-link/           # metascraper + GPT-4o parse
│   │       ├── events/               # Etkinlik CRUD + onay/red/kaldır
│   │       ├── reports/              # Raporlama
│   │       ├── notifications/        # Bildirim yönetimi
│   │       ├── organizers/           # Organizatör başvuru + lookup
│   │       ├── users/                # Kullanıcı yönetimi (rol atama)
│   │       ├── storage/              # Kapak görseli yükleme
│   │       └── cron/reminders/       # Saatlik hatırlatıcı cron
│   │
│   ├── components/                   # UI Bileşenleri
│   │   ├── engagement/               # FavoriteButton, RsvpButton, CalendarExport
│   │   ├── events/                   # EventCard, EventFilters, ShareButtons
│   │   ├── forms/                    # AuthForm, EventSubmitForm
│   │   ├── layout/                   # Header
│   │   ├── modals/                   # InterestsModal, ReportModal
│   │   ├── moderation/               # PendingList, ReportsList, UsersList
│   │   ├── notifications/            # NotificationPageList
│   │   └── organizers/               # OrganizerCard, FollowButton, VerifiedBadge
│   │
│   ├── lib/                          # Yardımcı Kütüphaneler
│   │   ├── supabase/                 # Client (browser + server + middleware)
│   │   ├── ai/                       # parse-link.ts + prompts.ts
│   │   ├── storage/                  # upload-cover.ts
│   │   ├── utils/                    # slug.ts, html-cleaner.ts
│   │   ├── calendar.ts              # .ics export yardımcıları
│   │   ├── organizer-validation.ts  # Organizatör doğrulama
│   │   └── site.ts                  # Base URL çözümleme
│   │
│   ├── types/                        # TypeScript Tipleri
│   │   ├── database.ts              # Supabase otomatik tip üretimi
│   │   └── index.ts                 # Genel tip tanımları
│   │
│   ├── context/                      # React Context
│   │   └── AuthContext.tsx           # Auth state yönetimi
│   │
│   └── hooks/                        # Custom Hooks
│       ├── useAuth.ts
│       ├── useFavorites.ts
│       ├── useFollows.ts
│       ├── useInterests.ts          # localStorage ↔ Supabase sync
│       ├── useNotifications.ts
│       └── useRsvps.ts
│
├── supabase/
│   ├── migrations/                   # SQL migration dosyaları (001-007)
│   ├── seed.sql                     # Dev için örnek veri
│   └── config.toml
│
├── middleware.ts                     # Rol bazlı rota koruması
├── vercel.json                      # Vercel config + cron tanımı
└── docs/
    └── platform-srs.md              # Detaylı SRS dokümanı
```

---

## 🗄️ Veritabanı Şeması

Proje 10 tablo ve 8 enum tipi içerir. Detaylı şema için [platform-srs.md](docs/platform-srs.md) dosyasına bakın.

### Tablolar

| Tablo | Açıklama |
|-------|----------|
| `profiles` | Kullanıcı profilleri (rol, ilgi alanları, organizatör bilgileri) |
| `events` | Etkinlikler (başlık, tarih, konum, durum, engagement sayaçları) |
| `submissions` | Etkinlik gönderimleri (parse kaynağı, gönderen) |
| `notifications` | Bildirimler (7 tip) |
| `reports` | İçerik raporları (sebep, durum) |
| `moderation_logs` | Moderasyon audit trail (**silinemez**) |
| `favorites` | Kullanıcı favorileri |
| `rsvps` | RSVP kayıtları (going/interested/not_going) |
| `event_views` | Görüntülenme kayıtları (unique/gün) |
| `organizer_follows` | Takip ilişkileri |
| `organizer_applications` | Organizatör başvuruları |

### Migration Dosyaları

```
supabase/migrations/
├── 001_enums.sql              # Enum tipleri
├── 002_tables.sql             # Ana tablolar + trigger'lar
├── 003_rls.sql                # Row Level Security politikaları
├── 004_storage.sql            # Storage bucket tanımı
├── 005_engagement.sql         # Favoriler, RSVP, view, sayaç trigger'ları
├── 006_calendar_reminders.sql # Hatırlatıcı bildirim tipi
└── 007_organizer_hub.sql      # Organizatör profil, takip, başvuru
```

---

## 🧪 CI/CD

Proje 5 GitHub Actions workflow'u ile korunur:

| Workflow | Tetikleyici | İşlev |
|----------|-------------|-------|
| **CI** (`ci.yml`) | PR → `development`, `production` | ESLint (reviewdog) + TypeScript check + Turbopack build |
| **CodeQL** (`codeql.yml`) | PR + schedule | Güvenlik açığı tarama |
| **Secret Scan** (`secret-scan.yml`) | PR | Secret leak tespiti |
| **Deps** (`deps.yml`) | Schedule | Bağımlılık güncelleme |
| **E2E** (`e2e.yml`) | PR | End-to-end test |

### Lokal Kontrol

```bash
# Lint
pnpm lint

# TypeScript kontrol
pnpm exec tsc --noEmit

# Build (Turbopack)
pnpm build
```

---

## 📸 Ekran Görüntüleri

> 🚧 Ekran görüntüleri yakında eklenecek. Canlı siteyi ziyaret etmek için: [listur.bilalabic.com](https://listur.bilalabic.com)

<!--
Planlanmış görseller:
- Ana sayfa (etkinlik listesi + filtreler)
- Etkinlik detay sayfası
- Takvim görünümü
- Etkinlik gönderme formu
- Organizatör profili
- Admin paneli
- Moderatör paneli
- Bildirimler
-->

---

## 🤝 Katkıda Bulunma

Katkılarınızı memnuniyetle karşılıyoruz! İşte başlamanın yolu:

### Issue Aç

Her katkı bir issue ile başlar:

```bash
gh issue create --title "feat: yeni özellik açıklaması" --label "enhancement"
```

### Geliştirme Adımları

1. **Fork** yapın ve repo'yu klonlayın
2. `development` branch'inden yeni branch oluşturun:
   ```bash
   git checkout development
   git checkout -b feat/yeni-ozellik
   ```
3. Değişikliklerinizi yapın ve commit atın:
   ```bash
   git commit -m "feat(scope): kısa açıklama

   Detaylı açıklama.

   Refs #<ISSUE_NO>"
   ```
4. PR açın (`development` branch'ine):
   ```bash
   gh pr create --base development
   ```

### Commit Mesajı Formatı

```
<tip>(<kapsam>): <kısa açıklama>

<neden bu değişikliği yaptın>

Refs #N
```

| Tip | Kullanım |
|-----|----------|
| `feat` | Yeni özellik |
| `fix` | Hata düzeltme |
| `ui` | Görsel / arayüz değişikliği |
| `docs` | Belgeleme |
| `refactor` | Mantık değişmeden yeniden yapı |
| `test` | Test ekle / düzelt |
| `chore` | Build, bağımlılık, config |

### PR Kuralları

- PR hedefi her zaman `development` branch'idir
- CI kontrolleri (lint + type check + build) geçmeli
- Merge yöntemi: **squash merge** + branch silme

---

## 📚 Belgeleme

| Doküman | Açıklama |
|---------|----------|
| [platform-srs.md](docs/platform-srs.md) | Detaylı yazılım gereksinimleri (SRS v1.2) |
| [CLAUDE.md](CLAUDE.md) | AI asistan için proje referans belgesi |

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır.

---

<div align="center">

**[Listur](https://listur.bilalabic.com)** ile Türkiye'nin teknoloji etkinliklerini keşfet 🚀

</div>
