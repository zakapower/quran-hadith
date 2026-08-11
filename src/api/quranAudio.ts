import { getSurahMeta } from '@/data/surahList'
import { getReciter, localAyahAudioPath } from '@/data/reciters'
import {
  normalizeSegments,
  parseVerseKeyAyah,
  type AyahTiming,
  type WordSegment,
} from '@/utils/audioSegments'

const API = 'https://api.quran.com/api/v4'

type RawChapterRecitation = {
  audio_file: {
    timestamps: Array<{
      verse_key: string
      timestamp_from: number
      timestamp_to: number
      segments?: unknown[]
    }>
  }
}

export type ChapterAudioPack = {
  /** Timings relative to the start of each ayah MP3 (may have empty segments). */
  timestamps: AyahTiming[]
  audioByAyah: Map<number, string>
}

const packCache = new Map<string, ChapterAudioPack>()
const wordsCache = new Map<number, Map<number, string[]>>()

function packKey(reciterId: number, chapter: number) {
  return `${reciterId}:${chapter}`
}

function relativizeSegments(
  segments: WordSegment[],
  baseMs: number,
): WordSegment[] {
  return segments.map((s) => ({
    wordIndex: s.wordIndex,
    startMs: Math.max(0, s.startMs - baseMs),
    endMs: Math.max(0, s.endMs - baseMs),
  }))
}

function buildAudioMap(reciterId: number, chapter: number, count: number) {
  const map = new Map<number, string>()
  // Ensure reciter exists
  getReciter(reciterId)
  for (let ayah = 1; ayah <= count; ayah++) {
    map.set(ayah, localAyahAudioPath(reciterId, chapter, ayah))
  }
  return map
}

function fallbackTimestamps(chapter: number, count: number): AyahTiming[] {
  return Array.from({ length: count }, (_, i) => {
    const ayah = i + 1
    return {
      verseKey: `${chapter}:${ayah}`,
      ayah,
      fromMs: 0,
      toMs: 0,
      segments: [],
    }
  })
}

async function fetchRelativeTimings(
  reciterId: number,
  chapter: number,
): Promise<AyahTiming[] | null> {
  try {
    const res = await fetch(
      `${API}/chapter_recitations/${reciterId}/${chapter}?segments=true`,
    )
    if (!res.ok) return null
    const data = (await res.json()) as RawChapterRecitation
    const rows = data.audio_file?.timestamps
    if (!rows?.length) return null

    return rows.map((row) => {
      const fromMs = Number(row.timestamp_from) || 0
      const toMs = Number(row.timestamp_to) || 0
      const absolute = normalizeSegments(row.segments ?? [])
      return {
        verseKey: row.verse_key,
        ayah: parseVerseKeyAyah(row.verse_key),
        fromMs: 0,
        toMs: Math.max(0, toMs - fromMs),
        segments: relativizeSegments(absolute, fromMs),
      }
    })
  } catch {
    return null
  }
}

export async function fetchChapterAudioPack(
  reciterId: number,
  chapter: number,
): Promise<ChapterAudioPack> {
  const key = packKey(reciterId, chapter)
  const hit = packCache.get(key)
  if (hit) return hit

  const meta = getSurahMeta(chapter)
  if (!meta) throw new Error('surah not found')
  const count = meta.numberOfAyahs
  const audioByAyah = buildAudioMap(reciterId, chapter, count)
  const timestamps =
    (await fetchRelativeTimings(reciterId, chapter)) ??
    fallbackTimestamps(chapter, count)

  const out = { timestamps, audioByAyah }
  packCache.set(key, out)
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
