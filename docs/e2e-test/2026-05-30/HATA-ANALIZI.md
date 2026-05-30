# E2E Test Hata Analizi - 30.05.2026

## 📊 Özet

**Test Sonuçları:** 34 PASS, 7 FAIL, 5 SKIP

**Başarı Oranı:** 82.9% (34/41)

---

## ❌ Başarısız Testler

### 1. **A2: InterestsModal ilk açılışta görünmüyor**

**Hata:** Modal görünür: false

**Root Cause:** 
- `InterestsModal.tsx` içindeki `useEffect` dependency array'i eksik
- `isModalShown()` ve `markModalShown()` fonksiyonları her render'da yeni referans alıyor
- useEffect düzgün tetiklenmiyor

**Dosya:** `src/components/modals/InterestsModal.tsx:15-25`

**Çözüm:**
```typescript
// useInterests hook'unda fonksiyonları useCallback ile wrap et
const isModalShown = useCallback((): boolean => {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(LS_KEY_SHOWN) === 'true'
}, [])

const markModalShown = useCallback(() => {
  if (typeof window === 'undefined') return
  localStorage.setItem(LS_KEY_SHOWN, 'true')
}, [])
```

---

### 2. **B4: Profil sayfasında submit butonu timeout**

**Hata:** `locator.click: Timeout 30000ms exceeded`

**Root Cause:**
- AuthContext initialization race condition
- Profile fetch async işlemi tamamlanmadan form render edilmiyor
- `INITIAL_SESSION` event handling karmaşık

**Dosya:** `src/context/AuthContext.tsx:60-95`

**Çözüm:**
- AuthContext initialization logic'i sadeleştir
- `initializedRef` kullanımını düzelt
- Profile loading state'ini optimize et

---

### 3. **H3, H5, H6: Login sonrası etkinlik kartları yüklenmiyor**

**Hata:** `page.waitForSelector: Timeout 10000ms exceeded` - `a[href^="/etkinlik/"]`

**Root Cause:**
- EventCard client component + FavoriteButton hydration sorunu
- useFavorites hook'u AuthContext'e bağımlı
- Login sonrası AuthContext state güncellemesi tamamlanmadan kartlar render edilmeye çalışılıyor

**Dosyalar:**
- `src/components/events/EventCard.tsx`
- `src/hooks/useFavorites.ts`
- `src/context/AuthContext.tsx`

**Akış:**
1. Test login yapıyor → AuthContext user state güncelleniyor
2. Ana sayfaya gidiyor → server component events fetch ediyor
3. EventCard render → FavoriteButton render
4. FavoriteButton → useFavorites → AuthContext user henüz hazır değil
5. Event kartları DOM'a eklenmiyor

**Çözüm:**
```typescript
// EventCard'ı server component yap
// FavoriteButton'ı ayrı client component olarak bırak

// EventCard.tsx (server component)
export function EventCard({ event }: EventCardProps) {
  return (
    <Link href={`/etkinlik/${event.slug}`}>
      <article>
        {/* ... */}
        <FavoriteButtonWrapper eventId={event.id} />
      </article>
    </Link>
  )
}

// FavoriteButtonWrapper.tsx (client component)
'use client'
export function FavoriteButtonWrapper({ eventId }: { eventId: string }) {
  return <FavoriteButton eventId={eventId} />
}
```

---

### 4. **I3, I4: Takvim sayfasından sonra etkinlik kartları yüklenmiyor**

**Hata:** `page.waitForSelector: Timeout 10000ms exceeded` - `a[href^="/etkinlik/"]`

**Root Cause:**
- Navigation sonrası useFavorites hook yeniden initialize ediliyor
- fetchFavorites async çağrısı tamamlanana kadar component render bloklanıyor
- Client-side state navigation sonrası sıfırlanıyor

**Çözüm:**
- useFavorites loading state'i component render'ını bloklamasın
- Optimistic UI kullan
- EventCard'ı Suspense boundary içine al

---

## 🔍 Ortak Sorunlar

### 1. Client/Server Component Karışımı
- Ana sayfa: server component
- EventCard: client component (FavoriteButton yüzünden)
- Hydration mismatch ve rendering gecikmeleri

### 2. AuthContext Initialization Race Condition
```typescript
// Karmaşık ve race condition'a açık
if (event === 'INITIAL_SESSION' && !initializedRef.current) return
if (event === 'INITIAL_SESSION' && initializedRef.current) return
```

### 3. useEffect Dependency Issues
- InterestsModal: `isModalShown` ve `markModalShown` dependency'de yok
- Fonksiyonlar her render'da yeni referans alıyor

### 4. Async State Loading
- useFavorites fetchFavorites async
- AuthContext fetchProfile async
- Component'ler async işlemler tamamlanana kadar render edilmiyor

---

## ✅ Önerilen Düzeltmeler (Öncelik Sırasına Göre)

### Yüksek Öncelik

1. **EventCard Server Component Dönüşümü**
   - EventCard'ı server component yap
   - FavoriteButton'ı ayrı client component wrapper ile kullan
   - Hydration sorunlarını çöz

2. **AuthContext Initialization Düzeltmesi**
   - INITIAL_SESSION handling'i sadeleştir
   - Race condition'ı düzelt
   - Loading state'i optimize et

3. **useFavorites Optimizasyonu**
   - Loading state component render'ını bloklamasın
   - Optimistic UI ekle
   - Error handling iyileştir

### Orta Öncelik

4. **InterestsModal useEffect Düzeltmesi**
   - useInterests hook'undaki fonksiyonları useCallback ile wrap et
   - Dependency array'i düzelt

5. **Profile Page Loading**
   - Loading timeout'u kaldır
   - Form render logic'i iyileştir

### Düşük Öncelik

6. **Test Timeout Ayarları**
   - Kritik selector'lar için timeout'ları artır
   - Retry logic ekle

---

## 📸 Screenshot Analizi

**Başarılı Screenshot'lar:** 25/25
- Tüm screenshot'lar başarıyla alındı
- UI render sorunları yok
- Görsel regresyon yok

**Eksik Screenshot'lar:**
- B4: Submit butonu bulunamadığı için screenshot yok
- H3, H5, H6: Event kartları yüklenmediği için screenshot yok
- I3, I4: Event kartları yüklenmediği için screenshot yok

---

## 🎯 Sonraki Adımlar

1. GitHub issue aç: "fix: E2E test failures - EventCard hydration & AuthContext race condition"
2. Branch oluştur: `gh issue develop <issue-no> --checkout`
3. Düzeltmeleri yap (öncelik sırasına göre)
4. Test et: `node e2e-test.js`
5. PR aç ve merge et

---

## 📝 Notlar

- Test suite genel olarak sağlam
- Sorunlar çoğunlukla client/server component karışımından kaynaklanıyor
- AuthContext initialization'ı kritik nokta
- Düzeltmeler sonrası %100 başarı oranı bekleniyor
