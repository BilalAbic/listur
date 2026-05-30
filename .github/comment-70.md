### 🔍 Kök Neden Analizi

InterestsModal `useEffect` içinde `isModalShown` ve `markModalShown` fonksiyonlarını dependency array'e ekliyordu:

```typescript
useEffect(() => {
  if (isModalShown()) return
  // ...
  setOpen(true)
}, [user, profile, isModalShown, markModalShown]) // ❌ Sorun burada
```

**Sorun:** Bu fonksiyonlar `useInterests` hook'undan geliyor ve her render'da yeni referans oluşturuyor. Bu da `useEffect`'in sürekli çalışmasına neden oluyor ve modal açılmıyor.

---

### ✅ Çözüm

Dependency array'den `isModalShown` ve `markModalShown` çıkarıldı:

```typescript
useEffect(() => {
  if (isModalShown()) {
    return
  }
  if (user && profile && profile.interests && profile.interests.length > 0) {
    markModalShown()
    return
  }
  setOpen(true)
}, [user, profile]) // ✅ Sadece user ve profile
```

Ayrıca `profile.interests` null check eklendi.

---

### 🧪 Test Edilmesi Gereken

```bash
BASE_URL=https://dev.listur.bilalabic.com node e2e-test.js
```

Beklenen:
- ✅ A2: İlk ziyarette modal açılmalı
- ✅ A3: İlgi alanı seçimi localStorage'a kaydedilmeli
- ✅ A4: Refresh sonrası modal açılmamalı
