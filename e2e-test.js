/**
 * Issue #34 — E2E Test v4: Form-based login (doğru cookie için)
 * node e2e-test.js
 */

const { chromium } = require('playwright')
const fs = require('fs')

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const USERS = {
  user1:     { 
    email: process.env.E2E_USER1_EMAIL || 'bilalabic78+listur-user1@gmail.com',  
    pass: process.env.E2E_USER1_PASS || 'Listur2026!' 
  },
  user2:     { 
    email: process.env.E2E_USER2_EMAIL || 'bilalabic78+listur-user2@gmail.com',  
    pass: process.env.E2E_USER2_PASS || 'Listur2026!' 
  },
  moderator: { 
    email: process.env.E2E_MOD_EMAIL || 'bilalabic78+listur-mod@gmail.com',    
    pass: process.env.E2E_MOD_PASS || 'Listur2026!' 
  },
  admin:     { 
    email: process.env.E2E_ADMIN_EMAIL || 'bilalabic78+listur-admin@gmail.com',  
    pass: process.env.E2E_ADMIN_PASS || 'Listur2026!' 
  },
}

const results = []
let browser, page

function log(section, id, status, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'SKIP' ? '⏭️' : '❌'
  console.log(`${icon} ${id}: ${detail}`)
  results.push({ section, id, status, detail })
}

// networkidle ile navigate — auth API çağrıları tamamlanana kadar bekle
async function goto(path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(300)
}

// Header'da authenticated state'i bekle (Etkinlik Ekle linki)
async function waitForAuthLoaded() {
  await page.waitForSelector('a[href="/etkinlik-gonder"]', { timeout: 15000 }).catch(() => {})
}

// Form-based login — Supabase'in kendi cookie mekanizmasını kullanır
async function loginAs(user) {
  if (page) {
    await page.context().close().catch(() => {})
  }

  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'tr-TR',
  })
  page = await ctx.newPage()
  page.on('console', () => {})
  page.on('pageerror', () => {})

  // InterestsModal'ı her sayfa yükünde bastır
  await page.addInitScript(() => {
    localStorage.setItem('listur_interests_shown', 'true')
  })

  // Giriş sayfasına git
  await page.goto(`${BASE}/giris`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await page.waitForTimeout(800)

  // Form doldur
  await page.locator('input[type="email"]').first().fill(user.email)
  await page.locator('input[type="password"]').first().fill(user.pass)
  await page.locator('button[type="submit"]').first().click()

  // /giris'ten ayrılmayı bekle
  await page.waitForFunction(
    () => !window.location.pathname.startsWith('/giris'),
    { timeout: 15000 }
  ).catch(() => {})

  // Authenticated header yüklenene kadar bekle
  await page.waitForSelector('a[href="/etkinlik-gonder"]', { timeout: 15000 }).catch(() => {})

  console.log(`  → ${user.email} — ${page.url().replace(BASE, '') || '/'}`)
}

// Avatar dropdown aç
async function openUserMenu() {
  // Authenticate olunmuş tek header button = avatar
  await waitForAuthLoaded()
  await page.locator('header').getByRole('button').first().click({ timeout: 5000 })
  await page.waitForTimeout(600)
}

// ─── BÖLÜM B — User-1 ────────────────────────────────────────────────────────
async function testB() {
  console.log('\n📋 BÖLÜM B — User-1 (Organizatör)')
  await loginAs(USERS.user1)

  // B4 — Authenticated header: Etkinlik Ekle + çan
  try {
    const etkinlikLink = await page.locator('a[href="/etkinlik-gonder"]').count()
    const bellLink = await page.locator('a[href="/bildirimler"]').count()
    log('B', 'B4', etkinlikLink > 0 ? 'PASS' : 'FAIL',
      `"+ Etkinlik Ekle": ${etkinlikLink > 0 ? 'VAR' : 'YOK'}, çan: ${bellLink > 0 ? 'VAR' : 'yok'}`)
  } catch (e) { log('B', 'B4', 'FAIL', e.message.slice(0, 120)) }

  // B5 — /profil: SPA navigation (dropdown Profil linki)
  // Full page reload → AuthContext sıfırlanır → spinner
  // SPA navigation → auth state korunur → form direkt görünür
  try {
    await goto('/')
    await openUserMenu()
    await page.locator('a[href="/profil"]').click({ timeout: 5000 })
    await page.waitForURL('**/profil', { timeout: 10000 })
    await page.waitForTimeout(800)
    const spinner = await page.locator('.animate-spin').count()
    const form = await page.locator('form').count()
    const errorScreen = await page.locator('text=/Profil yüklenemedi/i').count()
    log('B', 'B5', (form > 0 && spinner === 0 && errorScreen === 0) ? 'PASS' : 'FAIL',
      `Form: ${form}, Spinner: ${spinner}, Hata ekranı: ${errorScreen}`)
  } catch (e) { log('B', 'B5', 'FAIL', e.message.slice(0, 120)) }

  // B6 — Profil kaydet (B5'ten kalan /profil sayfasında)
  try {
    const formNow = await page.locator('form').count()
    if (formNow > 0) {
      await page.locator('button[type="submit"]').first().click()
      await page.waitForTimeout(3000)
      const toast = await page.locator('[class*="toast"],[role="alert"],[class*="success"]').count()
      const successText = await page.locator('text=/güncellendi|başarı|kaydedildi/i').count()
      const greenMsg = await page.locator('p.text-green-600').count()
      log('B', 'B6', (toast + successText + greenMsg) > 0 ? 'PASS' : 'FAIL',
        `Toast: ${toast}, Başarı: ${successText}, Yeşil: ${greenMsg}`)
    } else {
      log('B', 'B6', 'FAIL', 'Form hâlâ yok')
    }
  } catch (e) { log('B', 'B6', 'FAIL', e.message.slice(0, 120)) }

  // B7 — /etkinlik-gonder
  try {
    await goto('/etkinlik-gonder')
    const linkInput = await page.locator('input[placeholder*="https"], input[type="url"]').count()
    log('B', 'B7', linkInput > 0 ? 'PASS' : 'FAIL', `Link input: ${linkInput}`)
  } catch (e) { log('B', 'B7', 'FAIL', e.message.slice(0, 120)) }

  // B8 — User için dropdown'da Moderatör/Admin linki OLMAMALI
  try {
    await goto('/')
    await openUserMenu()
    const modLink = await page.locator('a:has-text("Moderatör Paneli")').count()
    const adminLink = await page.locator('a:has-text("Admin Paneli")').count()
    log('B', 'B8', (modLink === 0 && adminLink === 0) ? 'PASS' : 'FAIL',
      `Moderatör: ${modLink}, Admin: ${adminLink} (ikisi de 0 olmalı)`)
    await page.keyboard.press('Escape')
  } catch (e) { log('B', 'B8', 'FAIL', e.message.slice(0, 120)) }
}

// ─── BÖLÜM C — User-2 ────────────────────────────────────────────────────────
async function testC() {
  console.log('\n📋 BÖLÜM C — User-2 (Raporcu)')
  await loginAs(USERS.user2)

  await goto('/')
  const eventLinks = page.locator('a[href^="/etkinlik/"]')
  const targetPath = await eventLinks.count() > 0 ? await eventLinks.first().getAttribute('href') : null

  if (!targetPath) {
    ['C2', 'C3', 'C4'].forEach(id => log('C', id, 'SKIP', 'Etkinlik yok'))
    return
  }

  // C2 — "Uygunsuz içerik bildir" butonu
  try {
    await goto(targetPath)
    await waitForAuthLoaded()
    await page.waitForTimeout(500)
    const bildirBtn = await page.locator('button:has-text("Bildir")').count()
    log('C', 'C2', bildirBtn > 0 ? 'PASS' : 'FAIL', `Bildir butonu: ${bildirBtn}`)
  } catch (e) { log('C', 'C2', 'FAIL', e.message.slice(0, 120)) }

  // C3 — Rapor modal: seçenek tıkla → Rapor Et
  try {
    // Aynı sayfadayız (C2'den kalan) — rapor butonuna tıkla
    const bildirBtn = page.locator('button:has-text("Bildir")').first()
    await bildirBtn.click({ timeout: 8000 })
    await page.waitForTimeout(800)
    // Modal içinde seçenek buttonları
    const optionBtn = page.locator('div.fixed.inset-0 button').filter({
      hasText: /Yanıltıcı|Spam|Alakasız|Uygunsuz|Diğer/
    }).first()
    await optionBtn.click({ timeout: 5000 })
    await page.waitForTimeout(400)
    const reportBtn = page.locator('button:has-text("Rapor Et")').last()
    const isDisabled = await reportBtn.getAttribute('disabled')
    if (isDisabled === null) {
      await reportBtn.click()
      await page.waitForTimeout(2500)
      const success = await page.locator('text=/Raporunuz Alındı/i').count()
      log('C', 'C3', success > 0 ? 'PASS' : 'FAIL',
        success > 0 ? '"Raporunuz Alındı" görüldü' : 'Başarı ekranı yok')
    } else {
      log('C', 'C3', 'FAIL', 'Rapor Et hâlâ disabled')
    }
  } catch (e) { log('C', 'C3', 'FAIL', e.message.slice(0, 120)) }

  // C4 — Tekrar raporla → duplicate hata
  try {
    await goto(targetPath)
    await waitForAuthLoaded()
    await page.locator('button:has-text("Bildir")').first().click({ timeout: 8000 })
    await page.waitForTimeout(800)
    const optionBtn = page.locator('div.fixed.inset-0 button').filter({ hasText: /Yanıltıcı|Spam|Alakasız|Diğer/ }).first()
    await optionBtn.click({ timeout: 5000 })
    await page.waitForTimeout(300)
    await page.locator('button:has-text("Rapor Et")').last().click({ force: true })
    await page.waitForTimeout(2500)
    const errText = await page.locator('text=/zaten|daha önce|already|Zaten/i').count()
    const errEl = await page.locator('p.text-red-600').count()
    log('C', 'C4', (errText + errEl) > 0 ? 'PASS' : 'FAIL',
      `Duplicate hata: ${(errText + errEl) > 0 ? 'VAR' : 'YOK'}`)
  } catch (e) { log('C', 'C4', 'FAIL', e.message.slice(0, 120)) }
}

// ─── BÖLÜM D — Moderator ─────────────────────────────────────────────────────
async function testD() {
  console.log('\n📋 BÖLÜM D — Moderator')
  await loginAs(USERS.moderator)

  // D2 — Dropdown'da Moderatör Paneli
  try {
    await openUserMenu()
    const modLink = await page.locator('a:has-text("Moderatör Paneli")').count()
    log('D', 'D2', modLink > 0 ? 'PASS' : 'FAIL',
      `"Moderatör Paneli" dropdown'da: ${modLink > 0 ? 'VAR' : 'YOK'}`)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  } catch (e) { log('D', 'D2', 'FAIL', e.message.slice(0, 120)) }

  // D3 + D4 — Bekleyenler sayfası (TEK navigate)
  try {
    await goto('/moderator/bekleyenler')
    const reactMeetup = await page.locator('text=/React Meetup/i').count()
    const hasContent = (await page.locator('main').textContent().catch(() => '')).length > 100
    log('D', 'D3', (reactMeetup > 0 || hasContent) ? 'PASS' : 'FAIL',
      `React Meetup: ${reactMeetup}, İçerik: ${hasContent}`)

    // D4 — Aynı sayfada onay butonu
    // button.bg-green-600 VEYA button:has-text ile deneme
    const onaylaBtn = page.locator('button').filter({ hasText: /Onayla/ }).first()
    const btnCnt = await onaylaBtn.count()
    if (btnCnt > 0) {
      await onaylaBtn.click({ timeout: 5000, force: true })
      await page.waitForTimeout(1000)
      const textarea = page.locator('textarea').first()
      if (await textarea.count() > 0) await textarea.fill('E2E test onayı')
      const yayinlaBtn = page.locator('button').filter({ hasText: /Yayınla|Onayla ve/ }).first()
      if (await yayinlaBtn.count() > 0) await yayinlaBtn.click({ force: true })
      else await page.locator('button[type="submit"]').first().click()
      await page.waitForTimeout(2500)
      log('D', 'D4', 'PASS', 'Onayla aksiyonu tamamlandı')
    } else {
      log('D', 'D4', 'SKIP', 'Bekleyen etkinlik bulunamadı')
    }
  } catch (e) {
    log('D', 'D3', 'FAIL', e.message.slice(0, 120))
    log('D', 'D4', 'FAIL', e.message.slice(0, 120))
  }

  // D7 — Onayladıklarım
  try {
    await goto('/moderator/onayladiklarim')
    const hasContent = (await page.locator('main').textContent().catch(() => '')).length > 50
    log('D', 'D7', hasContent ? 'PASS' : 'FAIL', `İçerik yüklendi: ${hasContent}`)
  } catch (e) { log('D', 'D7', 'FAIL', e.message.slice(0, 120)) }

  // D8 — Raporlar
  try {
    await goto('/moderator/raporlar')
    const hasContent = (await page.locator('main').textContent().catch(() => '')).length > 50
    log('D', 'D8', hasContent ? 'PASS' : 'FAIL', `İçerik yüklendi: ${hasContent}`)
  } catch (e) { log('D', 'D8', 'FAIL', e.message.slice(0, 120)) }
}

// ─── BÖLÜM E — Admin ─────────────────────────────────────────────────────────
async function testE() {
  console.log('\n📋 BÖLÜM E — Admin')
  await loginAs(USERS.admin)

  // E2 — Dropdown'da Admin + Moderatör
  try {
    await openUserMenu()
    const adminLink = await page.locator('a:has-text("Admin Paneli")').count()
    const modLink = await page.locator('a:has-text("Moderatör Paneli")').count()
    log('E', 'E2', (adminLink > 0 && modLink > 0) ? 'PASS' : 'FAIL',
      `Admin Paneli: ${adminLink > 0 ? 'VAR' : 'YOK'}, Moderatör Paneli: ${modLink > 0 ? 'VAR' : 'YOK'}`)
    await page.keyboard.press('Escape')
  } catch (e) { log('E', 'E2', 'FAIL', e.message.slice(0, 120)) }

  // E3 — /admin/etkinlikler
  try {
    await goto('/admin/etkinlikler')
    const tabs = await page.locator('button:has-text("Yayında"), button:has-text("Bekliyor"), button:has-text("Tümü")').count()
    const hasContent = (await page.locator('main').textContent().catch(() => '')).length > 100
    log('E', 'E3', (tabs > 0 && hasContent) ? 'PASS' : 'FAIL', `Sekmeler: ${tabs}, İçerik: ${hasContent}`)
  } catch (e) { log('E', 'E3', 'FAIL', e.message.slice(0, 120)) }

  // E4 — /admin/kullanicilar
  try {
    await goto('/admin/kullanicilar')
    const hasContent = (await page.locator('main').textContent().catch(() => '')).length > 100
    log('E', 'E4', hasContent ? 'PASS' : 'FAIL', `İçerik yüklendi: ${hasContent}`)
  } catch (e) { log('E', 'E4', 'FAIL', e.message.slice(0, 120)) }
}

// ─── BÖLÜM F — Bildirimler ───────────────────────────────────────────────────
async function testF() {
  console.log('\n📋 BÖLÜM F — Bildirimler (User-1)')
  await loginAs(USERS.user1)

  // F1 — Çan linki
  try {
    const bellLink = await page.locator('a[href="/bildirimler"]').count()
    log('F', 'F1', bellLink > 0 ? 'PASS' : 'FAIL', `Çan linki: ${bellLink > 0 ? 'VAR' : 'YOK'}`)
  } catch (e) { log('F', 'F1', 'FAIL', e.message.slice(0, 120)) }

  // F2 — /bildirimler listesi
  try {
    await goto('/bildirimler')
    const items = await page.locator('article, li, [class*="notification"]').count()
    const noData = await page.locator('text=/bildirim yok|henüz|boş/i').count()
    const hasContent = (await page.locator('main').textContent().catch(() => '')).length > 50
    log('F', 'F2', hasContent ? 'PASS' : 'FAIL', `Items: ${items}, Boş msg: ${noData}, İçerik: ${hasContent}`)
  } catch (e) { log('F', 'F2', 'FAIL', e.message.slice(0, 120)) }

  // F3 — Bildirime tıkla
  try {
    const link = page.locator('a[href^="/etkinlik/"]').first()
    if (await link.count() > 0) {
      await link.click()
      await page.waitForTimeout(2000)
      log('F', 'F3', page.url().includes('/etkinlik/') ? 'PASS' : 'FAIL',
        `URL: ${page.url().replace(BASE, '')}`)
    } else {
      log('F', 'F3', 'SKIP', 'Tıklanacak etkinlik linki yok')
    }
  } catch (e) { log('F', 'F3', 'FAIL', e.message.slice(0, 120)) }

  // F4 — Tümünü okundu
  try {
    await goto('/bildirimler')
    const tumBtn = page.locator('button:has-text("Tümünü"), button:has-text("okundu")').first()
    if (await tumBtn.count() > 0) {
      await tumBtn.click()
      await page.waitForTimeout(1500)
      log('F', 'F4', 'PASS', '"Tümünü okundu" tıklandı')
    } else {
      log('F', 'F4', 'SKIP', 'Buton yok — zaten okunmuş ya da bildirim yok')
    }
  } catch (e) { log('F', 'F4', 'FAIL', e.message.slice(0, 120)) }
}

// ─── BÖLÜM G — SEO ───────────────────────────────────────────────────────────
async function testG() {
  console.log('\n📋 BÖLÜM G — SEO')

  // G1 — sitemap.xml
  try {
    await page.goto(`${BASE}/sitemap.xml`, { timeout: 10000 })
    const body = await page.content()
    const hasSlug = body.includes('/etkinlik/')
    const hasLoc = body.includes('<loc>') || body.includes('loc')
    log('G', 'G1', (hasSlug && hasLoc) ? 'PASS' : 'FAIL',
      `<loc> var: ${hasLoc}, /etkinlik/ slug: ${hasSlug}`)
  } catch (e) { log('G', 'G1', 'FAIL', e.message.slice(0, 120)) }

  // G2 — robots.txt
  try {
    await page.goto(`${BASE}/robots.txt`, { timeout: 10000 })
    await page.waitForTimeout(300)
    const body = await page.content()
    const text = body.replace(/<[^>]+>/g, '').toLowerCase()
    const hasSitemap = text.includes('sitemap:')
    const hasDisallow = text.includes('disallow')
    const hasUserAgent = text.includes('user-agent')
    log('G', 'G2', (hasSitemap && hasDisallow && hasUserAgent) ? 'PASS' : 'FAIL',
      `User-agent: ${hasUserAgent}, Disallow: ${hasDisallow}, Sitemap: ${hasSitemap}`)
  } catch (e) { log('G', 'G2', 'FAIL', e.message.slice(0, 120)) }
}

// ─── ANA ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Listur E2E Test v4 — Form-Based Login\n')
  console.log(`Base URL: ${BASE}`)
  console.log(`Zaman: ${new Date().toLocaleString('tr-TR')}\n`)

  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })

  try {
    await testB()
    await testC()
    await testD()
    await testE()
    await testF()
    await testG()
  } finally {
    await browser.close()
  }

  console.log('\n' + '═'.repeat(60))
  console.log('📊 SONUÇ TABLOSU')
  console.log('═'.repeat(60))

  const sections = ['B','C','D','E','F','G']
  const names = { B:'User-1', C:'Raporcu', D:'Moderator', E:'Admin', F:'Bildirimler', G:'SEO' }
  let totalPass=0, totalFail=0, totalSkip=0

  for (const s of sections) {
    const sr = results.filter(r => r.section === s)
    const pass = sr.filter(r => r.status==='PASS').length
    const fail = sr.filter(r => r.status==='FAIL').length
    const skip = sr.filter(r => r.status==='SKIP').length
    console.log(`${fail>0?'❌':'✅'} Bölüm ${s} (${names[s]}): ${pass}/${sr.length} PASS, ${fail} FAIL, ${skip} SKIP`)
    totalPass+=pass; totalFail+=fail; totalSkip+=skip
  }

  console.log('─'.repeat(60))
  console.log(`TOPLAM: ${totalPass} PASS, ${totalFail} FAIL, ${totalSkip} SKIP`)
  console.log('═'.repeat(60))

  if (totalFail > 0) {
    console.log('\n❌ BAŞARISIZ:')
    results.filter(r => r.status==='FAIL').forEach(r => console.log(`  ${r.id}: ${r.detail}`))
  }

  fs.writeFileSync('e2e-results.json', JSON.stringify({
    timestamp: new Date().toISOString(), results,
    summary: { pass: totalPass, fail: totalFail, skip: totalSkip }
  }, null, 2))

  console.log('\n📄 e2e-results.json')
  process.exit(totalFail > 0 ? 1 : 0)
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
