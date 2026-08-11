import type { HadithCollectionMeta, HadithItem, HadithSectionMeta, Lang } from '../data/types'
import { getHadithCollection } from '../data/hadithCatalog'
import { sectionNameRu } from '../data/hadithSectionsRu'
import { cacheGet, cacheSet, warmCache } from '../utils/pageCache'

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

const SECTIONS_NS = 'hadith-sections'
const SECTION_NS = 'hadith-section'

let infoCache: Record<string, InfoBook> | null = null

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'force-cache' })
  if (!res.ok) throw new Error(`Failed to load ${url}`)
  return (await res.json()) as T
}

async function getInfo() {
  if (infoCache) return infoCache
  const fromStore = cacheGet<Record<string, InfoBook>>('hadith-info', 'info')
  if (fromStore) {
    infoCache = fromStore
    return infoCache
  }
  infoCache = await fetchJson<Record<string, InfoBook>>(INFO)
  cacheSet('hadith-info', 'info', infoCache)
  return infoCache
}

function translationEdition(col: HadithCollectionMeta, lang: Lang) {
  if (lang === 'ru' && col.editions.ru) return col.editions.ru
  return col.editions.en
}

function sectionsKey(bookId: string, lang: Lang) {
  return `${bookId}:${lang}`
}

function sectionItemsKey(bookId: string, sectionId: string, lang: Lang) {
  const col = getHadithCollection(bookId)
  if (!col) return `${bookId}:${sectionId}:${lang}`
  const trEdition = translationEdition(col, lang)
  return `${col.editions.ar}:${trEdition}:${sectionId}`
}

export function peekHadithSections(
  bookId: string,
  lang: Lang = 'en',
): HadithSectionMeta[] | null {
  return cacheGet<HadithSectionMeta[]>(SECTIONS_NS, sectionsKey(bookId, lang))
}

export function peekHadithSection(
  bookId: string,
  sectionId: string,
  lang: Lang,
): HadithItem[] | null {
  return cacheGet<HadithItem[]>(SECTION_NS, sectionItemsKey(bookId, sectionId, lang))
}

export async function fetchHadithSections(
  bookId: string,
  lang: Lang = 'en',
): Promise<HadithSectionMeta[]> {
  const col = getHadithCollection(bookId)
  if (!col) throw new Error('Unknown collection')

  const key = sectionsKey(bookId, lang)
  const cached = peekHadithSections(bookId, lang)
  if (cached) return cached

  const info = await getInfo()
  const meta = info[col.apiBook]?.metadata
  const sections = meta?.sections ?? {}
  const details = meta?.section_details ?? {}

  const list = Object.entries(sections)
    .map(([id, name]) => {
      const n = Number(id)
      const detail = details[id]
      const first = detail?.hadithnumber_first ?? 0
      const last = detail?.hadithnumber_last ?? 0
      const count = last >= first && first > 0 ? last - first + 1 : 0
      const enName = name || `${n}`
      return {
        id,
        number: n,
        name: lang === 'ru' ? sectionNameRu(bookId, id, enName) : enName,
        hadithFirst: first,
        hadithLast: last,
        count,
      }
    })
    .filter((s) => s.number > 0 && s.name.trim().length > 0)
    .sort((a, b) => a.number - b.number)

  cacheSet(SECTIONS_NS, key, list)
  return list
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

  const key = sectionItemsKey(bookId, sectionId, lang)
  const cached = peekHadithSection(bookId, sectionId, lang)
  if (cached) return cached

  const trEdition = translationEdition(col, lang)
  const [arabic, translation] = await Promise.all([
    fetchJson<SectionPayload>(
      `${CDN}/editions/${col.editions.ar}/sections/${sectionId}.min.json`,
    ),
    fetchJson<SectionPayload>(
      `${CDN}/editions/${trEdition}/sections/${sectionId}.min.json`,
    ),
  ])

  const items = mapHadiths(bookId, arabic.hadiths ?? [], translation.hadiths ?? [])
  cacheSet(SECTION_NS, key, items)
  return items
}

/** Prefetch adjacent hadith chapters. */
export function prefetchNearbyHadithSections(
  bookId: string,
  sectionId: string,
  lang: Lang,
  sectionIds: string[],
) {
  const idx = sectionIds.indexOf(sectionId)
  if (idx < 0) return
  const prev = sectionIds[idx - 1]
  const next = sectionIds[idx + 1]
  if (prev) warmCache(() => fetchHadithSection(bookId, prev, lang))
  if (next) warmCache(() => fetchHadithSection(bookId, next, lang))
}
