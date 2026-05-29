# Listur — Yazılım Gereksinimleri Dokümanı (SRS)

> **Proje Adı:** Listur  
> **Sürüm:** 1.2  
> **Tarih:** Mayıs 2026  
> **Stack:** Next.js 15 · Supabase · OpenAI GPT-4o · metascraper  
> **Kapsam:** Türkiye odaklı, web tabanlı etkinlik agregasyon platformu  
> **Ortamlar:** `development` branch → dev Supabase projesi | `production` branch → prod Supabase projesi

---

## 1. Proje Özeti

Türkiye'deki teknoloji ve topluluk etkinliklerini (hackathon, meetup, workshop, konferans vb.) tek bir yerde toplayan, kullanıcının ilgi alanına göre kişiselleştiren ve bildirim gönderen web platformu.

**Temel hedef:** Etkinlik arayan geliştiriciler ve topluluk üyeleri hangi etkinliğin nerede, ne zaman olduğunu kolayca bulsun. Organizatörler minimal çabayla etkinliklerini platforma ekleyebilsin.

**Hedef kitle:** Türkiye'deki geliştirici, tasarımcı, girişimci ve topluluk üyeleri.

---

## 2. Ortam Yapısı

### 2.1 Branch ve Ortam Eşleşmesi

| Git Branch    | Ortam       | Supabase Projesi  | Vercel Ortamı |
|---------------|-------------|-------------------|---------------|
| `development` | Development | `listur-dev`      | Preview       |
| `production`  | Production  | `listur-prod`     | Production    |

### 2.2 Environment Variable Dosyaları

```
.env.development        → development branch için
.env.production         → production branch için
.env.local              → lokal geliştirme (git'e eklenmez)
```

### 2.3 Zorunlu Değişkenler

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # Sadece server-side

# OpenAI
OPENAI_API_KEY=                   # GPT-4o için, sadece server-side

# Uygulama
NEXT_PUBLIC_APP_URL=              # https://listur.bilalabic.com veya http://localhost:3000
```

### 2.4 Görsel Depolama

Etkinlik kapak görselleri **Supabase Storage**'da tutulur.

- Bucket adı: `event-covers`
- Erişim: Public (okuma), authenticated (yazma)
- Akış: Etkinlik onaylandığında kaynak OG görseli server-side fetch edilir → Supabase Storage'a yüklenir → CDN URL `cover_image` alanına kaydedilir
- Boyut limiti: 5 MB per görsel
- Kabul edilen formatlar: jpg, jpeg, png, webp
- Dev ve prod için ayrı bucket'lar (`listur-dev` ve `listur-prod` projelerinin kendi storage'ları)

---

## 3. Yapay Zeka Kullanımı

Listur'da yapay zeka **yalnızca link parse işlemi** için kullanılır. Hibrit bir yaklaşım benimsenmiştir: önce ücretsiz ve hızlı olan yöntem denenir, yetersiz kalırsa GPT-4o devreye girer.

### 3.1 Katman 1 — metascraper + got (Birincil)

**Ne için:** OG ve meta tag'lerden etkinlik bilgisi çekmek.  
**Ne zaman:** Her link gönderiminde ilk olarak çalışır.  
**Maliyet:** Ücretsiz.

```
Çekilen alanlar:
  title         → og:title veya <title>
  description   → og:description veya meta description
  cover_image   → og:image
  url           → og:url veya canonical
  date          → og:article:published_time veya JSON-LD
  publisher     → og:site_name
```

Başarı kriteri: `title`, `description`, `start_date` alanlarının üçü de doluysa GPT-4o çağrılmaz.

### 3.2 Katman 2 — OpenAI GPT-4o (Fallback)

**Ne için:** metascraper'ın dolduramadığı alanları HTML içeriğinden çıkarmak.  
**Ne zaman:** Katman 1'den eksik alan döndüğünde.  
**Model:** `gpt-4o` (json_object response format)  
**Maliyet:** Sadece eksik alan durumunda çağrılır → gereksiz token tüketimi önlenir.

**GPT-4o'ya gönderilecek prompt:**

```
Sen bir etkinlik bilgisi çıkarma asistanısın.
Aşağıdaki HTML sayfasından etkinlik bilgilerini JSON formatında çıkar.
Sadece kesin bilinen alanları doldur, tahmin etme.
Tarihler için ISO 8601 kullan (YYYY-MM-DDTHH:mm:ss).

Çıkarılacak alanlar:
- title (string)
- description (string, max 500 karakter)
- start_date (ISO 8601 | null)
- end_date (ISO 8601 | null)
- city (string | null)
- is_online (boolean)
- venue_name (string | null)
- category (hackathon | meetup | workshop | konferans | diger)
- registration_url (string | null)

Sadece eksik olan alanları doldur. Mevcut değerlere dokunma.
Mevcut değerler: {existing_fields}

HTML:
{cleaned_html}
```

**HTML temizleme (GPT-4o'ya göndermeden önce):**
- `<script>`, `<style>`, `<nav>`, `<footer>`, `<header>` tagları çıkarılır
- HTML → düz metin veya minimal HTML'e indirgenir
- Max 8.000 token'lık içerik gönderilir (ilk 15.000 karakter)

### 3.3 Katman 3 — Manuel Giriş (Son Çare)

Parse başarısız olursa veya kullanıcı isterse tüm alanları kendisi doldurabilir.  
Form Katman 1 ve 2'den gelen verilerle önceden dolu gelir, kullanıcı sadece düzeltir.

### 3.4 Yapay Zeka Kullanılmayan Alanlar

Aşağıdaki işlevler için yapay zeka **kullanılmaz**, kullanılmamalıdır:

- İçerik moderasyonu (insan moderatör yapar)
- Kullanıcı öneri/eşleştirme (kategori bazlı basit filtre yeterli)
- Spam tespiti (IP bazlı rate limit yeterli)
- Otomatik etkinlik toplama (organizatör onayı şart)

---

## 4. Kullanıcı Tipleri

### 4.1 Misafir

- Kayıt gerektirmeden tüm etkinlikleri görüntüleyebilir.
- İlk ziyarette ilgi alanı seçim modalı açılır.
- Seçimler `localStorage`'da saklanır, sonraki ziyarette tekrar sorulmaz.
- Etkinlik gönderemez, bildirim alamaz.
- Uygunsuz etkinlikleri **raporlayabilir** (kayıt gerektirmez).

### 4.2 Kayıtlı Kullanıcı (`user`)

- E-posta + şifre veya magic link ile kayıt olur.
- İlgi alanları Supabase profilinde saklanır; güncelleyebilir.
- Etkinlik linki yapıştırarak etkinlik gönderebilir.
- Gönderdiği etkinlikler **admin / moderatör onayı bekler**.
- İlgi alanıyla eşleşen etkinlikler için e-posta + in-app bildirim alır.
- Uygunsuz etkinlikleri raporlayabilir.

### 4.3 Onaylı Kullanıcı (`verified_user`)

- Admin tarafından "güvenilir" olarak işaretlenmiş kayıtlı kullanıcı.
- Gönderdiği etkinlikler **onay beklemeden** direkt yayınlanır.
- Diğer her şey kayıtlı kullanıcıyla aynıdır.

### 4.4 Moderatör (`moderator`)

- Admin tarafından "moderatör" rolü verilmiş kayıtlı kullanıcı.
- Sadece `/moderator` paneline erişebilir; admin paneline erişimi yoktur.
- Bekleyen etkinlikleri görebilir, düzenleyebilir, onaylayabilir veya reddedebilir.
- Yayındaki uygunsuz etkinlikleri kaldırabilir.
- Raporlanan içerikleri inceleyebilir ve aksiyon alabilir.
- Kullanıcı rolleri üzerinde hiçbir yetkisi yoktur.
- Yaptığı tüm işlemler `moderation_logs` tablosuna kaydedilir.

### 4.5 Admin (`admin`)

- Tüm sistemi yönetir; en yetkili roldür.
- Bekleyen etkinlikleri onaylar veya reddeder.
- Kullanıcılara "onaylı" veya "moderatör" rolü verebilir; bu rolleri geri alabilir.
- Yayındaki etkinlikleri düzenleyebilir veya kaldırabilir.
- Raporlanan içerikleri yönetir ve moderatörlere atayabilir.
- Moderatör loglarını ve tüm sistem aktivitesini görebilir.

**Hiyerarşi:** `admin > moderator > verified_user > user > guest`

---

## 5. Özellikler

### 5.1 İlgi Alanı Sistemi

**Misafir:**
- Platform ilk açıldığında tam ekran modal gösterilir.
- "Seni hangi konular ilgilendiriyor?" sorusu sorulur.
- Çoklu seçim desteklenir (checkbox tarzı).
- "Şimdilik atla" seçeneği vardır; atlarsa modal bir daha açılmaz (`localStorage` bayrağı).
- Seçimler `localStorage`'a kaydedilir.

**Kayıtlı kullanıcı:**
- Kayıt sırasında veya sonrasında profil sayfasından ilgi alanlarını seçer.
- Misafirken seçilmiş ilgi alanları kayıt olunca otomatik Supabase'e taşınır.
- İstediği zaman profil sayfasından güncelleyebilir.

**Kategoriler:**
- Blockchain / Web3
- Yapay Zeka / ML
- Mobil Geliştirme
- Backend / DevOps
- Siber Güvenlik
- Girişimcilik / Startup
- Tasarım / UX
- Oyun Geliştirme
- Veri Bilimi
- Açık Kaynak

---

### 5.2 Etkinlik Listeleme (Ana Sayfa)

- Yayındaki tüm etkinlikler kartlar halinde listelenir.
- Varsayılan sıralama: yaklaşan tarih önce.
- İlgi alanı seçilmişse (misafir veya kayıtlı) eşleşen etkinlikler üstte gösterilir.
- **Filtreler:** Kategori · Şehir · Tarih aralığı · Online / Yüz yüze
- **Etkinlik kartı:** Başlık · Kapak görseli · Kategori etiketi · Şehir · Tarih · Kayıt butonu

---

### 5.3 Etkinlik Detay Sayfası

- `/etkinlik/[slug]` rotasında, SSG ile render edilir.
- Tam başlık, açıklama, tarih, konum, organizatör bilgisi.
- Kayıt / katılım linki (dış link, yeni sekmede).
- Paylaş butonu (Twitter/X, LinkedIn, linki kopyala).
- **"Uygunsuz İçerik Bildir"** butonu — tüm ziyaretçilere görünür.

---

### 5.4 Etkinlik Gönderme Akışı

> Sadece **kayıtlı** ve **onaylı** kullanıcılar etkinlik gönderebilir.

1. **Link yapıştır** → "Bilgileri Getir" butonuna basar.
2. **Otomatik parse** → metascraper → (eksikse) GPT-4o → önizleme formu.
3. **Kullanıcı düzenler** → hatalı alanları düzeltir, eksikleri doldurur.
4. **Gönder** → onaylı kullanıcıysa direkt yayın, değilse `pending`.

---

### 5.5 Moderatör Paneli (`/moderator`)

Sadece `role = moderator` erişebilir. Admin panelinden tamamen bağımsız.

**Onay Bekleyenler (`/moderator/bekleyenler`):**
- Tüm `pending` etkinlikler listelenir.
- Her etkinlik için: düzenleyerek onayla veya reddet.
- Düzenleme: tüm alanlar değiştirilebilir; değişiklikler `moderation_logs`'a yazılır.

**Onayladıklarım (`/moderator/onayladiklarim`):**
- Moderatörün onayladığı etkinliklerin listesi ve güncel durumları.

**Raporlar (`/moderator/raporlar`):**
- Atanan raporlar listelenir.
- Aksiyon: Kaldır (`status: removed`) veya Geçerli Değil.

---

### 5.6 Admin Paneli (`/admin`)

Sadece `role = admin` erişebilir.

- **Bekleyen etkinlikler** → onayla / reddet / düzenle.
- **Tüm etkinlikler** → yayındaki ve kaldırılan etkinlikleri yönet.
- **Raporlar** → tüm açık raporlar; moderatöre ata veya direkt aksiyon al.
- **Kullanıcı yönetimi** → rol ata/geri al; moderatör loglarını görüntüle.

---

### 5.7 İçerik Raporlama

- Herkes (misafir dahil) etkinlik detay sayfasından rapor gönderebilir.
- Rapor sebepleri: Yanıltıcı · Spam · Alakasız · Uygunsuz · Diğer
- Rapor `reports` tablosuna `status: open` olarak kaydedilir.
- Admin ve moderatör panellerine düşer.
- Spam koruması: aynı kullanıcı/IP aynı etkinliği birden fazla raporlayamaz.

---

### 5.8 Bildirim Sistemi

| Bildirim Tipi         | Alıcı                          | Tetikleyici                          |
|-----------------------|--------------------------------|--------------------------------------|
| Yeni etkinlik         | İlgi alanı eşleşen kullanıcılar | Etkinlik yayına alındığında          |
| Gönderim onaylandı    | Gönderici                      | Admin / Moderatör onayladığında      |
| Gönderim reddedildi   | Gönderici                      | Red işlemi yapıldığında              |
| Rapor çözüldü         | Raporlayan (kayıtlıysa)        | Rapora aksiyon alındığında           |

- E-posta bildirimleri profil sayfasından kapatılabilir.
- In-app bildirimler header'daki çan ikonu ile gösterilir.

---

### 5.9 Kimlik Doğrulama

- Supabase Auth kullanılır.
- E-posta + şifre ve magic link desteklenir.
- OAuth → v2'ye bırakılır.

---

### 5.10 Kullanıcı Profil Sayfası

- Ad soyad, bio, ilgi alanları, e-posta bildirim tercihi düzenlenebilir.
- Gönderim geçmişi: etkinlik adı ve durumu (yayında / beklemede / reddedildi).

---

## 6. Veritabanı Şeması

### `profiles`

```sql
id              uuid PRIMARY KEY REFERENCES auth.users
name            text NOT NULL
email           text NOT NULL
role            user_role DEFAULT 'user'
                  -- ENUM: user | verified_user | moderator | admin
interests       text[] DEFAULT '{}'
notify_email    boolean DEFAULT true
created_at      timestamptz DEFAULT now()
```

### `events`

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
title           text NOT NULL
description     text
cover_image     text                    -- Supabase Storage CDN URL
cover_image_og  text                    -- Orijinal OG URL (yedek)
category        text NOT NULL
city            text
is_online       boolean DEFAULT false
venue_name      text
start_date      timestamptz NOT NULL
end_date        timestamptz
registration_url text
source_url      text NOT NULL           -- Orijinal gönderilen link
organizer_id    uuid REFERENCES profiles
status          event_status DEFAULT 'pending'
                  -- ENUM: pending | published | rejected | removed
rejection_note  text
slug            text UNIQUE NOT NULL
created_at      timestamptz DEFAULT now()
published_at    timestamptz
removed_at      timestamptz
```

### `notifications`

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid REFERENCES profiles NOT NULL
event_id        uuid REFERENCES events
type            notif_type NOT NULL
                  -- ENUM: new_event | submission_approved | submission_rejected | report_resolved
read_at         timestamptz
created_at      timestamptz DEFAULT now()
```

### `submissions`

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
event_id        uuid REFERENCES events NOT NULL
submitted_by    uuid REFERENCES profiles NOT NULL
raw_url         text NOT NULL
parse_source    parse_source_type NOT NULL
                  -- ENUM: og | gpt4o | manual
submitted_at    timestamptz DEFAULT now()
```

### `reports`

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
event_id        uuid REFERENCES events NOT NULL
reported_by     uuid REFERENCES profiles   -- NULL: misafir raporu
reporter_ip     text
reason          report_reason NOT NULL
                  -- ENUM: misleading | spam | irrelevant | inappropriate | other
description     text
status          report_status DEFAULT 'open'
                  -- ENUM: open | resolved
resolved_by     uuid REFERENCES profiles
resolved_at     timestamptz
created_at      timestamptz DEFAULT now()
```

### `moderation_logs`

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
moderator_id    uuid REFERENCES profiles NOT NULL
event_id        uuid REFERENCES events NOT NULL
action          mod_action NOT NULL
                  -- ENUM: approved | rejected | removed | edited
changes         jsonb                   -- { field: { before, after } }
note            text
created_at      timestamptz DEFAULT now()
-- SİLME YOK: audit trail olarak kalır
```

> ⚠️ **KRİTİK:** `moderation_logs` tablosuna hiçbir rol için DELETE izni verilmez. Bu bir audit trail'dir.

---

## 7. Sayfa ve Rota Haritası

| Rota                          | Açıklama                        | Erişim       |
|-------------------------------|---------------------------------|--------------|
| `/`                           | Ana sayfa, etkinlik listesi     | Herkese açık |
| `/etkinlik/[slug]`            | Etkinlik detay sayfası          | Herkese açık |
| `/giris`                      | Giriş / kayıt                  | Misafir      |
| `/etkinlik-gonder`            | Etkinlik gönderme formu         | Kayıtlı      |
| `/profil`                     | Kullanıcı profil sayfası        | Kayıtlı      |
| `/bildirimler`                | Bildirim listesi                | Kayıtlı      |
| `/moderator`                  | Moderatör paneli                | Moderatör    |
| `/moderator/bekleyenler`      | Onay bekleyen etkinlikler       | Moderatör    |
| `/moderator/onayladiklarim`   | Moderatörün onayladıkları       | Moderatör    |
| `/moderator/raporlar`         | Kullanıcı raporları             | Moderatör    |
| `/admin`                      | Admin paneli                    | Admin        |
| `/admin/bekleyenler`          | Onay bekleyenler                | Admin        |
| `/admin/etkinlikler`          | Tüm etkinlik yönetimi           | Admin        |
| `/admin/raporlar`             | Tüm raporlar                    | Admin        |
| `/admin/kullanicilar`         | Kullanıcı yönetimi              | Admin        |

---

## 8. API Endpoint Haritası

| Method | Endpoint                        | İşlev                              | Auth         |
|--------|---------------------------------|------------------------------------|--------------|
| POST   | `/api/parse-link`               | Link → metascraper + GPT-4o parse  | Kayıtlı      |
| POST   | `/api/events`                   | Etkinlik gönder                    | Kayıtlı      |
| PATCH  | `/api/events/[id]/approve`      | Etkinliği onayla                   | Mod / Admin  |
| PATCH  | `/api/events/[id]/reject`       | Etkinliği reddet                   | Mod / Admin  |
| PATCH  | `/api/events/[id]/remove`       | Etkinliği kaldır                   | Mod / Admin  |
| POST   | `/api/reports`                  | Rapor gönder                       | Herkese açık |
| PATCH  | `/api/reports/[id]/resolve`     | Raporu çöz                         | Mod / Admin  |
| POST   | `/api/storage/upload-cover`     | OG görselini Storage'a yükle       | Server only  |
| PATCH  | `/api/users/[id]/role`          | Kullanıcı rolü güncelle            | Admin        |
| PATCH  | `/api/notifications/[id]/read`  | Bildirimi okundu işaretle          | Kayıtlı      |
| PATCH  | `/api/notifications/read-all`   | Tümünü okundu işaretle             | Kayıtlı      |

---

## 9. Teknik Kararlar

### Next.js 15 App Router
Server component ile SEO dostu etkinlik sayfaları. API route'lar ayrı backend gerektirmez. Vercel deploy kolaylığı.

### Supabase
Auth + DB + Storage + Email tek yerden. RLS ile satır bazlı erişim kontrolü. Realtime bildirimler için altyapı hazır.

### Supabase Storage (Görsel Depolama)
Kaynak sitenin görseline bağımlılığı ortadan kaldırır. CDN üzerinden hızlı erişim. Next.js `<Image>` bileşeni ile optimize edilebilir.

### Hibrit AI Parse
metascraper önce, GPT-4o fallback. Gereksiz API maliyetinden kaçınılır. Manuel düzeltme her zaman mümkün.

### Moderatör / Admin Ayrımı
Tamamen ayrı rotalar ve ayrı middleware kontrolü. Moderatör kullanıcı rollerini değiştiremez.

### Slug
Türkçe karakterler temizlenir (`ğ→g`, `ü→u`, `ş→s`, `ı→i`, `ö→o`, `ç→c`). Çakışmada `-2`, `-3` eklenir.

---

## 10. Row Level Security (RLS)

| Tablo              | SELECT                                     | INSERT              | UPDATE                        | DELETE       |
|--------------------|--------------------------------------------|---------------------|-------------------------------|--------------|
| `profiles`         | Herkese açık                               | `auth.uid() = id`   | `auth.uid() = id`             | —            |
| `events`           | published=herkese, kendi veya mod/admin    | authenticated       | mod/admin veya kendi+pending  | admin        |
| `reports`          | mod/admin                                  | Herkese açık        | mod/admin                     | —            |
| `moderation_logs`  | mod/admin                                  | service_role        | —                             | **YOK**      |
| `notifications`    | `user_id = auth.uid()`                     | service_role        | `user_id = auth.uid()`        | —            |
| `submissions`      | authenticated                              | authenticated       | —                             | —            |

---

## 11. Güvenlik

- Supabase RLS: her tabloda satır bazlı erişim.
- Next.js middleware: `/admin/*` ve `/moderator/*` rotalarında rol kontrolü.
- `SUPABASE_SERVICE_ROLE_KEY` ve `OPENAI_API_KEY` sadece server-side, client'a sızmaz.
- Link parse tamamen server-side; kullanıcı tarayıcısı dış siteye istek yapmaz.
- GPT-4o'ya gönderilecek HTML temizlenir; max 8.000 token.
- `moderation_logs` silinemez (RLS: delete = false for all roles).
- Misafir raporları: IP bazlı rate limit (10 dakikada 1 rapor).

---

## 12. Kapsam Dışı (v1)

| Özellik                | Neden                              |
|------------------------|------------------------------------|
| Mobil uygulama         | Web önce                           |
| OAuth (Google vb.)     | Magic link yeterli                 |
| Yorum sistemi          | Odaktan uzaklaştırır               |
| Takvim görünümü        | v2                                 |
| Otomatik scraping      | Yasal risk, veri kalitesi          |
| Ücretli listeleme      | Monetizasyon henüz değil           |
| Çoklu dil desteği      | Sadece Türkçe                      |
| Harita görünümü        | v2                                 |
| Public API             | v2                                 |
| Global etkinlikler     | Odak Türkiye                       |

---

## 13. Değişiklik Geçmişi

| Sürüm | Tarih      | Değişiklik                                                                           |
|-------|------------|--------------------------------------------------------------------------------------|
| 1.0   | Mayıs 2026 | İlk sürüm                                                                            |
| 1.1   | Mayıs 2026 | Moderatör rolü, içerik raporlama eklendi                                             |
| 1.2   | Mayıs 2026 | Ortam yapısı, Supabase Storage, AI kullanım detayları, API endpoint haritası eklendi |
| 1.2+  | Mayıs 2026 | Proje özeti (hedef kitle), özellikler detaylandırıldı, güvenlik, kapsam dışı bölümleri eklendi |

---

*Bu doküman Listur v1 kapsamını tanımlar. `CLAUDE.md` ile birlikte okunmalıdır.*
