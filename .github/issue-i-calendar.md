## 📋 Açıklama

E2E testleri I3 ve I4 başarısız oluyor. Etkinlik detay sayfasında "Takvime ekle" butonu ve iCal export özelliği test edilemiyor çünkü etkinlik kartları bulunamıyor.

## 🔍 Test Detayları

### I3 - Takvime ekle butonu
- **Hata:** locator.getAttribute: Timeout 30000ms exceeded
- **Selector:** a[href^="/etkinlik/"].first()
- **Durum:** Anasayfada etkinlik kartı bulunamıyor

### I4 - iCal endpoint
- **Hata:** Aynı (etkinlik slug'ı alınamıyor)
- **Beklenen:** /api/events/[slug]/ical endpoint'i text/calendar döndürmeli

## 🐛 Olası Nedenler
1. H bölümü ile aynı kök neden: Login sonrası etkinlik kartları kayboluyoruor
2. /takvim sayfasından detaya gidilemiyor
3. CalendarExportMenu component render olmuyor
4. iCal API route çalışmıyor

## ✅ Kabul Kriterleri
- [ ] Etkinlik detay sayfasında "Takvime ekle" butonu görünür olmalı
- [ ] Button tıklanınca dropdown açılmalı (Google Calendar, iCal, Outlook)
- [ ] /api/events/[slug]/ical endpoint'i Content-Type: text/calendar döndürmeli
- [ ] Response body BEGIN:VCALENDAR içermeli
- [ ] Test I3, I4 PASS olmalı

## 🔗 İlgili
- Test dosyası: e2e-test.js (satır ~480-520)
- Screenshot: docs/e2e-test/2026-05-30/I1-takvim-sayfa.png (takvim sayfası çalışıyor)
- Related: #72 (aynı kök neden olabilir)
- Parent: #34
