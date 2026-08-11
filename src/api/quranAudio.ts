import {
  normalizeSegments,
  parseVerseKeyAyah,
  type AyahTiming,
} from '@/utils/audioSegments'

const API = 'https://api.quran.com/api/v4'

type RawChapterRecitation = {
  audio_file: {
    audio_url: string
    timestamps: Array<{
      verse_key: string
      timestamp_from: number
      timestamp_to: number
      segments?: unknown[]
    }>
  }
}

export type ChapterRecitation = {
  audioUrl: string
  timestamps: AyahTiming[]
}

const recitationCache = new Map<string, ChapterRecitation>()
const wordsCache = new Map<number, Map<number, string[]>>()

function recitationKey(reciterId: number, chapter: number) {
  return `${reciterId}:${chapter}`
}

export async function fetchChapterRecitation(
  reciterId: number,
  chapter: number,
): Promise<ChapterRecitation> {
  const key = recitationKey(reciterId, chapter)
  const hit = recitationCache.get(key)
  if (hit) return hit

  const res = await fetch(
    `${API}/chapter_recitations/${reciterId}/${chapter}?segments=true`,
  )
  if (!res.ok) throw new Error(`recitation ${reciterId}/${chapter} failed`)
  const data = (await res.json()) as RawChapterRecitation
  const file = data.audio_file
  if (!file?.audio_url) throw new Error('missing audio_url')

  const timestamps: AyahTiming[] = (file.timestamps ?? []).map((row) => ({
    verseKey: row.verse_key,
    ayah: parseVerseKeyAyah(row.verse_key),
    fromMs: Number(row.timestamp_from) || 0,
    toMs: Number(row.timestamp_to) || 0,
    segments: normalizeSegments(row.segments ?? []),
  }))

  const out = { audioUrl: file.audio_url, timestamps }
  recitationCache.set(key, out)
  return out
}

type WordsPage = {
  verses: Array<{
    verse_number: number
    words?: Array<{
      char_type_name: string
      text_uthmani?: string
      text?: string
    }>
  }>
  pagination: { next_page: number | null }
}

export async function fetchChapterWords(
  chapter: number,
): Promise<Map<number, string[]>> {
  const cached = wordsCache.get(chapter)
  if (cached) return cached

  const map = new Map<number, string[]>()
  let page = 1
  for (;;) {
    const res = await fetch(
      `${API}/verses/by_chapter/${chapter}?words=true&word_fields=text_uthmani&per_page=50&page=${page}`,
    )
    if (!res.ok) throw new Error(`words ${chapter} p${page} failed`)
    const data = (await res.json()) as WordsPage
    for (const v of data.verses ?? []) {
      const words = (v.words ?? [])
        .filter((w) => w.char_type_name === 'word')
        .map((w) => w.text_uthmani || w.text || '')
        .filter(Boolean)
      map.set(v.verse_number, words)
    }
    if (data.pagination?.next_page == null) break
    page = data.pagination.next_page
  }

  wordsCache.set(chapter, map)
  return map
}
