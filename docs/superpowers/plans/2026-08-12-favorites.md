# Favorites + Mobile Player Size — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bookmark ayahs/hadiths to `/favorites` (Коран|Хадисы tabs), header bookmark + mobile burger; enlarge mobile mini player.

**Architecture:** `localStorage` store + `useSyncExternalStore` hook; Lucide `Bookmark`/`BookmarkCheck`; header burger replaces mobile tab strip; CSS-only player size bump.

**Tech Stack:** Next.js 15, React 19, TypeScript, Lucide, localStorage.

**Spec:** `docs/superpowers/specs/2026-08-12-favorites-design.md`

## Global Constraints

- Icon: Bookmark ribbon, not star.
- Storage key: `tilawah-favorites-v1`; cap 200 per list.
- Mobile burger ≤720px; bookmark stays in controls.
- No account sync.
- Verify: `npx tsc --noEmit` + manual checklist.

---

## File map

| File | Role |
|------|------|
| `src/utils/favorites.ts` | Read/write store, toggle, subscribe |
| `src/hooks/useFavorites.ts` | `useSyncExternalStore` wrappers |
| `src/components/FavoriteButton.tsx` | Toggle control |
| `src/components/pages/FavoritesView.tsx` + css | Tabs + lists |
| `app/favorites/page.tsx` | Route |
| `src/components/Header.tsx` + css | Bookmark link + burger |
| `SurahView` / `HadithSectionView` | Wire FavoriteButton |
| `QuranPlayerBar.css` / `Reader.css` | Larger mobile mini-bar |
| `app/sitemap.ts` | Add `/favorites` |

### Task 1: Mobile player size

- [ ] Bump mini btn/main, ref font, bar padding; `--player-bar-h` ~4.85rem
- [ ] `npx tsc --noEmit` (no type impact expected)

### Task 2: Favorites store + hook + button

- [ ] Implement `favorites.ts` + `useFavorites.ts` + `FavoriteButton.tsx`
- [ ] Wire into SurahView / HadithSectionView
- [ ] Typecheck

### Task 3: `/favorites` page

- [ ] FavoritesView with tabs + empty states + remove
- [ ] `app/favorites/page.tsx` + sitemap

### Task 4: Header bookmark + burger

- [ ] Bookmark ctrl → `/favorites`
- [ ] Mobile: hide tab strip; Menu drawer with Главная/Коран/Хадисы
- [ ] Typecheck + manual pass
