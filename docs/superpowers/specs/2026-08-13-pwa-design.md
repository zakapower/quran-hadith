# Progressive Web App — design

Date: 2026-08-13  
Status: approved for planning

## Goal

Make Tilāwah installable as a standalone app and usable offline for **already visited** reading pages and **already played** Qur’an audio — without custom install UI or download buttons.

## Decisions

| Topic | Choice |
|-------|--------|
| Scope | Installability + offline reading of visited routes + auto offline audio of played surahs |
| Install UX | System only (browser / OS). No `beforeinstallprompt` banner, no «Install» menu item |
| Offline miss | Dedicated `/offline` page: short message + links to `/`, `/quran`, `/hadith`, `/favorites` |
| Stack | `@serwist/next` + `serwist` (App Router) |
| SW in dev | Disabled (`NODE_ENV === 'development'`) |
| Audio offline | Automatic Cache Storage via same-origin `/api/quran-audio` when the player fetches; no download UI |
| Audio file export | Out of scope (no save-to-Downloads) |
| External APIs | Not cached by SW (quran.com etc.); existing `pageCache` / network behavior unchanged |
| SW updates | `skipWaiting` + `clientsClaim`; no «Update available» banner |
| Manifest theme | `theme_color` / `background_color`: `#101512` (matches default dark theme) |
| Icons | Static PNG 192×192 and 512×512 (+ maskable), brand-aligned with current favicon |

## Architecture

### Manifest

- `app/manifest.ts`
- `name` / `short_name`: Tilāwah
- `start_url`: `/`
- `display`: `standalone`
- Icons under `public/icons/` (192, 512, maskable)

### Service worker

- Source: `app/sw.ts` → build output `public/sw.js`
- Wire via `withSerwist` in `next.config.ts`
- Precache: Next build precache manifest, `/offline`, `/fonts/UthmanicHafs1Ver18.woff2`, PWA icons
- Runtime:
  - Navigations / RSC documents: NetworkFirst, fallback navigate → `/offline`
  - Other same-origin static assets: Serwist `defaultCache` (CacheFirst / SWR as configured there)
  - `/api/quran-audio`: CacheFirst; cap at **32** responses (LRU); on `QuotaExceeded`, delete oldest until write succeeds
- Do not introduce UI to manage audio cache

### Layout / metadata

- Extend root `app/layout.tsx` metadata: `applicationName`, `appleWebApp` (`capable`, title), keep existing `themeColor` viewport entries
- Manifest linked by Next automatically from `manifest.ts`

### Offline page

- Route: `/offline`
- Bilingual short copy consistent with site tone
- Links only (no cache inventory, no diagnostics)

## Data flow

1. Online visit → SW (or Serwist navigation caching) stores document/RSC responses for that URL.
2. Player requests `/api/quran-audio?...` → response cached after successful fetch.
3. Offline revisit of cached URL → served from Cache Storage.
4. Offline uncached navigation → `/offline`.
5. Offline play of previously fetched audio URL → CacheFirst hit; otherwise existing player error path (no new empty-state UI).

## Out of scope

- Custom install prompts / teach-install UI
- Explicit «download surah» or download manager
- Saving MP3 to the device Downloads folder
- Push notifications
- Offline for never-visited pages or never-played audio
- Precaching the entire Qur’an / all reciters
- Changing audio proxy contract beyond SW caching of existing responses

## Success criteria

- Lighthouse / Chromium: installable (manifest + SW + icons + HTTPS)
- Chrome: «Install app» available; opens `standalone`
- Offline: shell + previously visited surah/hadith page load; unvisited → `/offline`
- Offline: previously played chapter audio (same proxy URL / reciter+chapter) plays
- No new install or download controls in the product UI
- iOS: Add to Home Screen works; SW/offline limits accepted as platform constraints

## Test plan (manual)

1. Production build + `next start` over localhost/HTTPS as required for SW
2. Install from Chrome; verify standalone chrome and icons
3. Visit a surah and a hadith section; play a chapter; go offline; reopen those; play again
4. Offline open an unvisited surah → `/offline`
5. Confirm no install/download buttons were added to header/player
