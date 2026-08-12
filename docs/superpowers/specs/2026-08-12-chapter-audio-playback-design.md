# Chapter audio playback (single file per surah)

Date: 2026-08-12  
Status: approved for planning

## Goal

Play each surah as **one continuous MP3** (like quran.com), instead of one file per ayah.

Success criteria:

1. **Smooth** — no gap/click when advancing ayah → ayah
2. **Fewer requests** — one audio fetch per surah+reciter (plus timing metadata)
3. **Karaoke stays in sync** — audio file and timestamps come from the **same** source
4. **No UI break** — existing player API (play/pause/prev/next/reciter/close/karaoke highlight) keeps working

Out of scope:

- Using [quran-online.ru](https://quran-online.ru/) media CDN (rejected: Shatri chapter file size ≠ quran.com timings)
- Adding new reciters
- Offline download / local mirroring of chapter files

## Current vs target

| | Current | Target |
|---|---|---|
| Audio | everyayah.com per-ayah via `/api/quran-audio?reciter&surah&ayah` | quran.com / quranicaudio **chapter** file via proxy |
| Timings | `chapter_recitations` then **relativized** to ayah start | same API, **absolute** ms from chapter start |
| Advance | swap `audio.src`, `play()` next file | `currentTime = fromMs / 1000` on same element |
| Pack shape | `{ timestamps, audioByAyah }` | `{ audioUrl, timestamps }` |

## Data source

Endpoint (already used):

`GET https://api.quran.com/api/v4/chapter_recitations/{reciterId}/{chapter}?segments=true`

Relevant fields:

- `audio_file.audio_url` — full-surah MP3 (e.g. `https://download.quranicaudio.com/qdc/.../{n}.mp3`)
- `audio_file.timestamps[]` — `verse_key`, `timestamp_from`, `timestamp_to`, `segments` (absolute ms)

Reciter IDs stay as today (`7` Alafasy, `4` ash-Shatri).

## Architecture

### 1. `fetchChapterAudioPack`

- Fetch chapter recitation once; require `audio_url` + timestamps.
- Map timestamps **without** relativizing segments / zeroing `fromMs`.
- Return `{ audioUrl: string, timestamps: AyahTiming[] }`.
- Persist in `pageCache` under a **new** namespace/key version (e.g. `audio-pack-v2`) so old per-ayah packs are ignored.
- Fallback if API fails: clear error to UI (no everyayah fallback — avoids mismatched karaoke).

### 2. Proxy `/api/quran-audio`

- Accept `reciter` + `surah` (ayah optional/ignored).
- Resolve upstream: either pass-through URL from pack load path, or re-fetch `audio_url` server-side from the same quran.com endpoint (prefer: client sends nothing sensitive; server looks up `audio_url` by reciter+surah to avoid open proxy).
- Stream body with `Range` / `Accept-Ranges` / cache headers (same behavior as today).
- Browser always plays `/api/quran-audio?reciter=&surah=` (same-origin).

### 3. `QuranAudioContext` playback

- Keep a single `HTMLAudioElement`.
- On load: set `src` to chapter proxy URL once; `load()`; seek to target ayah `fromMs`.
- `playAyah(n)` → seek + optional `play()`; scroll to `#a{n}`; update last-ayah storage.
- `timeupdate`:
  - resolve ayah via `findAyahIndexByTime(timestamps, tMs)` (already exists);
  - word highlight via absolute segments;
  - progress = `(tMs - fromMs) / (toMs - fromMs)` clamped 0–1;
  - when `tMs` crosses into next ayah, update `ayah` state + scroll (throttle/rAF as today).
- End of surah: when `tMs >= last.toMs` or `ended` → pause, progress 1, clear word.
- Prev/next / ayah button / surah Play: seek only if same surah+reciter already loaded.
- Reciter change: reload pack + new chapter src, seek to current ayah.

### 4. Reciters / helpers

- Drop everyayah folder URLs from the **playback** path (can leave dead helpers unused or remove in the same change).
- Optional: store `quranComReciterId` explicitly on `Reciter` (today `id` already is that).

## Error handling

- Timing/audio API failure → `error: load-failed`, Retry reloads pack.
- Proxy/upstream 4xx/5xx → play-failed / load-failed as today.
- Missing segments on an ayah → no word highlight for that ayah; playback still works.

## Testing (manual)

1. Al-Fatihah: play from 1 → auto-continues through 7 without audible gaps; karaoke tracks words.
2. Jump to ayah mid-surah; prev/next seek correctly.
3. Switch Alafasy ↔ Shatri mid-play; resumes same ayah, karaoke still sane.
4. Leave `/quran/{n}` → player closes (existing behavior).
5. Network tab: one chapter MP3 request per surah+reciter (not N ayah files).
6. Long surah (e.g. 2): seek to late ayah still works (Range support).

## Non-goals / explicit rejections

- **quran-online.ru** `by-sura` files: convenient CDN, but ash-Shatri master differs from quran.com timing set → rejected for sync.
- Stitching everyayah ayah files client-side.
- Prefetch-only mitigation without single-file playback.
