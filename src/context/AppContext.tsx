'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import type { Lang } from '@/data/types'
import { LANG_COOKIE } from '@/lib/lang'

export type Theme = 'light' | 'dark'

const FONT_AR_KEY = 'qh-font-ar'
const FONT_TR_KEY = 'qh-font-tr'
export const FONT_SCALE_MIN = 0.7
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

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem('qh-theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* ignore */
  }
  return 'light'
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

function writeLangCookie(lang: Lang) {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`
}

export function AppProvider({
  children,
  initialLang,
}: {
  children: ReactNode
  initialLang: Lang
}) {
  const router = useRouter()
  const [lang, setLangState] = useState<Lang>(initialLang)
  const [theme, setTheme] = useState<Theme>('light')
  const [fontAr, setFontArState] = useState(FONT_SCALE_DEFAULT)
  const [fontTr, setFontTrState] = useState(FONT_SCALE_DEFAULT)

  useEffect(() => {
    setTheme(readStoredTheme())
    setFontArState(readStoredScale(FONT_AR_KEY))
    setFontTrState(readStoredScale(FONT_TR_KEY))
  }, [])

  useEffect(() => {
    setLangState(initialLang)
  }, [initialLang])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
    try {
      localStorage.setItem('qh-theme', theme)
    } catch {
      /* ignore */
    }
    const icon = document.getElementById('site-favicon') as HTMLLinkElement | null
    if (icon) {
      icon.href =
        theme === 'dark' ? '/favicon-dark.svg?v=1' : '/favicon-light.svg?v=1'
    }
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

  const value = useMemo<AppState>(
    () => ({
      lang,
      theme,
      fontAr,
      fontTr,
      setLang: (next) => {
        writeLangCookie(next)
        setLangState(next)
        router.refresh()
      },
      setFontAr: (n) => setFontArState(clampScale(n)),
      setFontTr: (n) => setFontTrState(clampScale(n)),
      resetFonts: () => {
        setFontArState(FONT_SCALE_DEFAULT)
        setFontTrState(FONT_SCALE_DEFAULT)
      },
      toggleLang: () => {
        const next: Lang = lang === 'ru' ? 'en' : 'ru'
        writeLangCookie(next)
        setLangState(next)
        router.refresh()
      },
      toggleTheme: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
      t: (ru, en) => (lang === 'ru' ? ru : en),
    }),
    [lang, theme, fontAr, fontTr, router],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
