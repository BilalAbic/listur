import { describe, expect, it } from 'vitest'
import { generateSlug } from './slug'

describe('generateSlug', () => {
  describe('Türkçe karakter dönüşümü', () => {
    it('ğ → g', () => {
      expect(generateSlug('Ankara Gümrük Hackathon')).toBe('ankara-gumruk-hackathon')
    })

    it('ş → s, ı → i, ö → o', () => {
      expect(generateSlug('İstanbul Yaşam Atölyesi')).toBe('istanbul-yasam-atolyesi')
    })

    it('ü → u, ç → c', () => {
      expect(generateSlug('Üçüncü Kuşak Konferansı')).toBe('ucuncu-kusak-konferansi')
    })

    it('â/î/û → düz harfler', () => {
      expect(generateSlug('Şâir Ülküsü Buluşması')).toBe('sair-ulkusu-bulusmasi')
    })
  })

  describe('temizleme ve normalizasyon', () => {
    it('özel karakterleri kaldırır', () => {
      expect(generateSlug('AI/ML Meetup: 2026!')).toBe('aiml-meetup-2026')
    })

    it('birden çok boşluğu tek tireye çevirir', () => {
      expect(generateSlug('   Çoklu     Boşluk   Test  ')).toBe('coklu-bosluk-test')
    })

    it('baş ve son tireyi temizler', () => {
      expect(generateSlug('---Test---')).toBe('test')
    })

    it('boş başlık için "etkinlik" fallback', () => {
      expect(generateSlug('!!!')).toBe('etkinlik')
      expect(generateSlug('')).toBe('etkinlik')
    })
  })

  describe('çakışma çözümü', () => {
    it('çakışma yoksa orijinal slug', () => {
      expect(generateSlug('Test Hack', ['baska-event'])).toBe('test-hack')
    })

    it('tek çakışmada -2 eklenir', () => {
      expect(generateSlug('Test Hack', ['test-hack'])).toBe('test-hack-2')
    })

    it('iki çakışmada -3 eklenir', () => {
      expect(generateSlug('Test Hack', ['test-hack', 'test-hack-2'])).toBe('test-hack-3')
    })

    it('existingSlugs undefined ise sayma atlanır', () => {
      expect(generateSlug('Test', undefined)).toBe('test')
    })

    it('existingSlugs boş array için saymaz', () => {
      expect(generateSlug('Test', [])).toBe('test')
    })
  })
})
