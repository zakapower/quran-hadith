# Quran Audio Player + Word Karaoke — Design

Date: 2026-08-11  
Status: draft for user review

## Goal

Add a Qur’an audio player on surah pages with:

- Play control between surah prev/next arrows
- Per-ayah play to start from a chosen ayah
- Sticky bottom player bar
- Two reciters (Abu Bakr ash-Shatri, Mishary Al-Afasy)
- Auto-advance ayah with highlight + autoscroll
- Word-by-word karaoke highlighting while an ayah is recited

## Non-goals (v1)

- Hadith audio
- More than two reciters
- Playback speed control
- Download / offline cache of MP3
- Continuing into the next surah automatically
- Letter-level karaoke

## Decisions (locked)

| Topic | Choice |
|--------|--------|
| Player chrome | Sticky bottom bar (opens on Play) |
| Playback flow | Auto next ayah + ayah highlight + autoscroll |
| End of surah | Pause; bar stays open on last ayah |
| Start ayah (nav Play) | Resume last ayah for that surah from `localStorage`, else ayah 1 |
| Per-ayah Play | Yes — starts from that ayah |
| Close (✕) | Hide bar + pause |
| Leave surah page | Pause + hide bar |
| Icons | Lucide only (`Play`, `Pause`, `SkipBack`, `SkipForward`, `X`, etc.) |
| Audio + timings | Quran.com public API chapter recitation (not everyayah) |
| Karaoke | Word-level segments synced to chapter MP3 |

## Architecture

### Audio source

Use chapter-level MP3 + verse/word timestamps:

`GET https://api.quran.com/api/v4/chapter_recitations/{reciterId}/{chapter}?segments=true`

Verified reciter IDs:

| Reciter (UI) | API id | Sample audio |
|--------------|--------|--------------|
| Abu Bakr ash-Shatri | `4` | `…/abu_bakr_shatri/murattal/{n}.mp3` |
| Mishary Al-Afasy | `7` | `…/mishari_al_afasy/murattal/{n}.mp3` |

Response shape (relevant fields):

- `audio_file.audio_url` — full surah MP3
- `audio_file.timestamps[]` — per ayah:
  - `verse_key`, `timestamp_from`, `timestamp_to` (ms)
  - `segments`: arrays `[wordIndex, startMs, endMs]` (filter malformed entries that lack times)

CDN base for relative ayah URLs is not needed for chapter mode; use `audio_url` as-is.

### Word text for karaoke

Arabic ayah text on the reader must be renderable as **word spans** whose indices match segment `wordIndex` (1-based in API samples).

Fetch words when playback needs karaoke (lazy on first play of a surah is fine), e.g.:

`GET https://api.quran.com/api/v4/verses/by_chapter/{n}?words=true&word_fields=text_uthmani&per_page=50`

Paginate until all ayahs are loaded (al-Baqarah = 286 verses). Cache the word map `ayahNumber → text_uthmani[]`.

Use `char_type_name === "word"` only (skip ayah end markers). Keep existing translation source (`fawazahmed0` / current `fetchSurah`) for RU/EN lines unless we later unify.

Fallback if words or segments missing for an ayah: highlight the whole ayah only (no word karaoke).

### Modules

1. **`src/data/reciters.ts`**  
   Static list of two reciters (`id`, `nameRu`, `nameEn`, default).

2. **`src/api/quranAudio.ts`**  
   `fetchChapterRecitation(reciterId, chapter)` → audio URL + timestamps (in-memory cache per reciter+chapter).  
   Optional: `fetchChapterWords(chapter)` for uthmani word tokens (cache).

3. **`QuranAudioProvider` / context**  
   Single hidden `<audio>` element. State:
   - `visible`, `playing`
   - `reciterId`, `surah`, `ayah`
   - `activeWordIndex` (`null` when not karaoke-able)
   - `progress` (0–1 within current ayah or full file — prefer within-ayah for the bar)
   - `error` (load/play failure message)
   - `lastAyahBySurah` hydrated from `localStorage`

   Actions: `openAndPlay({ surah, ayah? })`, `pause`, `resume`, `close`, `nextAyah`, `prevAyah`, `setReciter`, seek within ayah optional (progress bar click — nice-to-have if cheap).

4. **`QuranPlayerBar`**  
   Sticky bottom UI; mounted near app shell / layout so it can sit above content while on `/quran/[n]`.

5. **`SurahView` / `SurahNav`**  
   Center Play between chevrons; per-ayah Play next to copy; ayah Arabic rendered with word spans; `ayah--playing` + `ayah__word--active`.

6. **Persistence**  
   `localStorage` keys (namespaced, e.g. `tilawah-audio-v1`):
   - selected `reciterId`
   - map `surah → lastAyah`

### Playback engine (behavior)

1. On first play for `(reciter, surah)`: fetch chapter audio payload; set `audio.src = audio_url`; when ready, `currentTime = timestamp_from(ayah) / 1000`; `play()`.
2. On `timeupdate`:
   - Derive current ayah from timestamps (or trust queued ayah until `timestamp_to`).
   - Set `activeWordIndex` from segments where `startMs <= t < endMs`.
   - Update progress for the bar.
3. When `t` crosses ayah `timestamp_to` (or `ended` near last):
   - If more ayahs: bump ayah, highlight, smooth-scroll into view, continue (same file — no reload).
   - If last ayah: `pause()`, keep bar visible, persist last ayah.
4. Prev/next controls: seek to neighboring ayah’s `timestamp_from` (clamp at 1 / last).
5. Reciter change: keep surah+ayah; refetch chapter audio for new reciter; restart that ayah from its `timestamp_from`.
6. Close ✕: `pause()`, `visible = false`, clear `activeWordIndex`.
7. Route change away from current surah reader: same as close (pause + hide).
8. Errors: show short message in bar + retry; do not auto-advance.

Prefetch: not required beyond browser buffering of the single chapter file.

### UI

**Surah nav (top + bottom):**

`[ChevronLeft]  [Play|Pause]  [ChevronRight]`

- Play opens bar and starts/resumes per rules above.
- If already playing this surah, center button can toggle pause/resume (same Lucide icons).

**Ayah row:** Lucide Play beside copy; starts that ayah.

**Sticky bar:**

- Top: thin progress for current ayah
- Row: reciter select | SkipBack · Play/Pause · SkipForward | `surah:ayah` label | X
- Safe-area padding; `z-index` above content, below critical modals if any (≈ 60–70)
- Extra bottom padding on `.reader` / ayah list while `visible`

**Karaoke styling:**

- Playing ayah: `ayah--playing` (distinct from search `ayah--hit`)
- Active word: stronger color / weight; other words in that ayah slightly muted
- Respect `prefers-reduced-motion`: still switch active word, no extra motion

**i18n:** reciter names and aria-labels via existing `t()`.

## Error handling

- Network / 5xx on chapter fetch → bar error + retry
- `audio` `error` event → same
- Malformed segments → skip those entries; if none valid → ayah-level highlight only
- Missing recitation for a chapter (shouldn’t happen for 1–114) → error state

## Testing (manual)

1. Open a surah → Play in nav → bar appears, starts ayah 1 (or resumed), words highlight, autoscroll.
2. Play on ayah 5 → starts there; karaoke works.
3. Skip next/prev; end of surah pauses with bar open.
4. Switch reciter mid-ayah → same ayah, new voice, karaoke still tracks.
5. ✕ closes and pauses; reopen resumes from stored ayah.
6. Mobile: bar clears home indicator; last ayah not hidden under bar.
7. Search highlight `?a=` still works and doesn’t permanently fight `ayah--playing` (playing wins while active).

## Implementation notes

- Prefer client components; audio must start from user gesture.
- Do not add Howler/Wavesurfer in v1 — native `<audio>` is enough for chapter seek + `timeupdate`.
- Keep provider scoped: wrap surah route layout or root layout; bar renders only when `visible` (and optionally only under `/quran/*`).
- Filter segment tuples to length ≥ 3 before use.
- Chapter files for long surahs are large; show subtle loading state on first play per surah/reciter.

## Open follow-ups (explicitly out of v1)

- Progress-bar scrubbing within ayah
- More reciters
- Next-surah autoplay
- Offline / service worker caching
