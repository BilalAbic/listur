import { describe, expect, it } from 'vitest'
import { engagementScore } from './feeds'

describe('engagementScore', () => {
  it('formul: view*1 + favorite*3 + rsvp*5', () => {
    expect(engagementScore({ view_count: 10, favorite_count: 2, rsvp_count: 1 })).toBe(10 + 6 + 5)
  })

  it('sıfır engagement = 0', () => {
    expect(engagementScore({ view_count: 0, favorite_count: 0, rsvp_count: 0 })).toBe(0)
  })

  it('RSVP en ağır ağırlık (×5)', () => {
    const aLow = engagementScore({ view_count: 100, favorite_count: 0, rsvp_count: 0 })
    const aHigh = engagementScore({ view_count: 0, favorite_count: 0, rsvp_count: 20 })
    expect(aHigh).toBe(100)
    expect(aLow).toBe(100)
    expect(aHigh).toBe(aLow) // 100 view = 20 rsvp aynı skor (denge)
  })

  it('favorite, view\'den 3x daha ağır', () => {
    const a = engagementScore({ view_count: 30, favorite_count: 0, rsvp_count: 0 })
    const b = engagementScore({ view_count: 0, favorite_count: 10, rsvp_count: 0 })
    expect(a).toBe(b)
  })

  it('büyük sayılarda overflow riski yok (32-bit int safe)', () => {
    // 1M view + 100K fav + 10K rsvp = 1.35M, safe int
    expect(
      engagementScore({ view_count: 1_000_000, favorite_count: 100_000, rsvp_count: 10_000 })
    ).toBe(1_000_000 + 300_000 + 50_000)
  })
})
