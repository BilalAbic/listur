import { describe, expect, it } from 'vitest'
import { validateApplication } from './organizer-validation'

describe('validateApplication', () => {
  describe('handle doğrulama', () => {
    it('geçerli handle kabul edilir', () => {
      const result = validateApplication({ requested_handle: 'acme-events' })
      expect(result.ok).toBe(true)
    })

    it('handle boş ise reddedilir', () => {
      const result = validateApplication({ requested_handle: '   ' })
      expect(result).toMatchObject({ ok: false, code: 'HANDLE_REQUIRED' })
    })

    it('handle tek karakter da kabul edilir (regex opsiyonel grup)', () => {
      const result = validateApplication({ requested_handle: 'a' })
      expect(result.ok).toBe(true)
    })

    it('handle tire ile bitemez', () => {
      const result = validateApplication({ requested_handle: 'foo-' })
      expect(result).toMatchObject({ ok: false, code: 'HANDLE_INVALID' })
    })

    it('handle 30+ karakter ise reddedilir', () => {
      const result = validateApplication({ requested_handle: 'a'.repeat(31) })
      expect(result).toMatchObject({ ok: false, code: 'HANDLE_INVALID' })
    })

    it('handle özel karakterli reddedilir', () => {
      const result = validateApplication({ requested_handle: 'foo@bar' })
      expect(result).toMatchObject({ ok: false, code: 'HANDLE_INVALID' })
    })

    it('rezerve handle reddedilir', () => {
      const result = validateApplication({ requested_handle: 'admin' })
      expect(result).toMatchObject({ ok: false, code: 'HANDLE_RESERVED' })
    })

    it('uppercase handle lowercase\'e normalize edilir', () => {
      const result = validateApplication({ requested_handle: 'ACME-Events' })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.requested_handle).toBe('acme-events')
    })
  })

  describe('bio ve reason', () => {
    it('301+ karakter bio reddedilir', () => {
      const result = validateApplication({
        requested_handle: 'acme',
        bio: 'a'.repeat(301),
      })
      expect(result).toMatchObject({ ok: false, code: 'BIO_TOO_LONG' })
    })

    it('301+ karakter reason reddedilir', () => {
      const result = validateApplication({
        requested_handle: 'acme',
        reason: 'r'.repeat(301),
      })
      expect(result).toMatchObject({ ok: false, code: 'REASON_TOO_LONG' })
    })
  })

  describe('website URL normalizasyonu', () => {
    it("protokolsüz URL https'e tamamlanır", () => {
      const result = validateApplication({ requested_handle: 'acme', website: 'example.com' })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.website).toMatch(/^https:\/\/example\.com/)
    })

    it('geçersiz URL reddedilir', () => {
      const result = validateApplication({
        requested_handle: 'acme',
        website: 'not a url at all !',
      })
      expect(result).toMatchObject({ ok: false, code: 'WEBSITE_INVALID' })
    })
  })

  describe('sosyal handle temizleme', () => {
    it('twitter @-prefix kaldırılır', () => {
      const result = validateApplication({ requested_handle: 'acme', twitter: '@acme' })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.twitter).toBe('acme')
    })

    it('twitter URL son segmenti alınır', () => {
      const result = validateApplication({
        requested_handle: 'acme',
        twitter: 'https://twitter.com/acme',
      })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.twitter).toBe('acme')
    })

    it('boş sosyal handle null döner', () => {
      const result = validateApplication({ requested_handle: 'acme', twitter: '' })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.twitter).toBeNull()
    })
  })
})
