import type { HadithCollectionMeta, HadithItem, HadithSectionMeta, Lang } from '../data/types'
import { getHadithCollection } from '../data/hadithCatalog'
import { sectionNameRu } from '../data/hadithSectionsRu'
import { cacheGet, cacheSet, warmCache } from '../utils/pageCache'
import { normalizeHadithText } from '../utils/hadithText'
import { translateEnToRuMany } from '../lib/translateEnRu'

const CDN = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1'
const IMUSLIM = 'https://i-muslim.com/api/v1/translations/hadith'
const INFO = `${CDN}/info.min.json`

/** CDN has no rus-* — use i-muslim CC0 Russian as primary translation. */
const IMUSLIM_PRIMARY_RU = new Set(['tirmidhi', 'nasai', 'ibnmajah'])
/** CDN rus-* has gaps; fill empty slots from i-muslim authored Russian. */
const IMUSLIM_GAP_RU = new Set(['abudawud'])

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

type ImuslimPayload = {
  data?: {
    items?: Array<{
      number: number
      text: string | null
      source?: string
    }>
  }
}

const SECTIONS_NS = 'hadith-sections'
const SECTION_NS = 'hadith-section'
const IMUSLIM_NS = 'imuslim-ru'

let infoCache: Record<string, InfoBook> | null = null
let infoPromise: Promise<Record<string, InfoBook>> | null = null

const imuslimMaps = new Map<string, Map<number, string>>()
const imuslimPromises = new Map<string, Promise<Map<number, string>>>()

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: 'force-cache', ...init })
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
  if (!infoPromise) {
    // info.min.json > 2MB — Next data cache rejects it; dedupe in-flight fetches.
    infoPromise = fetchJson<Record<string, InfoBook>>(INFO, {
      cache: 'no-store',
    }).then((data) => {
      infoCache = data
      cacheSet('hadith-info', 'info', data)
      return data
    })
  }
  return infoPromise
}

function translationLabel(col: HadithCollectionMeta, lang: Lang) {
  if (lang !== 'ru') return col.editions.en
  if (col.editions.ru) {
    const gap = IMUSLIM_GAP_RU.has(col.id) ? '+imuslim' : ''
    return `${col.editions.ru}${gap}+mtfill2`
  }
  if (IMUSLIM_PRIMARY_RU.has(col.id)) return 'imuslim-ru+mtfill2'
  return col.editions.en
}

function sectionsKey(bookId: string, lang: Lang) {
  return `${bookId}:${lang}`
}

function sectionItemsKey(bookId: string, sectionId: string, lang: Lang) {
  const col = getHadithCollection(bookId)
  if (!col) return `${bookId}:${sectionId}:${lang}`
  return `${col.editions.ar}:${translationLabel(col, lang)}:${sectionId}`
}

async function getImuslimRuMap(bookId: string): Promise<Map<number, string>> {
  const cachedMap = imuslimMaps.get(bookId)
  if (cachedMap) return cachedMap

  const fromStore = cacheGet<Array<[number, string]>>(IMUSLIM_NS, bookId)
  if (fromStore) {
    const map = new Map(fromStore)
    imuslimMaps.set(bookId, map)
    return map
  }

  let pending = imuslimPromises.get(bookId)
  if (!pending) {
    pending = fetchJson<ImuslimPayload>(`${IMUSLIM}/${bookId}/ru`, {
      cache: 'no-store',
    }).then((payload) => {
      const map = new Map<number, string>()
      for (const item of payload.data?.items ?? []) {
        const raw = item.text?.trim()
        if (!raw) continue
        map.set(item.number, normalizeHadithText(raw))
      }
      imuslimMaps.set(bookId, map)
      cacheSet(IMUSLIM_NS, bookId, [...map.entries()])
      return map
    })
    imuslimPromises.set(bookId, pending)
  }
  return pending
}


async function buildRuMap(
  arabic: ApiHadith[],
  primary: Map<number, string>,
  enMap: Map<number, string>,
  imuslim?: Map<number, string>,
): Promise<Map<number, string>> {
  // Only numbers from this Arabic section — never the whole-book imuslim map.
  const result = new Map<number, string>()
  for (const h of arabic) {
    const n = h.hadithnumber
    const text = primary.get(n) || imuslim?.get(n) || ''
    if (text) result.set(n, text)
  }

  const missing: Array<{ n: number; en: string }> = []
  for (const h of arabic) {
    if (result.has(h.hadithnumber)) continue
    const en = enMap.get(h.hadithnumber)
    if (en) missing.push({ n: h.hadithnumber, en })
  }
  if (missing.length === 0) return result

  const BATCH = 40
  for (let i = 0; i < missing.length; i += BATCH) {
    const chunk = missing.slice(i, i + BATCH)
    const translated = await translateEnToRuMany(chunk.map((c) => c.en))
    for (let j = 0; j < chunk.length; j++) {
      const ru = normalizeHadithText(translated[j] || '')
      if (ru) result.set(chunk[j].n, ru)
    }
  }
  return result
}

function textMapFromHadiths(hadiths: ApiHadith[]): Map<number, string> {
  const map = new Map<number, string>()
  for (const h of hadiths) {
    const text = h.text ? normalizeHadithText(h.text) : ''
    if (text) map.set(h.hadithnumber, text)
  }
  return map
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
  translations: Map<number, string>,
): HadithItem[] {
  return arabic
    .map((ar) => {
      const n = ar.hadithnumber
      const arabicText = ar.text ? normalizeHadithText(ar.text) : undefined
      const text = translations.get(n) ?? ''
      return {
        id: `${bookId}-${n}`,
        number: n,
        arabic: arabicText || undefined,
        text,
        reference: ar.reference,
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

  const arUrl = `${CDN}/editions/${col.editions.ar}/sections/${sectionId}.min.json`
  const enUrl = `${CDN}/editions/${col.editions.en}/sections/${sectionId}.min.json`

  let items: HadithItem[]

  if (lang === 'ru' && col.editions.ru) {
    const ruUrl = `${CDN}/editions/${col.editions.ru}/sections/${sectionId}.min.json`
    const needImuslim = IMUSLIM_GAP_RU.has(bookId)
    const [arabic, russian, english, imuslim] = await Promise.all([
      fetchJson<SectionPayload>(arUrl),
      fetchJson<SectionPayload>(ruUrl),
      fetchJson<SectionPayload>(enUrl),
      needImuslim ? getImuslimRuMap(bookId) : Promise.resolve(undefined),
    ])
    const arList = arabic.hadiths ?? []
    const ruMap = await buildRuMap(
      arList,
      textMapFromHadiths(russian.hadiths ?? []),
      textMapFromHadiths(english.hadiths ?? []),
      imuslim,
    )
    items = mapHadiths(bookId, arList, ruMap)
  } else if (lang === 'ru' && IMUSLIM_PRIMARY_RU.has(bookId)) {
    const [arabic, english, imuslim] = await Promise.all([
      fetchJson<SectionPayload>(arUrl),
      fetchJson<SectionPayload>(enUrl),
      getImuslimRuMap(bookId),
    ])
    const arList = arabic.hadiths ?? []
    const ruMap = await buildRuMap(
      arList,
      imuslim,
      textMapFromHadiths(english.hadiths ?? []),
    )
    items = mapHadiths(bookId, arList, ruMap)
  } else {
    const [arabic, translation] = await Promise.all([
      fetchJson<SectionPayload>(arUrl),
      fetchJson<SectionPayload>(enUrl),
    ])
    items = mapHadiths(
      bookId,
      arabic.hadiths ?? [],
      textMapFromHadiths(translation.hadiths ?? []),
    )
  }

  cacheSet(SECTION_NS, key, items)
  return items
}

export function seedHadithSections(
  bookId: string,
  lang: Lang,
  sections: HadithSectionMeta[],
) {
  cacheSet(SECTIONS_NS, sectionsKey(bookId, lang), sections)
}

export function seedHadithSection(
  bookId: string,
  sectionId: string,
  lang: Lang,
  items: HadithItem[],
) {
  cacheSet(SECTION_NS, sectionItemsKey(bookId, sectionId, lang), items)
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
