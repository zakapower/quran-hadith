import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type Lang = 'ru' | 'en'
export type Theme = 'light' | 'dark'

const FONT_AR_KEY = 'qh-font-ar'
const FONT_TR_KEY = 'qh-font-tr'
export const FONT_SCALE_MIN = 0.85
export const FONT_SCALE_MAX = 1.4
export const FONT_SCALE_STEP = 0.05
export const FONT_SCALE_DEFAULT = 1

interface AppState {
  lang: Lang
  theme: Theme
  fontAr: number
  fontTr: number
  setLang: (lang: Lang) => void
  setFontAr: (n: number) => void
  setFontTr: (n: number) => void
  resetFonts: () => void
  toggleLang: () => void
  toggleTheme: () => void
  t: (ru: string, en: string) => string
}

const AppContext = createContext<AppState | null>(null)

function readStored<T extends string>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return (v as T) || fallback
  } catch {
    return fallback
  }
}

function readStoredScale(key: string): number {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return FONT_SCALE_DEFAULT
    const n = Number(raw)
    if (!Number.isFinite(n)) return FONT_SCALE_DEFAULT
    return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, n))
  } catch {
    return FONT_SCALE_DEFAULT
  }
}

function clampScale(n: number) {
  const stepped = Math.round(n / FONT_SCALE_STEP) * FONT_SCALE_STEP
  return Math.min(
    FONT_SCALE_MAX,
    Math.max(FONT_SCALE_MIN, Number(stepped.toFixed(2))),
  )
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() =>
    readStored<Lang>('qh-lang', 'ru'),
  )
  const [theme, setTheme] = useState<Theme>(() =>
    readStored<Theme>('qh-theme', 'light'),
  )
  const [fontAr, setFontArState] = useState(() => readStoredScale(FONT_AR_KEY))
  const [fontTr, setFontTrState] = useState(() => readStoredScale(FONT_TR_KEY))

  useEffect(() => {
    document.documentElement.lang = lang
    localStorage.setItem('qh-lang', lang)
  }, [lang])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
    localStorage.setItem('qh-theme', theme)

    const href =
      theme === 'dark'
        ? '/favicon-dark.svg?v=1'
        : '/favicon-light.svg?v=1'

    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      link.type = 'image/svg+xml'
      document.head.appendChild(link)
    }
    link.href = href
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--reader-ar-scale', String(fontAr))
    root.style.setProperty('--reader-tr-scale', String(fontTr))
    try {
      localStorage.setItem(FONT_AR_KEY, String(fontAr))
      localStorage.setItem(FONT_TR_KEY, String(fontTr))
    } catch {
      /* ignore */
    }
  }, [fontAr, fontTr])

  const value: AppState = {
    lang,
    theme,
    fontAr,
    fontTr,
    setLang: setLangState,
    setFontAr: (n) => setFontArState(clampScale(n)),
    setFontTr: (n) => setFontTrState(clampScale(n)),
    resetFonts: () => {
      setFontArState(FONT_SCALE_DEFAULT)
      setFontTrState(FONT_SCALE_DEFAULT)
    },
    toggleLang: () => setLangState((l) => (l === 'ru' ? 'en' : 'ru')),
    toggleTheme: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
    t: (ru, en) => (lang === 'ru' ? ru : en),
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp outside AppProvider')
  return ctx
}
