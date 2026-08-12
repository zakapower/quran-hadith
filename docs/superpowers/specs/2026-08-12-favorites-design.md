# Favorites (bookmark) — design

Date: 2026-08-12  
Status: approved for planning

## Goal

Let users bookmark individual **ayahs** and **hadiths**, open them from a dedicated page with **Коран | Хадисы** tabs, and keep mobile header usable via a **burger** menu.

## Decisions

| Topic | Choice |
|-------|--------|
| What | Ayahs + hadiths (not whole surahs/books) |
| Storage | `localStorage` only (no account) |
| Entry | Bookmark control in header `site-controls` → `/favorites` |
| Icon | Lucide **`Bookmark`** / **`BookmarkCheck`** (ribbon/flag), not star |
| Page split | Tabs on one page: Коран \| Хадисы |
| Mobile nav | Burger menu for Главная / Коран / Хадисы; bookmark + lang + theme + settings stay visible |
| Toggle UI | Bookmark button next to copy on ayah and hadith cards |

## Data

Key: `tilawah-favorites-v1`

```ts
type FavoriteAyah = {
  surah: number
  ayah: number
  /** Translation snippet at save time */
  snippet: string
  addedAt: number
}

type FavoriteHadith = {
  bookId: string
  sectionId: string
  number: number
  /** Book title + text snippet at save time */
  bookTitle: string
  snippet: string
  addedAt: number
}

type FavoritesStore = {
  ayahs: FavoriteAyah[]
  hadiths: FavoriteHadith[]
}
```

Identity:

- Ayah: `surah:ayah`
- Hadith: `bookId:sectionId:number`

API (module e.g. `src/utils/favorites.ts` + thin React hook/context if needed for live UI updates):

- `listAyahs()` / `listHadiths()` — newest first (`addedAt` desc)
- `isAyahFavorite(surah, ayah)` / `isHadithFavorite(...)`
- `toggleAyah(...)` / `toggleHadith(...)` — add or remove; persist immediately
- Cap list length (e.g. 200 each) — drop oldest when exceeding

Snippet: store translation (or arabic fallback for hadith) truncated ~180 chars so the favorites page does not fetch CDN.

## UI

### Reader cards

- Ayah (`SurahView`): bookmark control in `ayah__actions` beside `CopyAyahButton`
- Hadith (`HadithSectionView`): same pattern beside `CopyQuoteButton`
- Filled/check state when favorited (`BookmarkCheck` or filled `Bookmark`)
- `aria-label` / title: «В избранное» / «Убрать из избранного»

### Header

- New control: link/button with Bookmark icon → `/favorites` (active when path starts with `/favorites`)
- Desktop: keep text nav as today (Главная, Коран, Хадисы)
- Mobile (`max-width: 720px`):
  - Hide the full-width bottom tab strip of `.site-nav`
  - Add burger (`Menu` / `X`) in controls that opens a panel/drawer with the same three links
  - Bookmark, lang, theme, settings remain in the control row

### `/favorites` page

- Title: Избранное / Favorites
- Tabs: Коран | Хадисы (URL optional: `?tab=quran|hadith` or hash; default Коран, or last used tab in session)
- List items:
  - **Ayah:** ref `n:m`, snippet, link via `ayahRefPath` → `/quran/{n}?a={m}`
  - **Hadith:** book title + number, snippet, link via `hadithRefPath`
  - Bookmark on row removes item (list updates live)
- Empty state: short tip to use bookmark on an ayah/hadith

Reuse reader/list visual language (no new card chrome beyond existing `.ayah` / list patterns where possible).

## Out of scope

- Account sync / cloud
- Favoriting whole surahs or hadith books
- Export/import
- Search inside favorites

## Manual checks

1. Toggle ayah bookmark → appears under Коран tab; toggle off → gone from page and card.
2. Same for hadith under Хадисы.
3. Header bookmark opens `/favorites`; tabs switch without losing the other list.
4. Mobile: burger opens nav; bookmark control still reachable; no double nav strip.
5. Reload keeps favorites (localStorage).
6. Open item deep-links to correct ayah/hadith highlight.
