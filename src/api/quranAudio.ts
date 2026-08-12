import { getSurahMeta } from '@/data/surahList'
import { getReciter, localChapterAudioPath } from '@/data/reciters'
import {
  normalizeSegments,
  parseVerseKeyAyah,
  type AyahTiming,
} from '@/utils/audioSegments'
import { cacheGet, cacheSet } from '@/utils/pageCache'

const API = 'https://api.quran.com/api/v4'
const PACK_NS = 'audio-pack-v2'

type RawChapterRecitation = {
  audio_file: {
    audio_url?: string
    timestamps: Array<{
      verse_key: string
      timestamp_from: number
      timestamp_to: number
      segments?: unknown[]
    }>
  }
}

export type ChapterAudioPack = {
  /** Same-origin proxy URL for the full-surah MP3. */
  audioUrl: string
  timestamps: AyahTiming[]
}

const packCache = new Map<string, ChapterAudioPack>()
const wordsCache = new Map<number, Map<number, string[]>>()
const upstreamUrlCache = new Map<string, string>()

function packKey(reciterId: number, chapter: number) {
  return `${reciterId}:${chapter}`
}

async function fetchChapterRecitation(
  reciterId: number,
  chapter: number,
): Promise<RawChapterRecitation['audio_file']> {
  getReciter(reciterId)
  const res = await fetch(
    `${API}/chapter_recitations/${reciterId}/${chapter}?segments=true`,
    { cache: 'force-cache' },
  )
  if (!res.ok) throw new Error(`chapter_recitations ${reciterId}/${chapter}`)
  const data = (await res.json()) as RawChapterRecitation
  const file = data.audio_file
  if (!file?.audio_url || !file.timestamps?.length) {
    throw new Error('missing audio_url or timestamps')
  }
  return file
}

function mapAbsoluteTimestamps(
  rows: RawChapterRecitation['audio_file']['timestamps'],
): AyahTiming[] {
  return rows.map((row) => {
    const fromMs = Number(row.timestamp_from) || 0
    const toMs = Number(row.timestamp_to) || 0
    return {
      verseKey: row.verse_key,
      ayah: parseVerseKeyAyah(row.verse_key),
      fromMs,
      toMs,
      segments: normalizeSegments(row.segments ?? []),
    }
  })
}

/** Server-side: upstream quranicaudio URL for proxying. */
export async function resolveChapterAudioUrl(
  reciterId: number,
  chapter: number,
): Promise<string> {
  const key = packKey(reciterId, chapter)
  const hit = upstreamUrlCache.get(key)
  if (hit) return hit
  const file = await fetchChapterRecitation(reciterId, chapter)
  upstreamUrlCache.set(key, file.audio_url!)
  return file.audio_url!
}

type StoredPack = {
  audioUrl: string
  timestamps: AyahTiming[]
}

export async function fetchChapterAudioPack(
  reciterId: number,
  chapter: number,
): Promise<ChapterAudioPack> {
  const key = packKey(reciterId, chapter)
  const hit = packCache.get(key)
  if (hit) return hit

  const stored = cacheGet<StoredPack>(PACK_NS, key)
  if (stored?.audioUrl && stored.timestamps?.length) {
    packCache.set(key, stored)
    return stored
  }

  const meta = getSurahMeta(chapter)
  if (!meta) throw new Error('surah not found')

  const file = await fetchChapterRecitation(reciterId, chapter)
  const out: ChapterAudioPack = {
    audioUrl: localChapterAudioPath(reciterId, chapter),
    timestamps: mapAbsoluteTimestamps(file.timestamps),
  }
  packCache.set(key, out)
  cacheSet(PACK_NS, key, out)
  upstreamUrlCache.set(key, file.audio_url!)
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

  const stored = cacheGet<Record<string, string[]>>('audio-words', String(chapter))
  if (stored) {
    const map = new Map<number, string[]>()
    for (const [k, v] of Object.entries(stored)) map.set(Number(k), v)
    wordsCache.set(chapter, map)
    return map
  }

  const map = new Map<number, string[]>()
  let page = 1
  for (;;) {
    const res = await fetch(
      `${API}/verses/by_chapter/${chapter}?words=true&word_fields=text_uthmani&per_page=50&page=${page}`,
      { cache: 'force-cache' },
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
  const serial: Record<string, string[]> = {}
  for (const [k, v] of map) serial[String(k)] = v
  cacheSet('audio-words', String(chapter), serial)
  return map
}
