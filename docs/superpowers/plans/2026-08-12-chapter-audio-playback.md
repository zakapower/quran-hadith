# Chapter Audio Playback — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Play each surah as one continuous quran.com chapter MP3 with absolute timings, keeping karaoke and the existing player API intact.

**Architecture:** `fetchChapterAudioPack` returns `{ audioUrl, timestamps }` with absolute ms; `/api/quran-audio` proxies the chapter file after a server-side lookup of `audio_url` (no open proxy); `QuranAudioContext` seeks within one `<audio>` instead of swapping per-ayah sources.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Quran.com API v4, `HTMLAudioElement`.

**Spec:** `docs/superpowers/specs/2026-08-12-chapter-audio-playback-design.md`

## Global Constraints

- Audio + timings both from quran.com (same master) — no everyayah, no quran-online.ru.
- No everyayah fallback if chapter API fails — surface `load-failed`.
- Public player API (`openAndPlay`, `nextAyah`, `prevAyah`, karaoke fields) must not break call sites.
- Proxy must not accept arbitrary upstream URLs — only `reciter` + `surah`, server resolves `audio_url`.
- Cache namespace bump: `audio-pack-v2` (ignore old per-ayah packs).
- Repo has no unit test runner — verify with `npx tsc --noEmit` + manual checklist.

---

## File map

| File | Role |
|------|------|
| `src/data/reciters.ts` | Drop everyayah playback helpers; add `localChapterAudioPath(reciter, surah)` |
| `src/api/quranAudio.ts` | Absolute timings + `audioUrl`; shared `resolveChapterAudioUrl` for server |
| `app/api/quran-audio/route.ts` | Proxy chapter MP3 via server-side URL lookup |
| `src/context/QuranAudioContext.tsx` | Single-file seek playback, ayah boundary sync |

---

### Task 1: Reciter path helper (chapter URL for browser)

**Files:**
- Modify: `src/data/reciters.ts`

**Interfaces:**
- Consumes: existing `getReciter`, `pad3`
- Produces: `localChapterAudioPath(reciterId: number, surah: number): string` → `/api/quran-audio?reciter=&surah=`
- Removes from playback path: `everyayahUrl`, `localAyahAudioPath`, `everyayahFolder` (delete unused fields/functions)

- [ ] **Step 1: Replace everyayah helpers with chapter path**

Rewrite `src/data/reciters.ts` to:

```ts
export type Reciter = {
  id: number
  nameRu: string
  nameEn: string
}

export const RECITERS: Reciter[] = [
  {
    id: 4,
    nameRu: 'Абу Бакр аш-Шатри',
    nameEn: 'Abu Bakr ash-Shatri',
  },
  {
    id: 7,
    nameRu: 'Мишари Аль-Афаси',
    nameEn: 'Mishary Al-Afasy',
  },
]

export const DEFAULT_RECITER_ID = 7

export function getReciter(id: number): Reciter {
  return RECITERS.find((r) => r.id === id) ?? RECITERS[0]
}

/** Same-origin chapter audio (proxied). */
export function localChapterAudioPath(reciterId: number, surah: number) {
  const q = new URLSearchParams({
    reciter: String(reciterId),
    surah: String(surah),
  })
  return `/api/quran-audio?${q.toString()}`
}
```

- [ ] **Step 2: Typecheck that nothing still imports removed symbols**

Run: `npx tsc --noEmit`  
Expected: errors only in files still importing `everyayahUrl` / `localAyahAudioPath` / `everyayahFolder` (fixed in later tasks). If clean already, fine — those files are updated next.

- [ ] **Step 3: Commit**

```bash
git add src/data/reciters.ts
git commit -m "Replace everyayah paths with chapter audio helper."
```

---

### Task 2: Absolute chapter pack in `quranAudio.ts`

**Files:**
- Modify: `src/api/quranAudio.ts`

**Interfaces:**
- Consumes: `localChapterAudioPath`, `normalizeSegments`, `parseVerseKeyAyah`, `cacheGet`/`cacheSet`, `getSurahMeta`
- Produces:
  - `ChapterAudioPack = { audioUrl: string; timestamps: AyahTiming[] }`
  - `fetchChapterAudioPack(reciterId, chapter): Promise<ChapterAudioPack>`
  - `resolveChapterAudioUrl(reciterId, chapter): Promise<string>` (usable from API route; throws if missing)
  - Timings keep absolute `fromMs`/`toMs`/`segments` (no relativize)

- [ ] **Step 1: Rewrite pack fetch + URL resolver**

Replace the body of `src/api/quranAudio.ts` (keep `fetchChapterWords` as-is at the bottom) with:

```ts
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
  // Warm server-side upstream cache when running in same process (noop in browser).
  upstreamUrlCache.set(key, file.audio_url!)
  return out
}

// --- keep existing fetchChapterWords unchanged below this line ---
```

Ensure `fetchChapterWords` remains after this block (copy from current file unchanged).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`  
Expected: errors only in `QuranAudioContext` / API route still using old pack shape (next tasks).

- [ ] **Step 3: Commit**

```bash
git add src/api/quranAudio.ts
git commit -m "Fetch absolute chapter timings and single audio URL."
```

---

### Task 3: Chapter proxy route

**Files:**
- Modify: `app/api/quran-audio/route.ts`

**Interfaces:**
- Consumes: `resolveChapterAudioUrl(reciterId, chapter)`, `getReciter`
- Produces: `GET /api/quran-audio?reciter=&surah=` streaming chapter MP3 with Range support
- Query `ayah` ignored if present (backward compatible)

- [ ] **Step 1: Rewrite the route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getReciter } from '@/data/reciters'
import { resolveChapterAudioUrl } from '@/api/quranAudio'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const reciter = Number(req.nextUrl.searchParams.get('reciter'))
  const surah = Number(req.nextUrl.searchParams.get('surah'))

  if (
    !Number.isFinite(reciter) ||
    !Number.isFinite(surah) ||
    surah < 1 ||
    surah > 114
  ) {
    return NextResponse.json({ error: 'bad params' }, { status: 400 })
  }

  getReciter(reciter)

  let upstream: string
  try {
    upstream = await resolveChapterAudioUrl(reciter, surah)
  } catch {
    return NextResponse.json({ error: 'resolve failed' }, { status: 502 })
  }

  const range = req.headers.get('range')

  try {
    const res = await fetch(upstream, {
      headers: range ? { Range: range } : undefined,
      next: { revalidate: 86400 },
    })

    if (!res.ok || !res.body) {
      return NextResponse.json(
        { error: 'upstream failed', status: res.status },
        { status: 502 },
      )
    }

    const headers = new Headers()
    headers.set('Content-Type', res.headers.get('Content-Type') || 'audio/mpeg')
    headers.set('Cache-Control', 'public, max-age=86400, immutable')
    headers.set('Accept-Ranges', 'bytes')
    const len = res.headers.get('Content-Length')
    if (len) headers.set('Content-Length', len)
    const cr = res.headers.get('Content-Range')
    if (cr) headers.set('Content-Range', cr)

    return new NextResponse(res.body, {
      status: res.status,
      headers,
    })
  } catch {
    return NextResponse.json({ error: 'proxy failed' }, { status: 502 })
  }
}
```

- [ ] **Step 2: Smoke the proxy (dev server running)**

Run:

```bash
curl.exe -sI "http://localhost:3003/api/quran-audio?reciter=7&surah=1"
```

Expected: `HTTP/1.1 200` (or `206` with Range), `Content-Type: audio/mpeg`, non-zero `Content-Length`.

If port differs, adjust. If no server: `npm run dev` first.

- [ ] **Step 3: Commit**

```bash
git add app/api/quran-audio/route.ts
git commit -m "Proxy chapter MP3 from quran.com via reciter+surah."
```

---

### Task 4: Seek-based playback in `QuranAudioContext`

**Files:**
- Modify: `src/context/QuranAudioContext.tsx`

**Interfaces:**
- Consumes: `ChapterAudioPack.audioUrl` + absolute `timestamps`; `findAyahIndexByTime`, `findActiveWordIndex`
- Produces: same public `QuranAudioApi` surface; internal seek instead of per-ayah src swap

- [ ] **Step 1: Replace `audioByAyahRef` with `audioUrlRef`**

Near top of provider:

```ts
const timestampsRef = useRef<AyahTiming[]>([])
const audioUrlRef = useRef<string>('')
```

Remove `audioByAyahRef` entirely.

- [ ] **Step 2: Rewrite play-to-ayah as seek**

Replace `playAyahFile` with:

```ts
const playAyah = useCallback(async (ayahNumber: number, autoplay: boolean) => {
  const audio = audioRef.current
  const timestamps = timestampsRef.current
  const url = audioUrlRef.current
  if (!audio || !url || timestamps.length === 0) return

  const clamped = clampAyah(ayahNumber, timestamps)
  const row = timestamps.find((t) => t.ayah === clamped) ?? timestamps[0]

  const surahNum = targetRef.current?.surah
  if (surahNum != null) {
    targetRef.current = { surah: surahNum, ayah: row.ayah }
    writeLastAyah(surahNum, row.ayah)
  }
  setAyah(row.ayah)
  setActiveWordIndex(null)

  const span = Math.max(1, row.toMs - row.fromMs)
  setProgress(0)

  requestAnimationFrame(() => {
    document
      .getElementById(`a${row.ayah}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })

  ignoreErrorRef.current = true
  try {
    const needsLoad = !sameAudioUrl(audio.src, url)
    if (needsLoad) {
      await loadAudioSrc(audio, url)
    }

    const seek = () => {
      try {
        audio.currentTime = row.fromMs / 1000
      } catch {
        /* ignore */
      }
    }
    seek()

    if (autoplay) {
      await audio.play()
      setPlaying(true)
      setError(null)
      setActiveWordIndex(
        findActiveWordIndex(row.segments, audio.currentTime * 1000),
      )
      void span
    }
  } catch {
    setPlaying(false)
    setError('play-failed')
  } finally {
    ignoreErrorRef.current = false
  }
}, [])
```

Update all call sites: `playAyahFile` → `playAyah`.

- [ ] **Step 3: Update `loadAndPlay` / `openAndPlay`**

In `loadAndPlay` after pack fetch:

```ts
timestampsRef.current = pack.timestamps
audioUrlRef.current = pack.audioUrl
await playAyah(opts.ayah, true)
```

In `openAndPlay` fast path:

```ts
if (
  surah === opts.surah &&
  timestampsRef.current.length > 0 &&
  audioUrlRef.current
) {
  setVisible(true)
  setError(null)
  void playAyah(start, true)
  return
}
```

- [ ] **Step 4: Update clock sync — ayah boundaries + progress + end**

Replace `syncFromClock` / `onEnded` / `advanceOrStop` logic:

```ts
const finishSurah = useCallback(() => {
  const audio = audioRef.current
  if (audio) audio.pause()
  setPlaying(false)
  setProgress(1)
  setActiveWordIndex(null)
}, [])

// Remove advanceOrStop that loads next file.
```

In the audio effect `syncFromClock`:

```ts
const syncFromClock = () => {
  const timestamps = timestampsRef.current
  if (timestamps.length === 0) return
  const tMs = audio.currentTime * 1000
  const idx = findAyahIndexByTime(timestamps, tMs)
  const row = timestamps[idx]
  if (!row) return

  const prevAyah = targetRef.current?.ayah
  if (prevAyah !== row.ayah) {
    const surahNum = targetRef.current?.surah
    if (surahNum != null) {
      targetRef.current = { surah: surahNum, ayah: row.ayah }
      writeLastAyah(surahNum, row.ayah)
    }
    setAyah(row.ayah)
    requestAnimationFrame(() => {
      document
        .getElementById(`a${row.ayah}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  setActiveWordIndex(findActiveWordIndex(row.segments, tMs))

  const span = row.toMs - row.fromMs
  if (span > 0) {
    setProgress(Math.min(1, Math.max(0, (tMs - row.fromMs) / span)))
  }

  const last = timestamps[timestamps.length - 1]
  if (tMs >= last.toMs - 40) {
    // Near absolute end of last ayah — stop (ended may also fire).
    if (!audio.paused) {
      audio.pause()
      setPlaying(false)
      setProgress(1)
      setActiveWordIndex(null)
    }
  }
}
```

Import `findAyahIndexByTime` from `@/utils/audioSegments`.

`onEnded` → call `finishSurah` (chapter file ended).

`nextAyah` / `prevAyah` keep seeking via `playAyah`.

Remove `advancingRef` if unused.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`  
Expected: PASS (exit 0).

- [ ] **Step 6: Commit**

```bash
git add src/context/QuranAudioContext.tsx
git commit -m "Seek within chapter audio instead of per-ayah files."
```

---

### Task 5: Manual verification

**Files:** none (checklist only)

- [ ] **Step 1: Ensure `npm run dev` and open a surah**

- [ ] **Step 2: Run checklist from spec**

1. Al-Fatihah: play from ayah 1 → continues through 7 **without** gap/click; karaoke tracks.
2. Jump mid-surah; prev/next seek correctly.
3. Switch Alafasy ↔ Shatri; same ayah, karaoke sane.
4. Navigate away from `/quran/{n}` → player closes.
5. Network: **one** chapter MP3 (`/api/quran-audio?reciter=&surah=`) per surah+reciter — not N ayah files.
6. Surah 2: seek to a late ayah works (Range).

- [ ] **Step 3: Fix any regressions found, then final commit if needed**

```bash
git add -A
git status
# commit only if there are fixes
```

---

## Spec coverage (self-review)

| Spec item | Task |
|-----------|------|
| Single chapter MP3 from quran.com | 2, 3 |
| Absolute timestamps / no relativize | 2 |
| Proxy by reciter+surah, no open proxy | 3 |
| Seek playback, smooth ayah advance | 4 |
| Karaoke via absolute segments | 4 |
| Cache `audio-pack-v2` | 2 |
| No everyayah fallback | 2, 4 |
| Public API unchanged | 4 |
| Drop everyayah playback helpers | 1 |
| Manual test plan | 5 |
| Reject quran-online | documented; not implemented |

No placeholders remaining after inline review.
