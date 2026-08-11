# Mobile Quran Player Mini-Bar + Sheet — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** На мобилке (≤720px) заменить сжатый десктоп-бар плеера на мини-бар + лёгкий bottom sheet с чтецом и prev/next.

**Architecture:** Всё в существующем `QuranPlayerBar` (+ CSS). Локальный `sheetOpen`; аудио-логика в `QuranAudioContext` не меняется. Desktop (≥721px) остаётся текущей однорядной сеткой.

**Tech Stack:** Next.js 15, React 19, TypeScript, Lucide (`ChevronUp`, `X`, `Play`, `Pause`, `SkipBack`, `SkipForward`, `Check`), CSS media `max-width: 720px`.

**Spec:** `docs/superpowers/specs/2026-08-11-mobile-quran-player-sheet-design.md`

## Global Constraints

- Брейкпоинт мобилки: `max-width: 720px` (как в приложении).
- `QuranAudioContext` не менять — только существующие экшены.
- Иконки только Lucide.
- Swipe-to-dismiss вне scope.
- Desktop-бар визуально без изменений.
- В репозитории нет test runner — проверки: `npx tsc --noEmit` + ручной чеклист / Playwright скриншоты на 390px.

---

## Карта файлов

| Файл | Роль |
|------|------|
| `src/components/QuranPlayerBar.tsx` | Мини-бар + sheet markup, `sheetOpen`, a11y |
| `src/components/QuranPlayerBar.css` | Mobile mini layout, sheet, backdrop; desktop intact |
| `src/components/pages/Reader.css` | При необходимости чуть больше `padding-bottom` под мини-бар |

---

### Task 1: Мобильный мини-бар (свёрнутый UI)

**Files:**
- Modify: `src/components/QuranPlayerBar.tsx`
- Modify: `src/components/QuranPlayerBar.css`

**Interfaces:**
- Consumes: `useQuranAudio()` — `visible`, `playing`, `loading`, `progress`, `surah`, `ayah`, `togglePause`, `close`
- Produces: markup с классами `quran-player__mini-*` / модификаторами; desktop `.quran-player__row` без визуальных регрессий

- [ ] **Step 1: Добавить состояние и ids для sheet (пока закрытый stub)**

В `QuranPlayerBar.tsx`:

```tsx
const [sheetOpen, setSheetOpen] = useState(false)
const sheetId = useId()
const sheetCloseRef = useRef<HTMLButtonElement>(null)

useEffect(() => {
  if (!visible) {
    setSheetOpen(false)
    setReciterOpen(false)
  }
}, [visible])
```

Импорт: добавить `ChevronUp` из `lucide-react` (оставить `ChevronDown` для desktop-reciter).

- [ ] **Step 2: Разметить две структуры — desktop row + mobile mini**

Сохранить текущий `.quran-player__row` как есть (для desktop).  
Добавить рядом мобильный блок (видимость через CSS):

```tsx
{/* Desktop row — existing markup unchanged */}
<div className="quran-player__row quran-player__row--desktop">
  {/* ... existing sides + transport + reciter ... */}
</div>

{/* Mobile mini */}
<div className="quran-player__mini">
  <button
    type="button"
    className="quran-player__ref quran-player__ref--open"
    onClick={() => setSheetOpen(true)}
    aria-expanded={sheetOpen}
    aria-controls={sheetId}
  >
    {surah != null && ayah != null ? `${surah}:${ayah}` : '—'}
  </button>

  <button
    type="button"
    className={`quran-player__btn quran-player__btn--main${
      playing ? ' quran-player__btn--playing' : ''
    }`}
    onClick={togglePause}
    aria-label={playing ? t('Пауза', 'Pause') : t('Слушать', 'Play')}
    disabled={loading}
  >
    {/* same icon-swap as desktop */}
  </button>

  <div className="quran-player__mini-actions">
    <button
      type="button"
      className="quran-player__btn"
      onClick={() => setSheetOpen(true)}
      aria-expanded={sheetOpen}
      aria-controls={sheetId}
      aria-label={t('Открыть плеер', 'Open player')}
    >
      <ChevronUp strokeWidth={2} aria-hidden="true" />
    </button>
    <button
      type="button"
      className="quran-player__btn"
      onClick={close}
      aria-label={t('Закрыть плеер', 'Close player')}
    >
      <X strokeWidth={2} aria-hidden="true" />
    </button>
  </div>
</div>
```

Progress bar сверху оставить общим для обоих layouts.

- [ ] **Step 3: CSS — показать mini только на мобилке, desktop row только на ≥721px**

В `QuranPlayerBar.css`:

```css
.quran-player__mini {
  display: none;
}

@media (max-width: 720px) {
  .quran-player__row--desktop {
    display: none;
  }

  .quran-player__mini {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 0.55rem;
    max-width: 52rem;
    margin: 0 auto;
    padding-left: max(0.65rem, env(safe-area-inset-left, 0px));
    padding-right: max(0.65rem, env(safe-area-inset-right, 0px));
  }

  .quran-player__mini .quran-player__btn--main {
    width: 3rem;
    height: 3rem;
  }

  .quran-player__mini-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    justify-self: end;
  }

  .quran-player__ref--open {
    appearance: none;
    border: none;
    background: transparent;
    padding: 0.35rem 0.15rem;
    min-height: 2.75rem;
    cursor: pointer;
    text-align: left;
    font: inherit;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }

  /* Hide old mobile tweaks that assumed single-row desktop layout */
  .quran-player__reciter,
  .quran-player__reciter-btn {
    max-width: none; /* reset if leftover from previous mobile rule */
  }
}
```

Удалить/заменить устаревшие mobile-правила, которые жали reciter до `8.8rem` в одном ряду с prev/next (они больше не нужны для свёрнутого бара).

- [ ] **Step 4: Проверка типов**

Run: `npx tsc --noEmit`  
Expected: exit 0

- [ ] **Step 5: Ручная проверка мини-бара**

1. `npm run dev`, открыть `/quran/1` на ширине ~390px.
2. Play → виден мини-бар: `1:1` · крупный play · chevron · ✕.
3. Нет обрезанного имени чтеца в баре.
4. На ширине ≥800px — прежний однорядный бар.

- [ ] **Step 6: Commit**

```bash
git add src/components/QuranPlayerBar.tsx src/components/QuranPlayerBar.css
git commit -m "Add mobile mini layout for Quran player bar."
```

---

### Task 2: Bottom sheet — открытие/закрытие + транспорт

**Files:**
- Modify: `src/components/QuranPlayerBar.tsx`
- Modify: `src/components/QuranPlayerBar.css`

**Interfaces:**
- Consumes: `togglePause`, `prevAyah`, `nextAyah`, `close`, `loading`, `playing`, `error`, `retry`, `surah`, `ayah`
- Produces: `sheetOpen` dialog; закрытие sheet не вызывает `close()`

- [ ] **Step 1: Рендер backdrop + sheet**

После `.quran-player__mini` (внутри корня или sibling — sheet лучше **вне** `.quran-player` fixed-бара, чтобы занимать половину экрана). Практичный вариант: fragment/`<>` обёртка:

```tsx
if (!visible) return null

return (
  <>
    <div className={`quran-player${loading ? ' quran-player--loading' : ''}${sheetOpen ? ' quran-player--sheet-open' : ''}`} ...>
      {/* progress + desktop row + mini */}
    </div>

    {sheetOpen && (
      <div
        className="quran-player-sheet-root"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation()
            setSheetOpen(false)
          }
        }}
      >
        <button
          type="button"
          className="quran-player-sheet__backdrop"
          aria-label={t('Свернуть плеер', 'Collapse player')}
          onClick={() => setSheetOpen(false)}
        />
        <div
          id={sheetId}
          className="quran-player-sheet"
          role="dialog"
          aria-modal="true"
          aria-label={t('Плеер', 'Player')}
        >
          <div className="quran-player-sheet__handle" aria-hidden="true" />
          <div className="quran-player-sheet__head">
            <h2 className="quran-player-sheet__title">
              {t('Плеер', 'Player')}
            </h2>
            <button
              ref={sheetCloseRef}
              type="button"
              className="quran-player__btn"
              onClick={() => setSheetOpen(false)}
              aria-label={t('Свернуть плеер', 'Collapse player')}
            >
              <X strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <p className="quran-player-sheet__ref" aria-live="polite">
            {surah != null && ayah != null ? `${surah}:${ayah}` : '—'}
          </p>

          <div className="quran-player-sheet__transport">
            <button type="button" className="quran-player__btn" onClick={prevAyah} disabled={loading} aria-label={t('Предыдущий аят', 'Previous ayah')}>
              <SkipBack strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`quran-player__btn quran-player__btn--main${playing ? ' quran-player__btn--playing' : ''}`}
              onClick={togglePause}
              disabled={loading}
              aria-label={playing ? t('Пауза', 'Pause') : t('Слушать', 'Play')}
            >
              {/* icon-swap */}
            </button>
            <button type="button" className="quran-player__btn" onClick={nextAyah} disabled={loading} aria-label={t('Следующий аят', 'Next ayah')}>
              <SkipForward strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          {/* Task 3: reciters + error */}
        </div>
      </div>
    )}
  </>
)
```

- [ ] **Step 2: Focus + body scroll lock при открытии**

```tsx
useEffect(() => {
  if (!sheetOpen) return
  const prev = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  sheetCloseRef.current?.focus()
  return () => {
    document.body.style.overflow = prev
  }
}, [sheetOpen])
```

Escape: обработчик на `document` **или** на root sheet (как выше). Не конфликтовать с desktop `reciterOpen` Escape — если sheet открыт, закрывать sheet первым:

```tsx
useEffect(() => {
  if (!sheetOpen) return
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setSheetOpen(false)
  }
  document.addEventListener('keydown', onKey)
  return () => document.removeEventListener('keydown', onKey)
}, [sheetOpen])
```

- [ ] **Step 3: CSS sheet**

```css
.quran-player-sheet-root {
  display: none;
}

@media (max-width: 720px) {
  .quran-player-sheet-root {
    display: contents; /* or block; children are fixed */
  }

  .quran-player-sheet__backdrop {
    position: fixed;
    inset: 0;
    z-index: 80;
    border: none;
    padding: 0;
    margin: 0;
    background: color-mix(in srgb, var(--ink) 45%, transparent);
    cursor: pointer;
  }

  .quran-player-sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 81;
    max-height: min(70vh, 32rem);
    overflow: auto;
    padding: 0.65rem 1rem calc(1rem + env(safe-area-inset-bottom, 0px));
    border-radius: 1rem 1rem 0 0;
    border: 1px solid var(--line);
    border-bottom: none;
    background: var(--surface);
    box-shadow: 0 -12px 40px color-mix(in srgb, var(--ink) 18%, transparent);
    animation: quran-player-sheet-in 0.22s ease both;
  }

  .quran-player-sheet__handle {
    width: 2.5rem;
    height: 0.28rem;
    margin: 0.15rem auto 0.75rem;
    border-radius: 999px;
    background: var(--line);
  }

  .quran-player-sheet__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .quran-player-sheet__title {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.15rem;
    letter-spacing: -0.02em;
  }

  .quran-player-sheet__ref {
    margin: 0 0 1rem;
    font-size: 1.35rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    text-align: center;
  }

  .quran-player-sheet__transport {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  .quran-player-sheet__transport .quran-player__btn {
    width: 2.75rem;
    height: 2.75rem;
  }

  .quran-player-sheet__transport .quran-player__btn--main {
    width: 3.25rem;
    height: 3.25rem;
  }
}

@keyframes quran-player-sheet-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .quran-player-sheet {
    animation: none;
  }
}
```

На desktop (`min-width: 721px`) sheet **не** рендерить или CSS `display: none` на `.quran-player-sheet-root` — предпочтительно: рендерить sheet только когда `sheetOpen` **и** можно оставить CSS-guard; проще не открывать на desktop (кнопок expand нет). Desktop не имеет mini → `sheetOpen` остаётся false.

- [ ] **Step 4: Проверка**

Run: `npx tsc --noEmit`  
Expected: exit 0

Ручной чеклист (390px):
1. Chevron / ref → sheet открывается, аудио **продолжается**.
2. Backdrop / Escape / ✕ в sheet → sheet закрыт, мини-бар на месте, аудио играет.
3. ✕ в мини-баре → плеер скрыт, аудио на паузе.
4. Prev/Next в sheet меняют аят.

- [ ] **Step 5: Commit**

```bash
git add src/components/QuranPlayerBar.tsx src/components/QuranPlayerBar.css
git commit -m "Add mobile bottom sheet for Quran player controls."
```

---

### Task 3: Чтецы + ошибка в sheet; подчистить desktop-меню на мобилке

**Files:**
- Modify: `src/components/QuranPlayerBar.tsx`
- Modify: `src/components/QuranPlayerBar.css`

**Interfaces:**
- Consumes: `RECITERS`, `reciterId`, `setReciter`, `lang`, `error`, `retry`
- Produces: полный список чтецов в sheet без ellipsis

- [ ] **Step 1: Список чтецов внутри sheet**

После транспорта:

```tsx
<div className="quran-player-sheet__reciters" role="listbox" aria-label={t('Чтецы', 'Reciters')}>
  <p className="quran-player-sheet__reciters-title">{t('Чтец', 'Reciter')}</p>
  {RECITERS.map((r) => {
    const selected = r.id === reciterId
    return (
      <button
        key={r.id}
        type="button"
        role="option"
        aria-selected={selected}
        className={`quran-player__reciter-option${selected ? ' is-selected' : ''}`}
        onClick={() => setReciter(r.id)}
      >
        <span>{lang === 'ru' ? r.nameRu : r.nameEn}</span>
        {selected && (
          <Check className="quran-player__reciter-check" strokeWidth={2.25} aria-hidden="true" />
        )}
      </button>
    )
  })}
</div>

{error && (
  <p className="quran-player__error quran-player-sheet__error">
    {error === 'play-failed'
      ? t('Нажмите Play ещё раз', 'Tap Play again')
      : t('Не удалось загрузить аудио', 'Could not load audio')}
    {error !== 'play-failed' && (
      <button type="button" onClick={retry}>
        {t('Повторить', 'Retry')}
      </button>
    )}
  </p>
)}
```

На мобилке ошибку в мини-баре можно не дублировать (или оставить тонкую строку под mini) — по спеке ошибка **в sheet**. Если ошибка при свёрнутом баре: достаточно показывать мини-строку под mini **или** автооткрывать sheet — YAGNI: оставить компактный `quran-player__error` под mini (как сейчас под row), плюс дубль в sheet.

- [ ] **Step 2: Стили списка в sheet**

```css
@media (max-width: 720px) {
  .quran-player-sheet__reciters {
    display: grid;
    gap: 0.4rem;
  }

  .quran-player-sheet__reciters-title {
    margin: 0 0.15rem 0.25rem;
    font-family: var(--font-display);
    font-size: 0.92rem;
  }

  .quran-player-sheet .quran-player__reciter-option {
    min-height: 2.75rem;
  }
}
```

Имена **без** `text-overflow: ellipsis` на опциях sheet.

- [ ] **Step 3: Проверка**

1. Открыть sheet → оба чтеца с полными именами.
2. Сменить чтеца → аудио перезагружается как раньше (существующее поведение `setReciter`).
3. Desktop dropdown чтеца работает как до изменений.

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/QuranPlayerBar.tsx src/components/QuranPlayerBar.css
git commit -m "Move reciter picker into mobile player sheet."
```

---

### Task 4: Отступ ридера + финальная мобильная проверка

**Files:**
- Modify: `src/components/pages/Reader.css` (только если мини-бар выше прежнего)
- Optional: временный скриншот-скрипт — не коммитить

**Interfaces:**
- Consumes: текущие `--` отступы ридера
- Produces: последний аят полностью виден над мини-баром

- [ ] **Step 1: Сверить высоту**

На 390px с открытым плеером проскроллить к последнему аяту. Если перекрывается — увеличить:

```css
/* Reader.css — только mobile при необходимости */
@media (max-width: 720px) {
  .reader {
    padding-bottom: calc(7.5rem + env(safe-area-inset-bottom, 0px));
  }

  .ayah {
    scroll-margin-bottom: calc(6.5rem + env(safe-area-inset-bottom, 0px));
  }
}
```

Если текущего `6.5rem` хватает — **не менять** файл.

- [ ] **Step 2: Финальный чеклист (критерии спеки)**

| Критерий | Ок? |
|----------|-----|
| 390px: нет horizontal overflow | |
| Свёрнутый бар без обрезанного чтеца | |
| Sheet open/close без стопа аудио | |
| ✕ мини-бара = hide + pause | |
| Desktop бар без регрессий | |
| Prev/Next доступны в sheet | |

- [ ] **Step 3: Commit (если меняли Reader.css)**

```bash
git add src/components/pages/Reader.css
git commit -m "Adjust reader bottom padding for mobile mini player."
```

Если Reader не трогали — этот commit пропустить.

---

## Self-review (plan vs spec)

| Spec requirement | Task |
|------------------|------|
| Мини-бар: ref · play · expand · ✕ | Task 1 |
| Prev/Next только в sheet | Task 2 |
| Sheet ~половина + backdrop | Task 2 |
| Закрытие sheet ≠ stop audio | Task 2 |
| ✕ mini = close() | Task 1 |
| Чтец полный в sheet | Task 3 |
| Escape / backdrop | Task 2 |
| Desktop без изменений | Task 1–3 (CSS guards) |
| Нет swipe | — (не реализуем) |
| `QuranAudioContext` не менять | — (не в карте файлов) |
| Reader padding при необходимости | Task 4 |
| A11y dialog / aria-expanded | Task 1–2 |

Нет TBD/placeholder steps. Имена классов согласованы: `quran-player__mini`, `quran-player-sheet`, `sheetOpen`.
