# Perf + reduce motion — design

**Status:** implemented  
**Date:** 2026-08-11

## Goal

Safe performance polish without changing reader/player behavior, plus a settings toggle to disable CSS animations for weak devices. Fix custom scrollbar thumb jitter on long surahs.

## Scope

### In

1. **Reduce motion (CSS only)**  
   - Setting in Settings popover: «Отключить анимации» / «Disable animations»  
   - Persist `qh-reduce-motion` (`1` / `0`) in `localStorage`  
   - Apply `data-reduce-motion="1"` on `<html>`  
   - Global CSS kills `animation` / `transition` (also honor `prefers-reduced-motion: reduce`)  
   - Does **not** change auto-scroll-to-ayah, karaoke word timing, or audio logic

2. **Overlay scrollbar**  
   - Debounce/threshold ResizeObserver remeasures so thumb doesn’t jump on micro layout shifts  
   - Keep rAF on scroll updates

3. **Fonts**  
   - Switch Literata + IBM Plex Sans to `next/font/google` (self-hosted by Next)  
   - Keep Arabic UthmanicHafs preload/preconnect as today

### Out

- SSR rewrite of Quran/Hadith reader fetches  
- Disabling auto-scroll or karaoke  
- Bundle-splitting / removing providers from non-Quran routes

## UX

- Toggle under text-size controls (new small section / row)  
- Default: off (animations on), unless OS prefers reduced motion (CSS still applies via media query even if toggle off)

## Risks

- `next/font` may slightly change metric/fallback flash — acceptable  
- Global `transition: none` is intentional when toggle on
