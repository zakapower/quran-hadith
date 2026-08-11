import type { Ayah, SurahContent, SurahMeta } from '../data/types'
import { getSurahList, getSurahMeta } from '../data/surahList'
import { cacheGet, cacheSet, warmCache } from '../utils/pageCache'

const CDN = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions'

const ARABIC_EDITION = 'ara-quranuthmanihaf'
const TRANSLATION = {
  ru: 'rus-elmirkuliev',
  en: 'eng-ummmuhammad',
} as const

const CACHE_NS = 'surah'

type CdnChapter = {
  chapter: Array<{ chapter: number; verse: number; text: string }>
}

function cacheKey(number: number, lang: 'ru' | 'en') {
  return `${number}:${lang}`
}

function toAyahs(rows: CdnChapter['chapter']): Ayah[] {
  return rows.map((row) => ({
    number: row.chapter * 1000 + row.verse,
    numberInSurah: row.verse,
    text: row.text,
  }))
}

async function fetchCdnChapter(edition: string, number: number) {
  const res = await fetch(`${CDN}/${edition}/${number}.min.json`, {
    cache: 'force-cache',
  })
  if (!res.ok) throw new Error(`Failed to load ${edition}/${number}`)
  return (await res.json()) as CdnChapter
}

export async function fetchSurahList(): Promise<SurahMeta[]> {
  return getSurahList()
}

/** Sync peek — avoid skeleton flash when revisiting a surah. */
export function peekSurah(
  number: number,
  lang: 'ru' | 'en',
): SurahContent | null {
  return cacheGet<SurahContent>(CACHE_NS, cacheKey(number, lang))
}

export async function fetchSurah(
  number: number,
  lang: 'ru' | 'en',
): Promise<SurahContent> {
  const key = cacheKey(number, lang)
  const cached = peekSurah(number, lang)
  if (cached) return cached

  const meta = getSurahMeta(number)
  if (!meta) throw new Error('Surah not found')

  const translationEdition = TRANSLATION[lang]
  const [arabic, translation] = await Promise.all([
    fetchCdnChapter(ARABIC_EDITION, number),
    fetchCdnChapter(translationEdition, number),
  ])

  const content: SurahContent = {
    number: meta.number,
    name: meta.name,
    englishName: meta.englishName,
    englishNameTranslation: meta.englishNameTranslation,
    ayahsArabic: toAyahs(arabic.chapter),
    ayahsTranslation: toAyahs(translation.chapter),
  }

  cacheSet(CACHE_NS, key, content)
  return content
}

/** Prefetch neighbors so next/prev surah opens instantly. */
export function prefetchNearbySurahs(number: number, lang: 'ru' | 'en') {
  if (number > 1) warmCache(() => fetchSurah(number - 1, lang))
  if (number < 114) warmCache(() => fetchSurah(number + 1, lang))
}
