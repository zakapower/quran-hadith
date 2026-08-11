# Perf + reduce motion — plan

> **For agentic workers:** implement tasks in order; verify after each.

**Goal:** Setting to disable CSS animations, fix overlay scrollbar jitter, migrate UI fonts to `next/font`.

**Spec:** `docs/superpowers/specs/2026-08-11-perf-reduce-motion-design.md`

## File map

- `src/context/AppContext.tsx` — `reduceMotion` state + persist + `data-reduce-motion`
- `src/components/SettingsPopover.tsx` + `.css` — toggle UI
- `app/globals.css` — global reduce-motion rules + font CSS vars
- `app/layout.tsx` — `next/font`, early script for reduce-motion, drop Google stylesheet links
- `src/components/OverlayScrollbar.tsx` — stable measure / threshold

## Tasks

1. AppContext + Settings toggle + global CSS  
2. OverlayScrollbar jitter fix  
3. next/font in layout  
4. `npm run build` smoke
