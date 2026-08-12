# Hadith side-by-side text — design

Date: 2026-08-12  
Status: implemented

## Goal

On hadith reader cards, show **translation and Arabic as two horizontal columns** (not stacked), so the bilingual text is easier to scan.

## Decisions

| Topic | Choice |
|-------|--------|
| Desktop layout | Two equal columns inside the existing `.ayah` card |
| Order | **Left:** translation (`h.text`). **Right:** Arabic (`h.arabic`, `dir="rtl"`) |
| Visual style | No nested cards — shared card chrome as today; thin vertical divider between columns |
| Header | Number + favorite/copy stay on top row (full width) |
| Missing side | If only one of `text` / `arabic` exists, that column spans full width (no empty half) |
| Mobile | Stack vertically: translation first, then Arabic (same order as LTR reading) |
| Breakpoint | Align with existing reader mobile breakpoint (~720px or current `@media` in `Reader.css`) |
| Scope | Hadith section reader only (`HadithSectionView`). Qur’an ayahs stay stacked. Favorites list stays snippet/link list (no dual columns). |

## Markup sketch

```html
<article class="ayah">
  <div class="ayah__top">…</div>
  <div class="ayah__bilingual">
    <p class="ayah__tr">…</p>
    <p class="ayah__ar" dir="rtl" lang="ar">…</p>
  </div>
</article>
```

CSS: `.ayah__bilingual` is a 2-column grid with a divider (`border` or `gap` + pseudo). On small screens → `grid-template-columns: 1fr`.

## Out of scope

- Changing hadith API / data shape
- Side-by-side layout for Qur’an
- Labels (“Перевод” / “العربية”) above columns
- Surface/panel “card-in-card” treatment

## Success

- Desktop: translation left, Arabic right, clear separator, readable length
- Mobile: translation above Arabic, no cramped half-width columns
- Copy / favorite / highlight / scroll memory unchanged
