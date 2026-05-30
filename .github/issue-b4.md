## 📋 Açıklama

E2E test B4 başarısız oluyor. /profil sayfasında form submit butonu 30 saniye içinde bulunamıyor veya tıklanamıyor.

## 🔍 Test Detayı
- **Test ID:** B4
- **Hata:** locator.click: Timeout 30000ms exceeded
- **Selector:** button[type="submit"].first()
- **Screenshot:** Yok (timeout nedeniyle alınamadı)

## 🐛 Olası Nedenler
1. Submit butonu disabled durumda kalıyor
2. Form yüklenmesi çok uzun sürüyor
3. Selector yanlış (button[type="submit"] bulunamıyor)
4. Loading state sonsuz döngüde

## ✅ Kabul Kriterleri
- [ ] /profil sayfası 2 saniye içinde yüklenmeli
- [ ] Submit butonu görünür ve tıklanabilir olmalı
- [ ] Test B4 PASS olmalı

## 🔗 İlgili
- Test dosyası: e2e-test.js (satır ~250-260)
- Screenshot: docs/e2e-test/2026-05-30/B3-profil-form.png (form görünüyor)
- Parent: #34
