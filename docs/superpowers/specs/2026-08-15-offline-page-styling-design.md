# Offline page styling

**Date:** 2026-08-15  
**Status:** approved (implement immediately)

## Goal

Style `/offline` as a compact empty-state consistent with Tilāwah (favorites empty pattern), not a raw unstyled stub.

## Scope

- Route `/offline` only
- Bilingual via request lang (one language at a time), not `RU / EN` slash lines
- Links: `/`, `/quran`, `/hadith`, `/favorites`
- No cache inventory, diagnostics, or not-found changes

## Design

- Centered dashed empty panel inside a narrow page shell
- Lucide `WifiOff` accent icon
- Display `h1` + muted lead
- Primary button → Home; ghost buttons → Qur’an, Hadith, Favorites
- Own `Offline.css` (do not depend on `Home.css` / `Reader.css` being cached)

## Files

| File | Role |
|------|------|
| `src/components/pages/OfflineView.tsx` | Markup + copy |
| `src/components/pages/Offline.css` | Layout + empty panel + actions |
| `app/offline/page.tsx` | Metadata + `getRequestLang` → view |

## Out of scope

- Restyling `not-found`
- PWA / SW behavior changes
