### 🔍 Kök Neden Analizi

Test başarısız oluyordu çünkü:

1. `loginAs(USERS.user1)` → login yapılıyor
2. `await goto('/')` → anasayfaya gidiliyor
3. **Ama:** `AuthContext` async olarak user state'ini güncelliyor
4. `useFavorites` hook'u user yoksa `favoriteIds`'i temizliyor
5. Test hemen `page.locator('a[href^="/etkinlik/"]')` çağırıyor
6. **Sonuç:** Kartlar henüz render olmamış, timeout

---

### ✅ Çözüm

Test dosyasına `waitForSelector` ekledim:

```javascript
// H2: Login sonrası anasayfada
await goto('/')
await page.waitForSelector('a[href^="/etkinlik/"]', { timeout: 10000 })
await page.waitForTimeout(1000) // Auth state güncellenmesi için

// H3, I3: firstEvent almadan önce
await page.waitForSelector('a[href^="/etkinlik/"]', { timeout: 10000 })
const firstEvent = await page.locator('a[href^="/etkinlik/"]').first().getAttribute('href')
```

---

### 🧪 Test Edilmesi Gereken

```bash
BASE_URL=https://dev.listur.bilalabic.com node e2e-test.js
```

Beklenen:
- ✅ H2: Favori toggle çalışmalı
- ✅ H3: Detay sayfasında favori butonu bulunmalı
- ✅ H5: RSVP dropdown açılmalı
- ✅ H6: Katılıyorum seçilmeli
- ✅ I3: Takvime ekle butonu bulunmalı
- ✅ I4: iCal endpoint test edilmeli

---

### 📝 Not

Bu bir **test düzeltmesi**, uygulama kodu değişmedi. Asıl sorun test timing'iydi.
