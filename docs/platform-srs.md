# Listur — Platform Yazılım Gereksinimleri (SRS v1.2)

> Türkiye'deki teknoloji ve topluluk etkinliklerini (hackathon, meetup, workshop, konferans) tek platformda toplayan web uygulaması.

---

## 1. Proje Özeti

**Listur**, organizatörlerin etkinliklerini gönderdiği, moderatörlerin incelediği ve kullanıcıların ilgi alanlarına göre keşfettiği bir etkinlik dizin platformudur.

### Temel Değer Önerisi
- Organizatörler: Etkinliklerini link göndererek kolayca ekleyebilir (AI otomatik doldurur)
- Kullanıcılar: İlgi alanlarına göre kişiselleştirilmiş etkinlik akışı
- Topluluk: Türkiye teknoloji ekosisteminin tek kaynağı

---

## 2. Kullanıcı Rolleri

| Rol | Açıklama | Yetkiler |
|-----|----------|----------|
| `guest` | Kayıtsız ziyaretçi | Etkinlikleri görüntüle, rapor gönder |
| `user` | Kayıtlı kullanıcı | Etkinlik gönder (pending), profil yönet, bildirim al |
| `verified_user` | Doğrulanmış kullanıcı | Etkinlik gönder (direkt published) |
| `moderator` | Moderatör | Etkinlik onayla/reddet/kaldır, rapor yönet |
| `admin` | Yönetici | Tüm moderatör yetkileri + kullanıcı rol yönetimi |

**Hiyerarşi:** `admin > moderator > verified_user > user > guest`

---

## 3. Etkinlik Yaşam Döngüsü

```
Organizatör link gönderir
        ↓
  [AI Parse: metascraper → GPT-4o fallback]
        ↓
  Form otomatik dolar → organizatör düzenler
        ↓
   Gönder → status: pending
        ↓
  Moderatör inceler
   ├── Onayla → status: published + bildirimler gönderilir
   └── Reddet → status: rejected + organizatöre bildirim
        ↓ (yayında iken)
  Kullanıcı rapor eder → moderatör inceler
   ├── Görmezden gel → rapor: resolved
   └── Kaldır → status: removed
```

---

## 4. Veritabanı Şeması

### 4.1 Enum Tipleri

```sql
user_role:       user | verified_user | moderator | admin
event_status:    pending | published | rejected | removed
notif_type:      new_event | submission_approved | submission_rejected | report_resolved
parse_source:    og | gpt4o | manual
report_reason:   misleading | spam | irrelevant | inappropriate | other
report_status:   open | resolved
mod_action:      approved | rejected | removed | edited
```

### 4.2 Tablolar

#### `profiles`
| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | uuid (PK) | auth.users FK |
| name | text | Kullanıcı adı |
| email | text | E-posta |
| role | user_role | Varsayılan: user |
| interests | text[] | İlgi alanları (kategori listesi) |
| notify_email | boolean | E-posta bildirimi açık/kapalı |
| created_at | timestamptz | Kayıt tarihi |

#### `events`
| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | uuid (PK) | |
| slug | text (UNIQUE) | URL-friendly başlık |
| title | text | Etkinlik başlığı |
| description | text | Açıklama |
| category | text | İlgi alanı kategorisi |
| start_date | timestamptz | Başlangıç tarihi |
| end_date | timestamptz | Bitiş tarihi (opsiyonel) |
| city | text | Şehir (opsiyonel) |
| is_online | boolean | Online mı? |
| venue_name | text | Mekan adı (opsiyonel) |
| cover_image | text | Supabase Storage CDN URL |
| cover_image_og | text | Ham OG görsel URL |
| source_url | text | Kaynak link |
| registration_url | text | Kayıt linki |
| status | event_status | Varsayılan: pending |
| organizer_id | uuid (FK profiles) | Gönderen kullanıcı |
| rejection_note | text | Ret sebebi |
| published_at | timestamptz | Yayın tarihi |
| removed_at | timestamptz | Kaldırma tarihi |
| created_at | timestamptz | Oluşturma tarihi |

#### `submissions`
| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | uuid (PK) | |
| event_id | uuid (FK events) | |
| submitted_by | uuid (FK profiles) | |
| raw_url | text | Gönderilen ham URL |
| parse_source | parse_source_type | og / gpt4o / manual |
| submitted_at | timestamptz | |

#### `reports`
| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | uuid (PK) | |
| event_id | uuid (FK events) | |
| reason | report_reason | Rapor sebebi |
| description | text | Ek açıklama |
| reported_by | uuid (FK profiles) | null = misafir |
| reporter_ip | text | IP adresi |
| status | report_status | open / resolved |
| resolved_by | uuid (FK profiles) | |
| resolved_at | timestamptz | |
| created_at | timestamptz | |

#### `moderation_logs`
| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | uuid (PK) | |
| moderator_id | uuid (FK profiles) | |
| event_id | uuid (FK events) | |
| action | mod_action | approved/rejected/removed/edited |
| changes | jsonb | { field: { before, after } } |
| note | text | Moderatör notu |
| created_at | timestamptz | |

> ⚠️ **KRİTİK:** `moderation_logs` tablosuna DELETE izni verilmez. Audit trail'dir.

#### `notifications`
| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | uuid (PK) | |
| user_id | uuid (FK profiles) | |
| event_id | uuid (FK events) | |
| type | notif_type | Bildirim tipi |
| read_at | timestamptz | Okunma zamanı (null = okunmamış) |
| created_at | timestamptz | |

---

## 5. Row Level Security (RLS) Özeti

| Tablo | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | Herkese açık | auth.uid() = id | auth.uid() = id | — |
| events | published=herkese, kendi veya mod/admin | authenticated | mod/admin veya (kendi + pending) | admin |
| reports | mod/admin | Herkese açık (misafir dahil) | mod/admin | — |
| moderation_logs | mod/admin | service_role | — | **YOK** |
| notifications | user_id = auth.uid() | service_role | user_id = auth.uid() | — |
| submissions | authenticated | authenticated | — | — |

---

## 6. API Endpoints

### Etkinlik
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| POST | `/api/parse-link` | authenticated | URL parse (metascraper + GPT-4o) |
| POST | `/api/events` | authenticated | Etkinlik gönder |
| PATCH | `/api/events/[id]/approve` | mod/admin | Onayla + görsel yükle + bildirim |
| PATCH | `/api/events/[id]/reject` | mod/admin | Reddet + bildirim |
| PATCH | `/api/events/[id]/remove` | mod/admin | Kaldır |

### Storage
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| POST | `/api/storage/upload-cover` | mod/admin | OG görsel → Supabase Storage |

### Raporlama
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| POST | `/api/reports` | herkese açık | Rapor gönder (IP rate limit) |
| PATCH | `/api/reports/[id]/resolve` | mod/admin | Raporu çöz |

### Bildirimler
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| PATCH | `/api/notifications/[id]/read` | authenticated | Bildirimi okundu işaretle |
| PATCH | `/api/notifications/read-all` | authenticated | Tümünü okundu işaretle |

### Kullanıcı Yönetimi
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| PATCH | `/api/users/[id]/role` | admin | Kullanıcı rolü değiştir |

---

## 7. AI Parse Akışı

```
URL geldi
  │
  ▼
metascraper ile OG/meta tag çek
  │
  ├─ title + description + start_date hepsi var?
  │     └─ EVET → parse_source: "og" → döndür
  │
  └─ HAYIR → GPT-4o fallback
        │
        ├─ HTML çek → temizle (script/style/nav/footer kaldır, max 15k karakter)
        ├─ Sadece eksik alanları sor (maliyet optimizasyonu)
        ├─ Model: gpt-4o | format: json_object | temperature: 0
        └─ Sonuçları birleştir → parse_source: "gpt4o" → döndür
```

**AI KULLANILMAYAN DURUMLAR:**
- İçerik moderasyonu (insan moderatör)
- Spam tespiti (IP rate limit yeterli)
- Otomatik etkinlik toplama (organizatör onayı şart)

---

## 8. Görsel Akışı

```
Etkinlik gönderilir
  → cover_image_og = OG URL (ham, doğrudan depolanmaz)

Moderatör onaylar (/api/events/[id]/approve)
  → Server: fetch(cover_image_og) → Buffer → Supabase Storage upload
  → Bucket: event-covers / Path: {event-id}/cover.{ext}
  → cover_image = CDN URL (kalıcı)
```

**Neden bu akış?** OG URL'leri geçici olabilir; onay anında Storage'a almak CDN'den kalıcı servis sağlar.

---

## 9. İlgi Alanı Kategorileri

```
Blockchain / Web3 | Yapay Zeka / ML | Mobil Geliştirme | Backend / DevOps
Siber Güvenlik | Girişimcilik / Startup | Tasarım / UX | Oyun Geliştirme
Veri Bilimi | Açık Kaynak
```

---

## 10. Misafir & İlgi Alanı Senkronizasyonu

```
Misafir ilk ziyaret
  → InterestsModal açılır
  → localStorage["listur_interests"] = seçimler
  → localStorage["listur_interests_shown"] = "true"

Kayıt olunca (useInterests hook)
  → localStorage'daki ilgi alanları profiles.interests'e taşınır
  → localStorage temizlenir

Kayıtlı kullanıcı
  → İlgi alanları her zaman Supabase'den gelir
```

---

## 11. Rate Limiting

- **`/api/reports`**: Aynı IP'den 10 dakikada maksimum 1 rapor
- Aynı `reported_by` + `event_id` kombinasyonu: sadece 1 rapor (DB unique check)
- Misafir: aynı IP + event_id kombinasyonu: sadece 1 rapor

---

## 12. Supabase Storage

```
Bucket: event-covers
  Public okuma: ✅
  Authenticated yazma: ✅
  Max boyut: 5MB
  İzin verilen: image/jpeg, image/png, image/webp
  Klasör yapısı: event-covers/{event-id}/cover.{ext}
```

---

## 13. Ortam Yapısı

| Git Branch | Vercel | Supabase | Amaç |
|------------|--------|----------|------|
| `development` | Preview | listur-dev | Geliştirme |
| `production` | Production | listur-prod | Canlı |

---

## 14. Sayfalar

| Rota | Tip | Auth | Açıklama |
|------|-----|------|----------|
| `/` | SSR | — | Ana sayfa, etkinlik listesi |
| `/etkinlik/[slug]` | SSG | — | Etkinlik detayı |
| `/giris` | Static | — | Giriş/kayıt |
| `/profil` | Static | ✅ | Profil ayarları |
| `/bildirimler` | Dynamic | ✅ | Bildirim listesi |
| `/etkinlik-gonder` | Static | ✅ | Etkinlik gönderme formu |
| `/moderator/*` | Dynamic | mod/admin | Moderatör paneli |
| `/admin/*` | Dynamic | admin | Admin paneli |

---

*Son güncelleme: Mayıs 2026 — v1.2*
