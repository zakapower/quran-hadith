import type { HadithCollectionMeta, HadithItem, HadithSectionMeta, Lang } from '../data/types'
import { getHadithCollection } from '../data/hadithCatalog'
import { sectionNameRu } from '../data/hadithSectionsRu'

const CDN = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1'
const INFO = `${CDN}/info.min.json`

type InfoBook = {
  metadata?: {
    name?: string
    sections?: Record<string, string>
    section_details?: Record<
      string,
      {
        hadithnumber_first?: number
        hadithnumber_last?: number
        arabicnumber_first?: number
        arabicnumber_last?: number
      }
    >
  }
}

type ApiHadith = {
  hadithnumber: number
  arabicnumber?: number
  text: string
  reference?: { book: number; hadith: number }
}

type SectionPayload = {
  metadata?: {
    name?: string
    section?: Record<string, string>
  }
  hadiths: ApiHadith[]
}

let infoCache: Record<string, InfoBook> | null = null
const sectionCache = new Map<string, HadithItem[]>()

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load ${url}`)
  return (await res.json()) as T
}

async function getInfo() {
  if (infoCache) return infoCache
  infoCache = await fetchJson<Record<string, InfoBook>>(INFO)
  return infoCache
}

function translationEdition(col: HadithCollectionMeta, lang: Lang) {
  if (lang === 'ru' && col.editions.ru) return col.editions.ru
  return col.editions.en
}

export async function fetchHadithSections(
  bookId: string,
  lang: Lang = 'en',
): Promise<HadithSectionMeta[]> {
  const col = getHadithCollection(bookId)
  if (!col) throw new Error('Unknown collection')

  const info = await getInfo()
  const meta = info[col.apiBook]?.metadata
  const sections = meta?.sections ?? {}
  const details = meta?.section_details ?? {}

  return Object.entries(sections)
    .map(([key, name]) => {
      const n = Number(key)
      const detail = details[key]
      const first = detail?.hadithnumber_first ?? 0
      const last = detail?.hadithnumber_last ?? 0
      const count = last >= first && first > 0 ? last - first + 1 : 0
      const enName = name || `${n}`
      return {
        id: key,
        number: n,
        name: lang === 'ru' ? sectionNameRu(bookId, key, enName) : enName,
        hadithFirst: first,
        hadithLast: last,
        count,
      }
    })
    .filter((s) => s.number > 0 && s.name.trim().length > 0)
    .sort((a, b) => a.number - b.number)
}

function mapHadiths(
  bookId: string,
  arabic: ApiHadith[],
  translation: ApiHadith[],
): HadithItem[] {
  const arMap = new Map(arabic.map((h) => [h.hadithnumber, h]))
  const trMap = new Map(translation.map((h) => [h.hadithnumber, h]))
  const numbers = [...new Set([...arMap.keys(), ...trMap.keys()])].sort(
    (a, b) => a - b,
  )

  return numbers
    .map((n) => {
      const ar = arMap.get(n)
      const tr = trMap.get(n)
      const arabicText = ar?.text?.trim()
      const text = tr?.text?.trim() ?? ''
      return {
        id: `${bookId}-${n}`,
        number: n,
        arabic: arabicText || undefined,
        text,
        reference: ar?.reference ?? tr?.reference,
      }
    })
    .filter((h) => h.text || h.arabic)
}

export async function fetchHadithSection(
  bookId: string,
  sectionId: string,
  lang: Lang,
): Promise<HadithItem[]> {
  const col = getHadithCollection(bookId)
  if (!col) throw new Error('Unknown collection')

  const trEdition = translationEdition(col, lang)
  const cacheKey = `${col.editions.ar}:${trEdition}:${sectionId}`
  const cached = sectionCache.get(cacheKey)
  if (cached) return cached

  const [arabic, translation] = await Promise.all([
    fetchJson<SectionPayload>(
      `${CDN}/editions/${col.editions.ar}/sections/${sectionId}.min.json`,
    ),
    fetchJson<SectionPayload>(
      `${CDN}/editions/${trEdition}/sections/${sectionId}.min.json`,
    ),
  ])

  const items = mapHadiths(bookId, arabic.hadiths ?? [], translation.hadiths ?? [])
  sectionCache.set(cacheKey, items)
  return items
}
