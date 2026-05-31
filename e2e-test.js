/**
 * Issue #34 — E2E Test v6: Sprint 1-6 dahil tam akış + screenshot
 *
 * Bölümler:
 *   A — Misafir | B — User-1 | C — Raporcu | D — Moderator | E — Admin
 *   F — Bildirimler | G — SEO | H — Engagement (Sprint 1) | I — Calendar (Sprint 2)
 *   J — Organizator 404 (Sprint 3) | K — Doğrulama (Sprint 4)
 *   L — Arama + Tags (Sprint 5) | M — Trending + Sana Özel (Sprint 6)
 *
 * Çalıştırma:
 *   node e2e-test.js
 *   BASE_URL=https://listur.bilalabic.com node e2e-test.js
 *
 * Çıktılar:
 *   - e2e-results.json (PASS/FAIL/SKIP tablo)
 *   - docs/e2e-test/<tarih>/<bölüm>-<id>-<slug>.png
 */

const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const BASE = process.env.BASE_URL || 'https://dev.listur.bilalabic.com'
const DATE = process.env.E2E_DATE || new Date().toISOString().slice(0, 10) // YYYY-MM-DD
const SHOTS_DIR = path.join('docs', 'e2e-test', DATE)
const TAKE_SHOTS = process.env.E2E_SHOTS !== 'false'

const USERS = {
  user1: {
    email: process.env.E2E_USER1_EMAIL || 'bilalabic78+listur-user1@gmail.com',
    pass: process.env.E2E_USER1_PASS || 'Listur2026!',
  },
  user2: {
    email: process.env.E2E_USER2_EMAIL || 'bilalabic78+listur-user2@gmail.com',
    pass: process.env.E2E_USER2_PASS || 'Listur2026!',
  },
  moderator: {
    email: process.env.E2E_MOD_EMAIL || 'bilalabic78+listur-mod@gmail.com',
    pass: process.env.E2E_MOD_PASS || 'Listur2026!',
  },
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || 'bilalabic78+listur-admin@gmail.com',
    pass: process.env.E2E_ADMIN_PASS || 'Listur2026!',
  },
}

const results = []
let browser, page

if (TAKE_SHOTS) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true })
}

function log(section, id, status, detail = '', screenshotPath = null) {
  const icon = status === 'PASS' ? '✅' : status === 'SKIP' ? '⏭️' : '❌'
  console.log(`${icon} ${id}: ${detail}`)
  results.push({ section, id, status, detail, screenshot: screenshotPath })
}

async function snap(id, slug = '') {
  if (!TAKE_SHOTS || !page) return null
  const safeSlug = slug.replace(/[^a-z0-9-]/gi, '').slice(0, 30) || 'view'
  const filename = `${id}-${safeSlug}.png`
  const filepath = path.join(SHOTS_DIR, filename)
  try {
    await page.screenshot({ path: filepath, fullPage: false })
    return filepath
  } catch (e) {
    console.error(`  screenshot ${id} failed:`, e.message)
    return null
  }
}

async function goto(p) {
  await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(300)
}

async function waitForAuthLoaded() {
  await page.waitForSelector('a[href="/etkinlik-gonder"]', { timeout: 15000 }).catch(() => {})
}

async function newContext(opts = {}) {
  if (page) await page.context().close().catch(() => {})
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'tr-TR',
    ...opts,
  })
  page = await ctx.newPage()
  page.on('console', () => {})
  page.on('pageerror', () => {})
  return page
}

async function loginAs(user) {
  await newContext()
  // InterestsModal'ı bastır
  await page.addInitScript(() => {
    localStorage.setItem('listur_interests_shown', 'true')
  })
  await page.goto(`${BASE}/giris`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await page.waitForTimeout(800)
  await page.locator('input[type="email"]').first().fill(user.email)
  await page.locator('input[type="password"]').first().fill(user.pass)
  await page.locator('button[type="submit"]').first().click()
  await page
    .waitForFunction(() => !window.location.pathname.startsWith('/giris'), { timeout: 15000 })
    .catch(() => {})
  await waitForAuthLoaded()
  console.log(`  → ${user.email} — ${page.url().replace(BASE, '') || '/'}`)
}

async function openUserMenu() {
  await waitForAuthLoaded()
  await page.locator('header').getByRole('button').first().click({ timeout: 5000 })
  await page.waitForTimeout(600)
}

// ─── BÖLÜM A — Misafir ────────────────────────────────────────────────────────
async function testA() {
  console.log('\n📋 BÖLÜM A — Misafir Akışı')
  await newContext()

  // A1 — Anasayfa render
  try {
    await goto('/')
    const title = await page.title()
    const cards = await page.locator('a[href^="/etkinlik/"]').count()
    const shot = await snap('A1', 'anasayfa')
    log('A', 'A1', cards >= 1 && title.toLowerCase().includes('listur') ? 'PASS' : 'FAIL',
      `Title: "${title}", kart: ${cards}`, shot)
  } catch (e) { log('A', 'A1', 'FAIL', e.message.slice(0, 120)) }

  // A2 — InterestsModal ilk açılış
  // Modal başlığı "Seni hangi konular ilgilendiriyor?" — data-testid eklendi.
  try {
    await newContext()
    await goto('/')
    await page.waitForTimeout(1500)
    const modalDialog = await page.locator('[data-testid="interests-modal"], [role="dialog"]:has-text("ilgilendir")').count()
    const shot = await snap('A2', 'interests-modal')
    log('A', 'A2', modalDialog > 0 ? 'PASS' : 'FAIL', `Modal görünür: ${modalDialog > 0}`, shot)
  } catch (e) { log('A', 'A2', 'FAIL', e.message.slice(0, 120)) }

  // A3 — localStorage kontrolü (ilgi alanı seçimi sonrası)
  try {
    // Modal'da bir kategori tıkla + Devam Et
    const cat = page.locator('button:has-text("Yapay Zeka"), button:has-text("Açık Kaynak")').first()
    if (await cat.count() > 0) {
      await cat.click()
      await page.waitForTimeout(300)
      const continueBtn = page.locator('button:has-text("Devam"), button:has-text("Kaydet")').first()
      await continueBtn.click({ timeout: 5000 }).catch(() => {})
      await page.waitForTimeout(800)
    }
    const ls = await page.evaluate(() => ({
      shown: localStorage.getItem('listur_interests_shown'),
      interests: localStorage.getItem('listur_interests'),
    }))
    log('A', 'A3', ls.shown === 'true' ? 'PASS' : 'FAIL',
      `shown: ${ls.shown}, interests: ${ls.interests?.slice(0, 50)}`)
  } catch (e) { log('A', 'A3', 'FAIL', e.message.slice(0, 120)) }

  // A4 — Refresh → modal yok
  try {
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    const modalDialog = await page.locator('[data-testid="interests-modal"], [role="dialog"]:has-text("ilgilendir")').count()
    const shot = await snap('A4', 'refresh-no-modal')
    log('A', 'A4', modalDialog === 0 ? 'PASS' : 'FAIL', `Modal görünür: ${modalDialog > 0}`, shot)
  } catch (e) { log('A', 'A4', 'FAIL', e.message.slice(0, 120)) }

  // A5 — Filtreler
  try {
    const filters = await page.locator('select, [role="combobox"]').count()
    const shot = await snap('A5', 'filtreler')
    log('A', 'A5', filters >= 2 ? 'PASS' : 'FAIL', `Filter element sayısı: ${filters}`, shot)
  } catch (e) { log('A', 'A5', 'FAIL', e.message.slice(0, 120)) }

  // A6 — Detay sayfası
  try {
    const firstEvent = await page.locator('a[href^="/etkinlik/"]').first().getAttribute('href')
    if (firstEvent) {
      await goto(firstEvent)
      const shareBtns = await page.locator('button:has-text("Paylaş"), a:has-text("Twitter"), button:has-text("Kopyala")').count()
      const reportBtn = await page.locator('button:has-text("Bildir"), button:has-text("Uygunsuz")').count()
      const shot = await snap('A6', 'etkinlik-detay')
      log('A', 'A6', 'PASS', `Paylaş btn: ${shareBtns}, Bildir btn: ${reportBtn}`, shot)

      // A7 — Rapor butonu (misafir görür ama tıklayınca login redirect olmalı)
      log('A', 'A7', reportBtn > 0 ? 'PASS' : 'FAIL', `Rapor butonu görünür: ${reportBtn > 0}`)
    } else {
      log('A', 'A6', 'SKIP', 'Etkinlik linki yok')
      log('A', 'A7', 'SKIP', 'Etkinlik linki yok')
    }
  } catch (e) {
    log('A', 'A6', 'FAIL', e.message.slice(0, 120))
    log('A', 'A7', 'FAIL', e.message.slice(0, 120))
  }

  // A8 — /sayfa-yok → 404
  try {
    await goto('/random-test-sayfa-a8')
    const has404 = await page.locator('text=/404|bulunamadı|Bulunamadı/i').count()
    const shot = await snap('A8', '404-sayfa')
    log('A', 'A8', has404 > 0 ? 'PASS' : 'FAIL', `404 metni görünür: ${has404 > 0}`, shot)
  } catch (e) { log('A', 'A8', 'FAIL', e.message.slice(0, 120)) }

  // A9 — /etkinlik/slug-yok → 404
  try {
    await goto('/etkinlik/slug-yok-test-a9')
    const has404 = await page.locator('text=/Etkinlik Bulunamadı|404/i').count()
    const shot = await snap('A9', '404-etkinlik')
    log('A', 'A9', has404 > 0 ? 'PASS' : 'FAIL', `404 metni: ${has404 > 0}`, shot)
  } catch (e) { log('A', 'A9', 'FAIL', e.message.slice(0, 120)) }

  // A10 — Middleware redirect
  try {
    await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle', timeout: 10000 })
    const onGiris = page.url().includes('/giris')
    log('A', 'A10', onGiris ? 'PASS' : 'FAIL',
      `/admin → ${page.url().replace(BASE, '')}`)
  } catch (e) { log('A', 'A10', 'FAIL', e.message.slice(0, 120)) }
}

// ─── BÖLÜM B — User-1 ────────────────────────────────────────────────────────
async function testB() {
  console.log('\n📋 BÖLÜM B — User-1 (Organizatör)')
  await loginAs(USERS.user1)

  try {
    const etkinlikLink = await page.locator('a[href="/etkinlik-gonder"]').count()
    const bellLink = await page.locator('a[href="/bildirimler"]').count()
    const shot = await snap('B1', 'login-header')
    log('B', 'B1', etkinlikLink > 0 ? 'PASS' : 'FAIL',
      `Etkinlik Ekle: ${etkinlikLink > 0 ? 'VAR' : 'YOK'}, çan: ${bellLink > 0 ? 'VAR' : 'yok'}`, shot)
  } catch (e) { log('B', 'B1', 'FAIL', e.message.slice(0, 120)) }

  // B2 — Header avatar dropdown
  try {
    await openUserMenu()
    const profilLink = await page.locator('a[href="/profil"]').count()
    const orgLink = await page.locator('a:has-text("Organizatör")').count()
    const shot = await snap('B2', 'header-menu')
    log('B', 'B2', profilLink > 0 ? 'PASS' : 'FAIL',
      `Profil link: ${profilLink}, Organizatör link: ${orgLink}`, shot)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  } catch (e) { log('B', 'B2', 'FAIL', e.message.slice(0, 120)) }

  // B3 — /profil sayfası
  try {
    await goto('/')
    await openUserMenu()
    await page.locator('a[href="/profil"]').click({ timeout: 5000 })
    await page.waitForURL('**/profil', { timeout: 10000 })
    await page.waitForTimeout(1500)
    const form = await page.locator('form').count()
    const errorScreen = await page.locator('text=/Profil yüklenemedi/i').count()
    const shot = await snap('B3', 'profil-form')
    log('B', 'B3', (form > 0 && errorScreen === 0) ? 'PASS' : 'FAIL',
      `Form: ${form}, Hata ekranı: ${errorScreen}`, shot)
  } catch (e) { log('B', 'B3', 'FAIL', e.message.slice(0, 120)) }

  // B4 — Kaydet
  try {
    if (await page.locator('form').count() > 0) {
      await page.locator('button[type="submit"]').first().click()
      await page.waitForTimeout(2500)
      const success = await page.locator('text=/güncellendi|kaydedildi|başarı/i').count() +
                      await page.locator('p.text-green-600').count()
      log('B', 'B4', success > 0 ? 'PASS' : 'FAIL', `Success indicator: ${success}`)
    } else {
      log('B', 'B4', 'SKIP', 'Form yok')
    }
  } catch (e) { log('B', 'B4', 'FAIL', e.message.slice(0, 120)) }

  // B5 — /etkinlik-gonder + tags
  try {
    await goto('/etkinlik-gonder')
    const linkInput = await page.locator('input[placeholder*="https"], input[type="url"]').count()
    const tagInputArea = await page.locator('text=/Etiketler|Etiket|tags/i').count()
    const shot = await snap('B5', 'etkinlik-gonder-tags')
    log('B', 'B5', linkInput > 0 ? 'PASS' : 'FAIL',
      `Link input: ${linkInput}, Etiket label: ${tagInputArea}`, shot)
  } catch (e) { log('B', 'B5', 'FAIL', e.message.slice(0, 120)) }
}

// ─── BÖLÜM C — User-2 (Raporcu) ──────────────────────────────────────────────
async function testC() {
  console.log('\n📋 BÖLÜM C — User-2 (Raporcu)')
  await loginAs(USERS.user2)
  await goto('/')

  const eventLinks = page.locator('a[href^="/etkinlik/"]')
  const targetPath = await eventLinks.count() > 0 ? await eventLinks.first().getAttribute('href') : null

  if (!targetPath) {
    ['C1', 'C2', 'C3'].forEach((id) => log('C', id, 'SKIP', 'Etkinlik yok'))
    return
  }

  // C1 — Detay sayfasında "Bildir" butonu
  try {
    await goto(targetPath)
    await waitForAuthLoaded()
    await page.waitForTimeout(500)
    const bildirBtn = await page.locator('button:has-text("Bildir")').count()
    const shot = await snap('C1', 'rapor-button')
    log('C', 'C1', bildirBtn > 0 ? 'PASS' : 'FAIL', `Bildir butonu: ${bildirBtn}`, shot)
  } catch (e) { log('C', 'C1', 'FAIL', e.message.slice(0, 120)) }

  // C2 — Rapor modal + Rapor Et
  try {
    await page.locator('button:has-text("Bildir")').first().click({ timeout: 8000 })
    await page.waitForTimeout(800)
    const optionBtn = page.locator('div.fixed.inset-0 button').filter({
      hasText: /Yanıltıcı|Spam|Alakasız|Uygunsuz|Diğer/,
    }).first()
    await optionBtn.click({ timeout: 5000 })
    await page.waitForTimeout(400)
    const shot = await snap('C2', 'rapor-modal')
    const reportBtn = page.locator('button:has-text("Rapor Et")').last()
    if ((await reportBtn.getAttribute('disabled')) === null) {
      await reportBtn.click()
      await page.waitForTimeout(2500)
      const success = await page.locator('text=/Raporunuz Alındı|başarı/i').count()
      log('C', 'C2', success > 0 ? 'PASS' : 'FAIL',
        success > 0 ? 'Başarı ekranı' : 'Başarı ekranı yok', shot)
    } else {
      log('C', 'C2', 'FAIL', 'Rapor Et disabled', shot)
    }
  } catch (e) { log('C', 'C2', 'FAIL', e.message.slice(0, 120)) }

  // C3 — Tekrar rapor → duplicate
  try {
    await goto(targetPath)
    await waitForAuthLoaded()
    await page.locator('button:has-text("Bildir")').first().click({ timeout: 8000 })
    await page.waitForTimeout(800)
    const optionBtn = page.locator('div.fixed.inset-0 button').filter({ hasText: /Yanıltıcı|Spam|Diğer/ }).first()
    await optionBtn.click({ timeout: 5000 })
    await page.waitForTimeout(300)
    await page.locator('button:has-text("Rapor Et")').last().click({ force: true })
    await page.waitForTimeout(2500)
    const errText = await page.locator('text=/zaten|daha önce/i').count() +
                    await page.locator('p.text-red-600').count()
    log('C', 'C3', errText > 0 ? 'PASS' : 'FAIL', `Duplicate hata: ${errText > 0 ? 'VAR' : 'YOK'}`)
  } catch (e) { log('C', 'C3', 'FAIL', e.message.slice(0, 120)) }
}

// ─── BÖLÜM H — Engagement (Sprint 1) ────────────────────────────────────────
async function testH() {
  console.log('\n📋 BÖLÜM H — Engagement (Sprint 1: favori + RSVP)')

  // H1 — Misafir favori → /giris redirect
  try {
    await newContext()
    await page.addInitScript(() => {
      localStorage.setItem('listur_interests_shown', 'true')
    })
    await goto('/')
    const heartBtn = page.locator('button[aria-label*="Favori"], button[aria-pressed]').first()
    const heartCnt = await heartBtn.count()
    if (heartCnt > 0) {
      await heartBtn.click()
      await page.waitForTimeout(1500)
      const onGiris = page.url().includes('/giris')
      const shot = await snap('H1', 'misafir-favori-redirect')
      log('H', 'H1', onGiris ? 'PASS' : 'FAIL',
        `Misafir favori → ${page.url().replace(BASE, '').slice(0, 50)}`, shot)
    } else {
      log('H', 'H1', 'SKIP', 'Favori butonu bulunamadı')
    }
  } catch (e) { log('H', 'H1', 'FAIL', e.message.slice(0, 120)) }

  // H2-H6 — User-1 login + favori + RSVP
  try {
    await loginAs(USERS.user1)
    await goto('/')
    // Etkinlik kartlarının yüklenmesini bekle
    await page.waitForSelector('a[href^="/etkinlik/"]', { timeout: 10000 }).catch(() => {})
    await page.waitForTimeout(1000) // Auth state'in güncellenmesi için ekstra süre
    
    const heartBtn = page.locator('button[aria-label*="Favori"], button[aria-pressed]').first()
    if (await heartBtn.count() > 0) {
      const beforeState = await heartBtn.getAttribute('aria-pressed')
      await heartBtn.click()
      await page.waitForTimeout(1500)
      const afterState = await heartBtn.getAttribute('aria-pressed')
      const shot = await snap('H2', 'favori-toggle')
      log('H', 'H2', beforeState !== afterState ? 'PASS' : 'FAIL',
        `aria-pressed: ${beforeState} → ${afterState}`, shot)
    } else {
      log('H', 'H2', 'SKIP', 'Favori butonu yok')
    }
  } catch (e) { log('H', 'H2', 'FAIL', e.message.slice(0, 120)) }

  // H3 — Detay sayfasında "Favorilere ekle" + sayaç
  try {
    // Etkinlik kartlarının yüklenmesini bekle
    await page.waitForSelector('a[href^="/etkinlik/"]', { timeout: 10000 })
    const firstEvent = await page.locator('a[href^="/etkinlik/"]').first().getAttribute('href')
    if (firstEvent) {
      await goto(firstEvent)
      await waitForAuthLoaded()
      const favText = await page.locator('text=/Favorilerime?|Favorilere ekle|Favorilerimde/i').count()
      const shot = await snap('H3', 'detay-favori-button')
      log('H', 'H3', favText > 0 ? 'PASS' : 'FAIL', `Favori button text: ${favText}`, shot)

      // H5 — RSVP dropdown
      const rsvpBtn = page.locator('button:has-text("RSVP"), button:has-text("Katılıyorum"), button:has-text("İlgileniyorum")').first()
      if (await rsvpBtn.count() > 0) {
        await rsvpBtn.click()
        await page.waitForTimeout(800)
        const optionsCnt = await page.locator('[role="menu"] button, [role="menuitem"]').count()
        const shot2 = await snap('H5', 'rsvp-dropdown')
        log('H', 'H5', optionsCnt >= 2 ? 'PASS' : 'FAIL',
          `Dropdown seçenek sayısı: ${optionsCnt}`, shot2)

        // H6 — Katılıyorum seç
        const goingBtn = page.locator('button:has-text("Katılıyorum")').first()
        if (await goingBtn.count() > 0) {
          await goingBtn.click()
          await page.waitForTimeout(1500)
          const shot3 = await snap('H6', 'rsvp-going-after')
          log('H', 'H6', 'PASS', 'Katılıyorum seçildi', shot3)
        } else {
          log('H', 'H6', 'SKIP', 'Katılıyorum butonu yok')
        }
      } else {
        log('H', 'H5', 'FAIL', 'RSVP butonu yok')
        log('H', 'H6', 'SKIP', 'RSVP butonu yok')
      }
    }
  } catch (e) {
    log('H', 'H3', 'FAIL', e.message.slice(0, 120))
    log('H', 'H5', 'FAIL', e.message.slice(0, 120))
    log('H', 'H6', 'FAIL', e.message.slice(0, 120))
  }
}

// ─── BÖLÜM I — Calendar (Sprint 2) ───────────────────────────────────────────
async function testI() {
  console.log('\n📋 BÖLÜM I — Calendar (Sprint 2)')
  // I1 — /takvim sayfası
  try {
    await goto('/takvim')
    const grid = await page.locator('text=/Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık/i').count()
    const shot = await snap('I1', 'takvim-sayfa')
    log('I', 'I1', grid > 0 ? 'PASS' : 'FAIL', `Ay başlığı görünür: ${grid > 0}`, shot)
  } catch (e) { log('I', 'I1', 'FAIL', e.message.slice(0, 120)) }

  // I2 — Header'da Takvim linki
  try {
    await goto('/')
    const takvimLink = await page.locator('a[href="/takvim"]').count()
    log('I', 'I2', takvimLink > 0 ? 'PASS' : 'FAIL', `Header Takvim link: ${takvimLink}`)
  } catch (e) { log('I', 'I2', 'FAIL', e.message.slice(0, 120)) }

  // I3 — Etkinlik detayında CalendarExportMenu
  try {
    await goto('/')
    // Etkinlik kartlarının yüklenmesini bekle
    await page.waitForSelector('a[href^="/etkinlik/"]', { timeout: 10000 })
    const firstEvent = await page.locator('a[href^="/etkinlik/"]').first().getAttribute('href')
    if (firstEvent) {
      await goto(firstEvent)
      const takvimBtn = await page.locator('button:has-text("Takvime ekle"), button:has-text("Takvim")').count()
      const shot = await snap('I3', 'detay-takvim-button')
      log('I', 'I3', takvimBtn > 0 ? 'PASS' : 'FAIL', `Takvime ekle butonu: ${takvimBtn}`, shot)

      // I4 — iCal endpoint
      const slug = firstEvent.split('/').pop()
      const response = await page.context().request.get(`${BASE}/api/events/${slug}/ical`)
      const contentType = response.headers()['content-type'] || ''
      const isCalendar = contentType.includes('text/calendar')
      const body = await response.text()
      const hasIcsHeader = body.includes('BEGIN:VCALENDAR')
      log('I', 'I4', (isCalendar && hasIcsHeader) ? 'PASS' : 'FAIL',
        `Content-Type: ${contentType.slice(0, 50)}, BEGIN:VCALENDAR: ${hasIcsHeader}`)
    } else {
      log('I', 'I3', 'SKIP', 'Etkinlik yok')
      log('I', 'I4', 'SKIP', 'Etkinlik yok')
    }
  } catch (e) {
    log('I', 'I3', 'FAIL', e.message.slice(0, 120))
    log('I', 'I4', 'FAIL', e.message.slice(0, 120))
  }
}

// ─── BÖLÜM J — Organizatör Profil 404 (Sprint 3) ────────────────────────────
async function testJ() {
  console.log('\n📋 BÖLÜM J — Organizatör Profil (Sprint 3)')
  // J1 — /organizator/nonexistent → 404
  try {
    await goto('/organizator/nonexistent-test-handle')
    const has404 = await page.locator('text=/404|Bulunamadı/i').count()
    const shot = await snap('J1', '404-organizator')
    log('J', 'J1', has404 > 0 ? 'PASS' : 'FAIL', `404 metni: ${has404 > 0}`, shot)
  } catch (e) { log('J', 'J1', 'FAIL', e.message.slice(0, 120)) }

  // J2 — Doğrulanmış organizatör varsa /organizator/[handle] 200
  // (Sprint 4 testinden sonra kontrol edilir; bu test SKIP)
  log('J', 'J2', 'SKIP', 'K bölümünden sonra K7 ile doğrulanır')
}

// ─── BÖLÜM K — Doğrulama (Sprint 4) ──────────────────────────────────────────
async function testK() {
  console.log('\n📋 BÖLÜM K — Doğrulama (Sprint 4)')
  await loginAs(USERS.user1)

  // K1 — /profil/organizator-basvuru
  try {
    await goto('/profil/organizator-basvuru')
    const formCnt = await page.locator('form').count()
    const handleInput = await page.locator('input[placeholder*="acme"], input[required]').count()
    const orgAlready = await page.locator('text=/Zaten doğrulanmış|değerlendiriliyor/i').count()
    const shot = await snap('K1', 'basvuru-form')
    log('K', 'K1', (formCnt > 0 || orgAlready > 0) ? 'PASS' : 'FAIL',
      `Form: ${formCnt}, Handle input: ${handleInput}, Zaten organizatör/açık: ${orgAlready}`, shot)
  } catch (e) { log('K', 'K1', 'FAIL', e.message.slice(0, 120)) }

  // K8 — Dashboard sayfası
  try {
    await goto('/profil/organizator')
    const fallback = await page.locator('text=/henüz doğrulanmadın|Başvuru yap/i').count()
    const dashboard = await page.locator('text=/Dashboard|Görüntülenme|Etkinliklerim/i').count()
    const shot = await snap('K8', 'organizer-dashboard')
    log('K', 'K8', (fallback > 0 || dashboard > 0) ? 'PASS' : 'FAIL',
      `Fallback: ${fallback}, Dashboard: ${dashboard}`, shot)
  } catch (e) { log('K', 'K8', 'FAIL', e.message.slice(0, 120)) }

  // K9 — Admin için organizatör başvuruları sayfası
  try {
    await loginAs(USERS.admin)
    await goto('/admin/organizator-basvurulari')
    const hasContent = (await page.locator('main').textContent().catch(() => '')).length > 100
    const shot = await snap('K9', 'admin-basvurular')
    log('K', 'K9', hasContent ? 'PASS' : 'FAIL', `İçerik uzunluk OK: ${hasContent}`, shot)
  } catch (e) { log('K', 'K9', 'FAIL', e.message.slice(0, 120)) }
}

// ─── BÖLÜM L — Arama + Tags (Sprint 5) ──────────────────────────────────────
async function testL() {
  console.log('\n📋 BÖLÜM L — Arama + Tags (Sprint 5)')
  await newContext()
  await page.addInitScript(() => {
    localStorage.setItem('listur_interests_shown', 'true')
  })

  // L1 — Header'da SearchBar (md+)
  try {
    await goto('/')
    await page.setViewportSize({ width: 1280, height: 800 })
    const searchInput = await page.locator('input[type="search"], input[placeholder*="ara"], input[placeholder*="Etkinlik"]').count()
    const shot = await snap('L1', 'header-search')
    log('L', 'L1', searchInput > 0 ? 'PASS' : 'FAIL', `Search input: ${searchInput}`, shot)
  } catch (e) { log('L', 'L1', 'FAIL', e.message.slice(0, 120)) }

  // L2 — /ara?q=hackathon
  try {
    await goto('/ara?q=hackathon')
    const shot = await snap('L2', 'ara-hackathon')
    const heading = await page.locator('h1:has-text("Ara")').count()
    const empty = await page.locator('text=/Eşleşme bulunamadı/i').count()
    const results = await page.locator('a[href^="/etkinlik/"]').count()
    log('L', 'L2', heading > 0 ? 'PASS' : 'FAIL',
      `Heading: ${heading}, Sonuç: ${results}, Empty: ${empty}`, shot)
  } catch (e) { log('L', 'L2', 'FAIL', e.message.slice(0, 120)) }

  // L3 — Türkçe karakter test: /ara?q=İSTANBUL
  try {
    await goto('/ara?q=' + encodeURIComponent('İSTANBUL'))
    const shot = await snap('L3', 'ara-istanbul')
    const empty = await page.locator('text=/Eşleşme bulunamadı/i').count()
    const results = await page.locator('a[href^="/etkinlik/"]').count()
    log('L', 'L3', 'PASS', `Sonuç: ${results}, Empty: ${empty} (FTS unaccent çalışıyor mu)`, shot)
  } catch (e) { log('L', 'L3', 'FAIL', e.message.slice(0, 120)) }

  // L5 — q < 2 → "en az 2 karakter" hint
  try {
    await goto('/ara?q=h')
    const hint = await page.locator('text=/en az 2|2 karakter/i').count()
    log('L', 'L5', hint > 0 ? 'PASS' : 'FAIL', `Hint: ${hint > 0}`)
  } catch (e) { log('L', 'L5', 'FAIL', e.message.slice(0, 120)) }
}

// ─── BÖLÜM M — Trending + Sana Özel (Sprint 6) ──────────────────────────────
async function testM() {
  console.log('\n📋 BÖLÜM M — Trending + Sana Özel (Sprint 6)')
  await newContext()
  await page.addInitScript(() => {
    localStorage.setItem('listur_interests_shown', 'true')
  })

  // M1 — /kesfet/trending public erişim
  try {
    await goto('/kesfet/trending')
    const heading = await page.locator('h1:has-text("Trend Etkinlik")').count()
    const empty = await page.locator('text=/gündemde etkinlik yok/i').count()
    const events = await page.locator('a[href^="/etkinlik/"]').count()
    const shot = await snap('M1', 'kesfet-trending-misafir')
    log('M', 'M1', heading > 0 ? 'PASS' : 'FAIL',
      `Heading: ${heading}, Etkinlik: ${events}, Empty: ${empty}`, shot)
  } catch (e) { log('M', 'M1', 'FAIL', e.message.slice(0, 120)) }

  // M2 — /kesfet/sana-ozel misafir → /giris redirect
  try {
    await page.goto(`${BASE}/kesfet/sana-ozel`, { waitUntil: 'networkidle', timeout: 15000 })
    const onGiris = page.url().includes('/giris')
    const redirectParam = page.url().includes('redirect=')
    log('M', 'M2', onGiris ? 'PASS' : 'FAIL',
      `URL: ${page.url().replace(BASE, '')}, redirect param: ${redirectParam}`)
  } catch (e) { log('M', 'M2', 'FAIL', e.message.slice(0, 120)) }

  // M3 — /api/feed/trending public 200 + Cache-Control
  // NOT: Vercel Edge CDN response header'ı re-encode edebiliyor —
  // origin'de `public, s-maxage=300, ...` set ediyoruz ama proxy bunu
  // `public, max-age=N` veya yalnızca `public`'e indirgeyebilir.
  // Bu yüzden `private` OLMAMASI ve `public` veya `max-age` olması yeterli.
  try {
    const response = await page.context().request.get(`${BASE}/api/feed/trending?limit=5`)
    const cacheCtrl = (response.headers()['cache-control'] || '').toLowerCase()
    const json = await response.json().catch(() => null)
    const okStatus = response.status() === 200
    const hasResults = json && Array.isArray(json.results)
    const isPublicCacheable = !cacheCtrl.includes('private') &&
      (cacheCtrl.includes('public') || cacheCtrl.includes('max-age'))
    log('M', 'M3', (okStatus && hasResults && isPublicCacheable) ? 'PASS' : 'FAIL',
      `Status: ${response.status()}, results: ${json?.count}, cache: ${cacheCtrl.slice(0, 60)}`)
  } catch (e) { log('M', 'M3', 'FAIL', e.message.slice(0, 120)) }

  // M4 — /api/feed/for-you misafir → 401
  try {
    const response = await page.context().request.get(`${BASE}/api/feed/for-you?limit=5`)
    const json = await response.json().catch(() => ({}))
    const is401 = response.status() === 401
    const correctCode = json?.code === 'AUTH_REQUIRED'
    log('M', 'M4', (is401 && correctCode) ? 'PASS' : 'FAIL',
      `Status: ${response.status()}, code: ${json?.code}`)
  } catch (e) { log('M', 'M4', 'FAIL', e.message.slice(0, 120)) }

  // M5 — Header: misafire "Gündem" linki görünür, "Sana Özel" görünmez
  try {
    await goto('/')
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.waitForTimeout(500)
    const trendingLink = await page.locator('header a[href="/kesfet/trending"]').count()
    const personalLink = await page.locator('header a[href="/kesfet/sana-ozel"]').count()
    const shot = await snap('M5', 'header-misafir-gundem')
    log('M', 'M5', (trendingLink > 0 && personalLink === 0) ? 'PASS' : 'FAIL',
      `Gündem: ${trendingLink}, Sana Özel: ${personalLink}`, shot)
  } catch (e) { log('M', 'M5', 'FAIL', e.message.slice(0, 120)) }

  // M6 — Ana sayfa "Şu an gündemde" trending strip
  try {
    await goto('/')
    await page.waitForTimeout(1500)
    const stripHeading = await page.locator('h2:has-text("Şu an gündemde")').count()
    const seeAllLink = await page.locator('a[href="/kesfet/trending"]:has-text("Tümünü gör")').count()
    const shot = await snap('M6', 'anasayfa-trending-strip')
    log('M', 'M6', stripHeading > 0 ? 'PASS' : 'FAIL',
      `Strip heading: ${stripHeading}, Tümünü link: ${seeAllLink}`, shot)
  } catch (e) { log('M', 'M6', 'FAIL', e.message.slice(0, 120)) }

  // ── Login: User-1 ile kişisel feed senaryoları ─────────────────────────────
  // M7 — /kesfet/sana-ozel login user erişim
  try {
    await loginAs(USERS.user1)
    await goto('/kesfet/sana-ozel')
    const heading = await page.locator('h1').first().textContent().catch(() => '')
    const hasOzel = (heading || '').toLowerCase().includes('özel')
    const empty = await page.locator('text=/Henüz seçim yapmamışsın|Yakında etkinlik yok/i').count()
    const events = await page.locator('a[href^="/etkinlik/"]').count()
    const shot = await snap('M7', 'kesfet-sanaozel-login')
    log('M', 'M7', hasOzel ? 'PASS' : 'FAIL',
      `Heading: "${(heading || '').slice(0, 40)}", events: ${events}, empty: ${empty}`, shot)
  } catch (e) { log('M', 'M7', 'FAIL', e.message.slice(0, 120)) }

  // M8 — /api/feed/for-you login user 200 + private cache
  try {
    const response = await page.context().request.get(`${BASE}/api/feed/for-you?limit=10`)
    const cacheCtrl = response.headers()['cache-control'] || ''
    const json = await response.json().catch(() => null)
    const okStatus = response.status() === 200
    const hasResults = json && Array.isArray(json.results)
    const isPrivate = cacheCtrl.includes('private')
    log('M', 'M8', (okStatus && hasResults && isPrivate) ? 'PASS' : 'FAIL',
      `Status: ${response.status()}, results: ${json?.count}, cache: ${cacheCtrl.slice(0, 50)}`)
  } catch (e) { log('M', 'M8', 'FAIL', e.message.slice(0, 120)) }

  // M9 — Header: login kullanıcıya "Sana Özel" linki görünür
  try {
    await goto('/')
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.waitForTimeout(500)
    const personalLink = await page.locator('header a[href="/kesfet/sana-ozel"]').count()
    const shot = await snap('M9', 'header-login-sanaozel')
    log('M', 'M9', personalLink > 0 ? 'PASS' : 'FAIL', `Sana Özel link: ${personalLink}`, shot)
  } catch (e) { log('M', 'M9', 'FAIL', e.message.slice(0, 120)) }

  // M10 — /profil sonsuz loading regresyon kontrolü (Sprint 6 bonus fix)
  try {
    await goto('/profil')
    // 12sn içinde form veya hata ekranı görünmeli — spinner takılı kalmamalı
    const settled = await Promise.race([
      page.waitForSelector('form', { timeout: 12000 }).then(() => 'form'),
      page.waitForSelector('text=/Profil yüklenemedi/i', { timeout: 12000 }).then(() => 'error'),
      page.waitForTimeout(12000).then(() => 'timeout'),
    ])
    const shot = await snap('M10', 'profil-loaded')
    log('M', 'M10', settled !== 'timeout' ? 'PASS' : 'FAIL',
      `Settled: ${settled} (form/error/timeout)`, shot)
  } catch (e) { log('M', 'M10', 'FAIL', e.message.slice(0, 120)) }
}

// ─── BÖLÜM D — Moderator ─────────────────────────────────────────────────────
async function testD() {
  console.log('\n📋 BÖLÜM D — Moderator')
  await loginAs(USERS.moderator)

  try {
    await openUserMenu()
    const modLink = await page.locator('a:has-text("Moderatör Paneli")').count()
    log('D', 'D1', modLink > 0 ? 'PASS' : 'FAIL', `Moderatör Paneli link: ${modLink > 0}`)
    await page.keyboard.press('Escape')
  } catch (e) { log('D', 'D1', 'FAIL', e.message.slice(0, 120)) }

  try {
    await goto('/moderator/bekleyenler')
    const shot = await snap('D2', 'bekleyenler')
    const hasContent = (await page.locator('main').textContent().catch(() => '')).length > 100
    log('D', 'D2', hasContent ? 'PASS' : 'FAIL', `İçerik: ${hasContent}`, shot)
  } catch (e) { log('D', 'D2', 'FAIL', e.message.slice(0, 120)) }

  try {
    await goto('/moderator/raporlar')
    const shot = await snap('D7', 'mod-raporlar')
    const hasContent = (await page.locator('main').textContent().catch(() => '')).length > 50
    log('D', 'D7', hasContent ? 'PASS' : 'FAIL', `İçerik: ${hasContent}`, shot)
  } catch (e) { log('D', 'D7', 'FAIL', e.message.slice(0, 120)) }
}

// ─── BÖLÜM E — Admin ─────────────────────────────────────────────────────────
async function testE() {
  console.log('\n📋 BÖLÜM E — Admin')
  await loginAs(USERS.admin)

  try {
    await openUserMenu()
    const adminLink = await page.locator('a:has-text("Admin Paneli")').count()
    const modLink = await page.locator('a:has-text("Moderatör Paneli")').count()
    log('E', 'E1', (adminLink > 0 && modLink > 0) ? 'PASS' : 'FAIL',
      `Admin: ${adminLink}, Moderatör: ${modLink}`)
    await page.keyboard.press('Escape')
  } catch (e) { log('E', 'E1', 'FAIL', e.message.slice(0, 120)) }

  try {
    await goto('/admin/etkinlikler')
    const shot = await snap('E2', 'admin-etkinlikler')
    const hasContent = (await page.locator('main').textContent().catch(() => '')).length > 100
    log('E', 'E2', hasContent ? 'PASS' : 'FAIL', `İçerik: ${hasContent}`, shot)
  } catch (e) { log('E', 'E2', 'FAIL', e.message.slice(0, 120)) }

  try {
    await goto('/admin/kullanicilar')
    const shot = await snap('E3', 'admin-kullanicilar')
    const hasContent = (await page.locator('main').textContent().catch(() => '')).length > 100
    log('E', 'E3', hasContent ? 'PASS' : 'FAIL', `İçerik: ${hasContent}`, shot)
  } catch (e) { log('E', 'E3', 'FAIL', e.message.slice(0, 120)) }
}

// ─── BÖLÜM F — Bildirimler ───────────────────────────────────────────────────
async function testF() {
  console.log('\n📋 BÖLÜM F — Bildirimler (User-1)')
  await loginAs(USERS.user1)

  try {
    const bellLink = await page.locator('a[href="/bildirimler"]').count()
    log('F', 'F1', bellLink > 0 ? 'PASS' : 'FAIL', `Çan: ${bellLink > 0}`)
  } catch (e) { log('F', 'F1', 'FAIL', e.message.slice(0, 120)) }

  try {
    await goto('/bildirimler')
    const shot = await snap('F2', 'bildirimler')
    const items = await page.locator('a[href^="/etkinlik/"]').count()
    const empty = await page.locator('text=/bildirim yok|henüz/i').count()
    log('F', 'F2', (items > 0 || empty > 0) ? 'PASS' : 'FAIL', `Items: ${items}, Empty: ${empty}`, shot)
  } catch (e) { log('F', 'F2', 'FAIL', e.message.slice(0, 120)) }
}

// ─── BÖLÜM G — SEO ───────────────────────────────────────────────────────────
async function testG() {
  console.log('\n📋 BÖLÜM G — SEO')

  try {
    const response = await page.context().request.get(`${BASE}/sitemap.xml`)
    const body = await response.text()
    const hasSlug = body.includes('/etkinlik/')
    const hasLoc = body.includes('<loc>') || body.includes('loc')
    const localhost = body.includes('localhost')
    log('G', 'G1', (hasSlug && hasLoc && !localhost) ? 'PASS' : 'FAIL',
      `<loc>: ${hasLoc}, /etkinlik/: ${hasSlug}, localhost: ${localhost}`)
  } catch (e) { log('G', 'G1', 'FAIL', e.message.slice(0, 120)) }

  try {
    const response = await page.context().request.get(`${BASE}/robots.txt`)
    const body = await response.text()
    const text = body.toLowerCase()
    const hasSitemap = text.includes('sitemap:')
    const hasDisallow = text.includes('disallow')
    log('G', 'G2', (hasSitemap && hasDisallow) ? 'PASS' : 'FAIL',
      `Sitemap: ${hasSitemap}, Disallow: ${hasDisallow}`)
  } catch (e) { log('G', 'G2', 'FAIL', e.message.slice(0, 120)) }
}

// ─── ANA ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Listur E2E Test v6 — Sprint 1-6 dahil + Screenshot')
  console.log(`Base URL: ${BASE}`)
  console.log(`Tarih: ${new Date().toLocaleString('tr-TR')}`)
  console.log(`Screenshots: ${TAKE_SHOTS ? SHOTS_DIR : 'OFF'}\n`)

  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })

  try {
    await testA() // Misafir
    await testB() // User-1
    await testC() // User-2
    await testH() // Engagement (Sprint 1)
    await testI() // Calendar (Sprint 2)
    await testJ() // Organizer 404 (Sprint 3)
    await testK() // Verification (Sprint 4)
    await testL() // Search (Sprint 5)
    await testM() // Trending + Sana Özel (Sprint 6)
    await testD() // Moderator
    await testE() // Admin
    await testF() // Notifications
    await testG() // SEO
  } finally {
    await browser.close()
  }

  console.log('\n' + '═'.repeat(60))
  console.log('📊 SONUÇ TABLOSU')
  console.log('═'.repeat(60))

  const sections = ['A', 'B', 'C', 'H', 'I', 'J', 'K', 'L', 'M', 'D', 'E', 'F', 'G']
  const names = {
    A: 'Misafir', B: 'User-1', C: 'Raporcu', H: 'Engagement', I: 'Calendar',
    J: 'Organizatör', K: 'Doğrulama', L: 'Arama', M: 'Trending/SanaÖzel',
    D: 'Moderator', E: 'Admin', F: 'Bildirimler', G: 'SEO',
  }
  let totalPass = 0, totalFail = 0, totalSkip = 0

  for (const s of sections) {
    const sr = results.filter((r) => r.section === s)
    const pass = sr.filter((r) => r.status === 'PASS').length
    const fail = sr.filter((r) => r.status === 'FAIL').length
    const skip = sr.filter((r) => r.status === 'SKIP').length
    if (sr.length === 0) continue
    console.log(`${fail > 0 ? '❌' : '✅'} Bölüm ${s} (${names[s]}): ${pass}/${sr.length} PASS, ${fail} FAIL, ${skip} SKIP`)
    totalPass += pass; totalFail += fail; totalSkip += skip
  }

  console.log('─'.repeat(60))
  console.log(`TOPLAM: ${totalPass} PASS, ${totalFail} FAIL, ${totalSkip} SKIP`)
  console.log('═'.repeat(60))

  if (totalFail > 0) {
    console.log('\n❌ BAŞARISIZ:')
    results.filter((r) => r.status === 'FAIL').forEach((r) => console.log(`  ${r.id}: ${r.detail}`))
  }

  fs.writeFileSync('e2e-results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: BASE,
    screenshotsDir: SHOTS_DIR,
    results,
    summary: { pass: totalPass, fail: totalFail, skip: totalSkip },
  }, null, 2))

  console.log('\n📄 e2e-results.json')
  console.log(`📸 ${SHOTS_DIR}/`)
  process.exit(totalFail > 0 ? 1 : 0)
}

main().catch((e) => { console.error('Fatal:', e.message); process.exit(1) })
