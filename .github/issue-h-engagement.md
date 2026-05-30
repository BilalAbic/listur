## 📋 Açıklama

E2E testleri H3, H5, H6 başarısız oluyor. User login olduktan sonra anasayfada etkinlik kartları bulunamıyor, bu yüzden favori ve RSVP özellikleri test edilemiyor.

## 🔍 Test Detayları

### H3 - Detay sayfasında favori butonu
- **Hata:** locator.getAttribute: Timeout 30000ms exceeded
- **Selector:** a[href^="/etkinlik/"].first()
- **Durum:** Login sonrası anasayfada etkinlik kartı bulunamıyor

### H5 - RSVP dropdown
- **Hata:** Aynı (etkinlik kartı bulunamıyor)

### H6 - Katılıyorum seçimi
- **Hata:** Aynı (etkinlik kartı bulunamıyor)

## 🐛 Olası Nedenler
1. Login sonrası sayfa yenilenmesi gerekiyor ama yapılmıyor
2. Auth state değişince etkinlik listesi kayboluyoyor
3. Selector yanlış (login sonrası DOM yapısı değişiyor)
4. InterestsModal açık kalıyor ve kartları gizliyor
5. Infinite scroll veya lazy loading sorunu

## ✅ Kabul Kriterleri
- [ ] Login sonrası anasayfada etkinlik kartları görünür olmalı
- [ ] Favori butonu (aria-label="Favori") çalışmalı
- [ ] RSVP dropdown açılmalı ve seçim yapılabilmeli
- [ ] Test H3, H5, H6 PASS olmalı

## 🔗 İlgili
- Test dosyası: e2e-test.js (satır ~400-450)
- Screenshot: docs/e2e-test/2026-05-30/H1-misafir-favori-redirect.png (misafir için çalışıyor)
- Parent: #34
