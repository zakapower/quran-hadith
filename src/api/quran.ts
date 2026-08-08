import type { Ayah, SurahContent, SurahMeta } from '../data/types'

const CLOUD = 'https://api.alquran.cloud/v1'
const CDN = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions'

const ARABIC_EDITION = 'ara-quranuthmanihaf'
const TRANSLATION = {
  ru: 'rus-elmirkuliev',
  en: 'eng-ummmuhammad',
} as const

let listCache: SurahMeta[] | null = null
const surahCache = new Map<string, SurahContent>()

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
  const res = await fetch(`${CDN}/${edition}/${number}.min.json`)
  if (!res.ok) throw new Error(`Failed to load ${edition}/${number}`)
  return (await res.json()) as CdnChapter
}

export async function fetchSurahList(): Promise<SurahMeta[]> {
  if (listCache) return listCache
  const res = await fetch(`${CLOUD}/surah`)
  if (!res.ok) throw new Error('Failed to load surah list')
  const data = await res.json()
  listCache = data.data as SurahMeta[]
  return listCache
}

export async function fetchSurah(
  number: number,
  lang: 'ru' | 'en',
): Promise<SurahContent> {
  const key = cacheKey(number, lang)
  const cached = surahCache.get(key)
  if (cached) return cached

  const translationEdition = TRANSLATION[lang]
  const [metaList, arabic, translation] = await Promise.all([
    fetchSurahList(),
    fetchCdnChapter(ARABIC_EDITION, number),
    fetchCdnChapter(translationEdition, number),
  ])

  const meta = metaList.find((s) => s.number === number)
  if (!meta) throw new Error('Surah not found')

  const content: SurahContent = {
    number: meta.number,
    name: meta.name,
    englishName: meta.englishName,
    ayahsArabic: toAyahs(arabic.chapter),
    ayahsTranslation: toAyahs(translation.chapter),
  }

  surahCache.set(key, content)
  return content
}
