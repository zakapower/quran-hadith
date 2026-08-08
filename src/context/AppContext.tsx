import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type Lang = 'ru' | 'en'
export type Theme = 'light' | 'dark'

interface AppState {
  lang: Lang
  theme: Theme
  setLang: (lang: Lang) => void
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() =>
    readStored<Lang>('qh-lang', 'ru'),
  )
  const [theme, setTheme] = useState<Theme>(() =>
    readStored<Theme>('qh-theme', 'light'),
  )

  useEffect(() => {
    document.documentElement.lang = lang
    localStorage.setItem('qh-lang', lang)
  }, [lang])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
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

  const value: AppState = {
    lang,
    theme,
    setLang: setLangState,
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
