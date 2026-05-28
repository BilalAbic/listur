import metascraper from 'metascraper'
import metascraperTitle from 'metascraper-title'
import metascraperDescription from 'metascraper-description'
import metascraperImage from 'metascraper-image'
import metascraperUrl from 'metascraper-url'
import metascraperDate from 'metascraper-date'
import metascraperPublisher from 'metascraper-publisher'
import got from 'got'
import OpenAI from 'openai'
import { cleanHtmlForAI } from '@/lib/utils/html-cleaner'
import { buildParsePrompt } from './prompts'
import type { ParsedEventData } from '@/types/index'

const scraper = metascraper([
  metascraperTitle(),
  metascraperDescription(),
  metascraperImage(),
  metascraperUrl(),
  metascraperDate(),
  metascraperPublisher(),
])

interface MetascraperResult {
  title?: string
  description?: string
  image?: string
  url?: string
  date?: string
  publisher?: string
}

async function scrapeWithMetascraper(url: string): Promise<MetascraperResult> {
  try {
    const response = await got(url, {
      timeout: { request: 10_000 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Listur/1.0; +https://listur.dev)',
      },
      followRedirect: true,
    })

    const html = response.body
    const metadata = await scraper({ html, url })
    return metadata as MetascraperResult
  } catch (error) {
    console.error('metascraper error:', error)
    return {}
  }
}

async function parseWithGPT4o(
  url: string,
  existing: Partial<ParsedEventData>
): Promise<Partial<ParsedEventData>> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  try {
    // HTML'i çek ve temizle
    const response = await got(url, {
      timeout: { request: 15_000 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Listur/1.0; +https://listur.dev)',
      },
    })
    const cleanedHtml = cleanHtmlForAI(response.body)

    const existingFields = {
      title: existing.title ?? null,
      description: existing.description ?? null,
      start_date: existing.start_date ?? null,
      end_date: existing.end_date ?? null,
      city: existing.city ?? null,
      is_online: existing.is_online ?? false,
      venue_name: existing.venue_name ?? null,
      category: existing.category ?? null,
      registration_url: existing.registration_url ?? null,
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: buildParsePrompt(cleanedHtml, existingFields),
        },
      ],
    })

    const content = completion.choices[0]?.message?.content
    if (!content) return {}

    return JSON.parse(content) as Partial<ParsedEventData>
  } catch (error) {
    console.error('GPT-4o parse error:', error)
    return {}
  }
}

/**
 * Ana parse fonksiyonu.
 * 1. metascraper ile OG/meta tag'lerden veri çek
 * 2. Kritik alan (title + description + start_date) eksikse GPT-4o'ya gönder
 * 3. Sonuçları birleştir
 */
export async function parseEventLink(url: string): Promise<ParsedEventData> {
  // 1. metascraper ile dene
  const meta = await scrapeWithMetascraper(url)

  const result: ParsedEventData = {
    title: meta.title ?? null,
    description: meta.description ?? null,
    cover_image: meta.image ?? null,
    url: meta.url ?? url,
    start_date: meta.date ?? null,
    end_date: null,
    city: null,
    is_online: false,
    venue_name: null,
    category: null,
    registration_url: null,
    parse_source: 'og',
  }

  // 2. Kritik alanlar tamam mı kontrol et
  const hasAllCritical = result.title && result.description && result.start_date
  if (hasAllCritical) {
    return result
  }

  // 3. GPT-4o fallback → sadece eksik alanlar için
  console.log('GPT-4o fallback başlatılıyor...')
  const gptResult = await parseWithGPT4o(url, result)

  // 4. Birleştir: mevcut değerleri koru, sadece null/undefined olanları güncelle
  return {
    title: result.title ?? gptResult.title ?? null,
    description: result.description ?? gptResult.description ?? null,
    cover_image: result.cover_image ?? null,
    url: result.url ?? url,
    start_date: result.start_date ?? gptResult.start_date ?? null,
    end_date: result.end_date ?? gptResult.end_date ?? null,
    city: result.city ?? gptResult.city ?? null,
    is_online: result.is_online || gptResult.is_online || false,
    venue_name: result.venue_name ?? gptResult.venue_name ?? null,
    category: result.category ?? gptResult.category ?? null,
    registration_url: result.registration_url ?? gptResult.registration_url ?? null,
    parse_source: 'gpt4o',
  }
}
