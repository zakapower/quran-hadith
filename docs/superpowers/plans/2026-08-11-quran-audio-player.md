# Аудиоплеер Корана + караоке — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sticky-аудиоплеер на страницах сур с двумя чтецами, автопереходом аятов и караоке-подсветкой слов.

**Architecture:** Chapter MP3 + word segments с `api.quran.com`; один скрытый `<audio>` в `QuranAudioProvider`; UI — Play в `SurahNav` / на аяте + `QuranPlayerBar`; арабский текст аята — спаны слов из API.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Lucide, native `<audio>`, Quran.com API v4 (без новых npm-аудио-библиотек).

**Spec:** `docs/superpowers/specs/2026-08-11-quran-audio-player-design.md`

## Global Constraints

- Только Коран (страницы сур); хадисы не трогать.
- Иконки только Lucide.
- Чтецы v1: аш-Шатри (`id: 4`), Аль-Афаси (`id: 7`).
- ✕ = пауза + скрыть бар; уход с суры = то же.
- Конец суры: пауза, бар остаётся.
- `play()` только из пользовательского жеста.
- В репозитории нет test runner — проверки: `npx tsc --noEmit` + ручной чеклист в браузере; для чистых утилит — `npx --yes tsx` assert-скрипты в шагах.

---

## Карта файлов

| Файл | Роль |
|------|------|
| `src/data/reciters.ts` | Список чтецов |
| `src/utils/audioSegments.ts` | Нормализация сегментов, поиск слова/аята по времени |
| `src/utils/audioStorage.ts` | `localStorage`: чтец + last ayah |
| `src/api/quranAudio.ts` | Fetch chapter audio + words (кэш) |
| `src/context/QuranAudioContext.tsx` | Provider + `<audio>` + state/actions |
| `src/components/QuranPlayerBar.tsx` | Sticky UI |
| `src/components/QuranPlayerBar.css` | Стили бара |
| `app/layout.tsx` | Обернуть `QuranAudioProvider`, смонтировать бар |
| `src/components/pages/SurahView.tsx` | Play в nav / на аяте, слова, scroll |
| `src/components/pages/Reader.css` | `ayah--playing`, `ayah__word--active`, отступ под бар |
| `src/components/ReaderSkeleton.tsx` (+ css) | Play-слот в скелете nav (опционально, если ломает layout) |

---

### Task 1: Данные чтецов + утилиты сегментов/storage

**Files:**
- Create: `src/data/reciters.ts`
- Create: `src/utils/audioSegments.ts`
- Create: `src/utils/audioStorage.ts`

**Interfaces:**
- Produces:
  - `RECITERS`, `DEFAULT_RECITER_ID`, `getReciter(id)`
  - `WordSegment { wordIndex: number; startMs: number; endMs: number }`
  - `normalizeSegments(raw: unknown[]): WordSegment[]`
  - `findActiveWordIndex(segments: WordSegment[], tMs: number): number | null`
  - `findAyahIndexByTime(timestamps: AyahTiming[], tMs: number): number`
  - `AyahTiming { verseKey: string; ayah: number; fromMs: number; toMs: number; segments: WordSegment[] }`
  - `readAudioPrefs()` / `writeReciterId` / `readLastAyah` / `writeLastAyah`
  - Storage key prefix: `tilawah-audio-v1`

- [ ] **Step 1: Создать `src/data/reciters.ts`**

```ts
export type Reciter = {
  id: number
  nameRu: string
  nameEn: string
}

export const RECITERS: Reciter[] = [
  { id: 4, nameRu: 'Абу Бакр аш-Шатри', nameEn: 'Abu Bakr ash-Shatri' },
  { id: 7, nameRu: 'Мишари Аль-Афаси', nameEn: 'Mishary Al-Afasy' },
]

export const DEFAULT_RECITER_ID = 7

export function getReciter(id: number): Reciter {
  return RECITERS.find((r) => r.id === id) ?? RECITERS[0]
}
```

- [ ] **Step 2: Создать `src/utils/audioSegments.ts`**

```ts
export type WordSegment = {
  wordIndex: number
  startMs: number
  endMs: number
}

export type AyahTiming = {
  verseKey: string
  ayah: number
  fromMs: number
  toMs: number
  segments: WordSegment[]
}

/** Accepts API tuples like [wordIndex, startMs, endMs]; drops malformed. */
export function normalizeSegments(raw: unknown[]): WordSegment[] {
  const out: WordSegment[] = []
  for (const item of raw) {
    if (!Array.isArray(item) || item.length < 3) continue
    const wordIndex = Number(item[0])
    const startMs = Number(item[1])
    const endMs = Number(item[2])
    if (![wordIndex, startMs, endMs].every(Number.isFinite)) continue
    if (endMs <= startMs) continue
    out.push({ wordIndex, startMs, endMs })
  }
  return out
}

export function findActiveWordIndex(
  segments: WordSegment[],
  tMs: number,
): number | null {
  for (const s of segments) {
    if (tMs >= s.startMs && tMs < s.endMs) return s.wordIndex
  }
  return null
}

export function parseVerseKeyAyah(verseKey: string): number {
  const n = Number(verseKey.split(':')[1])
  return Number.isFinite(n) ? n : 0
}

export function findAyahIndexByTime(
  timestamps: AyahTiming[],
  tMs: number,
): number {
  if (timestamps.length === 0) return 0
  for (let i = 0; i < timestamps.length; i++) {
    const row = timestamps[i]
    if (tMs >= row.fromMs && tMs < row.toMs) return i
  }
  if (tMs >= timestamps[timestamps.length - 1].toMs) {
    return timestamps.length - 1
  }
  return 0
}
```

- [ ] **Step 3: Создать `src/utils/audioStorage.ts`**

```ts
const ROOT = 'tilawah-audio-v1'
const RECITER_KEY = `${ROOT}:reciter`
const LAST_KEY = `${ROOT}:lastAyah`

export function readReciterId(fallback: number): number {
  try {
    const raw = localStorage.getItem(RECITER_KEY)
    if (raw == null) return fallback
    const n = Number(raw)
    return Number.isFinite(n) ? n : fallback
  } catch {
    return fallback
  }
}

export function writeReciterId(id: number) {
  try {
    localStorage.setItem(RECITER_KEY, String(id))
  } catch {
    /* ignore */
  }
}

export function readLastAyah(surah: number): number | null {
  try {
    const raw = localStorage.getItem(LAST_KEY)
    if (!raw) return null
    const map = JSON.parse(raw) as Record<string, number>
    const n = map[String(surah)]
    return Number.isFinite(n) && n >= 1 ? n : null
  } catch {
    return null
  }
}

export function writeLastAyah(surah: number, ayah: number) {
  try {
    const raw = localStorage.getItem(LAST_KEY)
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {}
    map[String(surah)] = ayah
    localStorage.setItem(LAST_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}
```

- [ ] **Step 4: Проверить сегменты через tsx**

Создать временный файл `scripts/_assert-segments.mts` (потом удалить):

```ts
import assert from 'node:assert/strict'
import {
  normalizeSegments,
  findActiveWordIndex,
} from '../src/utils/audioSegments.ts'

const segs = normalizeSegments([[1, 0, 580], [2], [2, 580, 1409], 'x'])
assert.equal(segs.length, 2)
assert.equal(findActiveWordIndex(segs, 100), 1)
assert.equal(findActiveWordIndex(segs, 600), 2)
assert.equal(findActiveWordIndex(segs, 99999), null)
console.log('ok')
```

Run: `npx --yes tsx scripts/_assert-segments.mts`  
Expected: `ok`  
Удалить `scripts/_assert-segments.mts`.

- [ ] **Step 5: Commit**

```bash
git add src/data/reciters.ts src/utils/audioSegments.ts src/utils/audioStorage.ts
git commit -m "Add Quran audio reciter data and timing/storage helpers."
```

---

### Task 2: API chapter audio + words

**Files:**
- Create: `src/api/quranAudio.ts`

**Interfaces:**
- Consumes: `normalizeSegments`, `parseVerseKeyAyah`, `AyahTiming` from `audioSegments`
- Produces:
  - `ChapterRecitation { audioUrl: string; timestamps: AyahTiming[] }`
  - `fetchChapterRecitation(reciterId: number, chapter: number): Promise<ChapterRecitation>`
  - `fetchChapterWords(chapter: number): Promise<Map<number, string[]>>` — ayah → uthmani words

- [ ] **Step 1: Реализовать `src/api/quranAudio.ts`**

```ts
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
    words?: Array<{ char_type_name: string; text_uthmani?: string; text?: string }>
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
```

- [ ] **Step 2: Smoke-check API (сеть)**

```bash
npx --yes tsx -e "import { fetchChapterRecitation } from './src/api/quranAudio.ts'; const r = await fetchChapterRecitation(7,1); console.log(r.audioUrl, r.timestamps[0].segments.length)"
```

Expected: URL с `afasy` / `mishari` и `segments.length >= 1`.

- [ ] **Step 3: Commit**

```bash
git add src/api/quranAudio.ts
git commit -m "Add Quran.com chapter audio and word-token fetchers."
```

---

### Task 3: `QuranAudioProvider`

**Files:**
- Create: `src/context/QuranAudioContext.tsx`
- Modify: `app/layout.tsx` — обернуть children в provider (бар добавим в Task 4)

**Interfaces:**
- Consumes: `fetchChapterRecitation`, `fetchChapterWords`, reciters, storage, segment helpers
- Produces hook `useQuranAudio()`:

```ts
type QuranAudioApi = {
  visible: boolean
  playing: boolean
  loading: boolean
  error: string | null
  reciterId: number
  surah: number | null
  ayah: number | null
  activeWordIndex: number | null
  progress: number // 0..1 within current ayah
  wordsByAyah: Map<number, string[]> | null
  openAndPlay: (opts: { surah: number; ayah?: number }) => void
  togglePause: () => void
  pause: () => void
  close: () => void
  nextAyah: () => void
  prevAyah: () => void
  setReciter: (id: number) => void
  retry: () => void
}
```

- [ ] **Step 1: Реализовать provider**

Ключевые правила (вшить в код):

1. `openAndPlay({ surah, ayah? })`: `ayah = ayah ?? readLastAyah(surah) ?? 1`; `visible=true`; загрузить recitation+words; если `audio.src` другой — set src и ждать `canplay`; seek `fromMs/1000`; `play()`; `writeLastAyah`.
2. `timeupdate` (rAF-throttle ок): `tMs = currentTime*1000`; найти ayah index; если ayah сменился — setState + `document.getElementById('a'+ayah)?.scrollIntoView({behavior:'smooth', block:'center'})`; `activeWordIndex = findActiveWordIndex(...)`; `progress = (tMs-from)/(to-from)`.
3. Когда `tMs >= last.toMs - 40` или `ended`: если не последний — seek next `fromMs` (или просто дать файлу играть и обновить state); если последний — `pause()`, бар виден.
4. `setReciter`: `writeReciterId`; если visible+surah — перезагрузить chapter и restart текущего ayah.
5. `close` / unmount route: см. Task 5 `usePathname` эффект в SurahView **или** в provider слушать pathname и если не `/quran/[n]` текущей суры — close. Предпочтительно: эффект в provider через `usePathname()`:

```ts
const pathname = usePathname()
useEffect(() => {
  if (!visible || surah == null) return
  if (pathname !== `/quran/${surah}`) close()
}, [pathname, surah, visible])
```

6. Ошибки: `setError`, `playing=false`; `retry` повторяет последний `openAndPlay`.

Держать `audioRef = useRef<HTMLAudioElement>(null)` и рендерить `<audio ref={audioRef} preload="metadata" />` внутри provider.

Не экспортировать сырой audio element.

- [ ] **Step 2: Подключить в `app/layout.tsx`**

Внутри `AppProvider`:

```tsx
import { QuranAudioProvider } from '@/context/QuranAudioContext'
// ...
<AppProvider initialLang={lang}>
  <QuranAudioProvider>
    ...
  </QuranAudioProvider>
</AppProvider>
```

- [ ] **Step 3: `npx tsc --noEmit`** — без ошибок по новым файлам.

- [ ] **Step 4: Commit**

```bash
git add src/context/QuranAudioContext.tsx app/layout.tsx
git commit -m "Add QuranAudioProvider with chapter playback state."
```

---

### Task 4: `QuranPlayerBar` UI

**Files:**
- Create: `src/components/QuranPlayerBar.tsx`
- Create: `src/components/QuranPlayerBar.css`
- Modify: `app/layout.tsx` — `<QuranPlayerBar />` рядом с main/footer

**Interfaces:**
- Consumes: `useQuranAudio()`, `RECITERS`, `useApp().t`

- [ ] **Step 1: Разметка бара**

Если `!visible` → `return null`.

Структура:

```tsx
<div className="quran-player" role="region" aria-label={...}>
  <div className="quran-player__progress" style={{ ['--p' as string]: progress }} />
  <div className="quran-player__row">
    <select value={reciterId} onChange={(e) => setReciter(Number(e.target.value))} ...>
      {RECITERS.map(...)}
    </select>
    <div className="quran-player__transport">
      <button type="button" onClick={prevAyah} aria-label=...><SkipBack /></button>
      <button type="button" onClick={togglePause} ...>{playing ? <Pause /> : <Play />}</button>
      <button type="button" onClick={nextAyah} ...><SkipForward /></button>
    </div>
    <span className="quran-player__ref">{surah}:{ayah}</span>
    <button type="button" onClick={close} aria-label=...><X /></button>
  </div>
  {error && <p className="quran-player__error">{error} <button onClick={retry}>...</button></p>}
  {loading && <p className="quran-player__status">...</p>}
</div>
```

Иконки Lucide: `Play`, `Pause`, `SkipBack`, `SkipForward`, `X`.  
`strokeWidth={2}` как в Header.

- [ ] **Step 2: CSS**

- `position: fixed; left:0; right:0; bottom:0; z-index: 65`
- фон `var(--surface)`, бордер сверху `var(--line)`
- padding + `env(safe-area-inset-bottom)`
- progress: высота 2–3px, fill через `scaleX(var(--p))` transform-origin left
- mobile: компактный row, select не обрезается
- `@media (hover: hover) and (pointer: fine)` для hover кнопок (как остальные ctrl)

- [ ] **Step 3: Смонтировать в layout**

```tsx
<QuranPlayerBar />
```

внутри `QuranAudioProvider`, после `app-shell` или внутри shell перед footer — fixed всё равно.

- [ ] **Step 4: Ручная проверка** — временно в DevTools вызвать нельзя без UI; после Task 5. Здесь `tsc --noEmit`.

- [ ] **Step 5: Commit**

```bash
git add src/components/QuranPlayerBar.tsx src/components/QuranPlayerBar.css app/layout.tsx
git commit -m "Add sticky Quran player bar UI."
```

---

### Task 5: Интеграция в `SurahView` (Play + слова + стили)

**Files:**
- Modify: `src/components/pages/SurahView.tsx`
- Modify: `src/components/pages/Reader.css`
- Modify: `src/components/ReaderSkeleton.tsx` / `.css` — слот под центральную кнопку в nav, чтобы скелет не прыгал

**Interfaces:**
- Consumes: `useQuranAudio()`

- [ ] **Step 1: Обновить `SurahNav`**

Заменить meta «Сура N из 114» на кнопку Play/Pause:

```tsx
function SurahNav({ n, top = false }: { n: number; top?: boolean }) {
  const { t } = useApp()
  const audio = useQuranAudio()
  const isThis =
    audio.visible && audio.surah === n && audio.playing
  return (
    <nav className={`reader__nav${top ? ' reader__nav--top' : ''}`} ...>
      {/* prev link unchanged */}
      <button
        type="button"
        className="reader__nav-btn reader__nav-btn--play"
        onClick={() => {
          if (audio.visible && audio.surah === n && audio.playing) audio.togglePause()
          else if (audio.visible && audio.surah === n && !audio.playing) audio.togglePause()
          else audio.openAndPlay({ surah: n })
        }}
        aria-label={t('Слушать суру', 'Play surah')}
      >
        {isThis ? <Pause strokeWidth={2.25} /> : <Play strokeWidth={2.25} />}
      </button>
      {/* next link unchanged */}
    </nav>
  )
}
```

Логика клика упрощённо: если `audio.surah === n && audio.visible` → `togglePause()`, иначе `openAndPlay({ surah: n })`.

- [ ] **Step 2: Play на аяте + класс playing**

В `ayah__top` рядом с `CopyAyahButton`:

```tsx
<button
  type="button"
  className="ayah__play"
  onClick={() => audio.openAndPlay({ surah: surah.number, ayah: a.numberInSurah })}
  aria-label={...}
>
  <Play strokeWidth={2} />
</button>
```

`className` аята:

```ts
const playing =
  audio.visible &&
  audio.surah === surah.number &&
  audio.ayah === a.numberInSurah
const cls = [
  'ayah',
  hit ? 'ayah--hit' : '',
  playing ? 'ayah--playing' : '',
].filter(Boolean).join(' ')
```

- [ ] **Step 3: Караоке-рендер арабского**

```tsx
const words = audio.wordsByAyah?.get(a.numberInSurah)
<p className="ayah__ar" dir="rtl" lang="ar">
  {playing && words && words.length > 0
    ? words.map((w, i) => {
        const idx = i + 1 // API wordIndex 1-based
        const active = audio.activeWordIndex === idx
        return (
          <span
            key={`${a.numberInSurah}-${idx}`}
            className={active ? 'ayah__word ayah__word--active' : 'ayah__word'}
          >
            {w}
          </span>
        )
      })
    : a.text}
</p>
```

Между словами нужен пробел: `{i > 0 ? ' ' : null}` или `margin` на `.ayah__word`.

Пока `playing` но words ещё грузятся — показывать `a.text` целиком с `ayah--playing`.

- [ ] **Step 4: CSS**

В `Reader.css`:

```css
.reader--player-open {
  padding-bottom: calc(5.5rem + env(safe-area-inset-bottom, 0px));
}

.ayah--playing {
  border-color: color-mix(in srgb, var(--accent) 45%, var(--line));
  background: color-mix(in srgb, var(--accent) 8%, var(--surface));
}

.ayah__word {
  transition: color 0.12s ease, opacity 0.12s ease;
}

.ayah--playing .ayah__word {
  opacity: 0.45;
}

.ayah--playing .ayah__word--active {
  opacity: 1;
  color: var(--accent);
  font-weight: 600;
}

.ayah__play { /* mirror .ayah__copy size */ }

.reader__nav-btn--play { /* same size as nav-btn */ }
```

На корне `.reader` добавить `reader--player-open`, когда `audio.visible && audio.surah === n`.

`prefers-reduced-motion`: у `.ayah__word` `transition: none`.

- [ ] **Step 5: Скелет nav** — третий «слот» уже есть как meta; заменить центральный bone на квадрат-кнопку как у боковых (уже два btn + meta — ok если meta≈кнопка). При необходимости укоротить `reader-skel__nav-meta` до размера кнопки.

- [ ] **Step 6: Ручной чеклист на `http://localhost:3000/quran/1`**

1. Play в nav → бар, чтение, слова подсвечиваются, скролл.
2. Play на аяте 3 → старт с 3.
3. Next/prev в баре.
4. Смена чтеца.
5. Конец суры (короткая: 108) → пауза, бар открыт.
6. ✕ → скрыт; Play снова → resume last.
7. Уход на `/hadith` → бар скрыт, звук стоп.

- [ ] **Step 7: Commit**

```bash
git add src/components/pages/SurahView.tsx src/components/pages/Reader.css src/components/ReaderSkeleton.tsx src/components/ReaderSkeleton.css
git commit -m "Wire Quran player into SurahView with word karaoke."
```

---

### Task 6: Полировка + синхронизация спека

**Files:**
- Modify: `docs/superpowers/specs/2026-08-11-quran-audio-player-design.md` — статус `approved / implemented`
- Fix любые баги с Task 5 чеклиста

- [ ] **Step 1:** Пройти чеклист Task 5 ещё раз; починить регрессии (sticky hover только fine pointer; z-index бара vs settings).

- [ ] **Step 2:** `npx tsc --noEmit`

- [ ] **Step 3:** Обновить статус в спеке на «утверждён / реализован».

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-08-11-quran-audio-player-design.md
git commit -m "Mark Quran audio player design as implemented."
```

---

## Self-review (plan vs spec)

| Требование спека | Task |
|------------------|------|
| Sticky бар | 4 |
| Play между стрелками | 5 |
| Play на аяте | 5 |
| 2 чтеца + select | 1, 4 |
| Auto next + highlight + scroll | 3, 5 |
| Конец суры = pause, бар открыт | 3 |
| Resume last ayah | 1, 3 |
| ✕ pause+hide; leave surah close | 3 |
| Lucide | 4, 5 |
| Quran.com chapter + segments | 2, 3 |
| Word karaoke | 2, 3, 5 |
| Только Коран | Global + SurahView only |
| Error + retry | 3, 4 |
| Отступ под бар | 5 |
| Fallback без сегментов | 5 (целый текст + ayah--playing) |

Placeholders: нет.  
Типы: `ChapterRecitation`, `AyahTiming`, `useQuranAudio` согласованы между задачами.

---
