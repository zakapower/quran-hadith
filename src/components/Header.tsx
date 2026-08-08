'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Moon, Sun } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SettingsPopover } from './SettingsPopover'
import './Header.css'

export function Header() {
  const { lang, theme, toggleLang, toggleTheme, t } = useApp()
  const pathname = usePathname()

  function navClass(href: string, end = false) {
    const active = end
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`)
    return active ? 'active' : undefined
  }

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand" aria-label="Tilāwah home">
          <BookOpen className="brand__mark" aria-hidden="true" strokeWidth={2.25} />
          <span className="brand__name">Tilāwah</span>
        </Link>

        <nav className="site-nav" aria-label={t('Меню', 'Menu')}>
          <Link href="/" className={navClass('/', true)}>
            {t('Главная', 'Home')}
          </Link>
          <Link href="/quran" className={navClass('/quran')}>
            {t('Коран', 'Qur’an')}
          </Link>
          <Link href="/hadith" className={navClass('/hadith')}>
            {t('Хадисы', 'Hadith')}
          </Link>
        </nav>

        <div className="site-controls">
          <button
            type="button"
            className={`ctrl${lang === 'en' ? ' ctrl--lang-en' : ''}`}
            onClick={toggleLang}
            aria-label={t('Switch to English', 'Переключить на русский')}
          >
            <span className="ctrl__stack" aria-hidden="true">
              <span className="ctrl__face ctrl__face--en">EN</span>
              <span className="ctrl__face ctrl__face--ru">RU</span>
            </span>
          </button>
          <button
            type="button"
            className={`ctrl${theme === 'dark' ? ' ctrl--theme-dark' : ''}`}
            onClick={toggleTheme}
            aria-label={
              theme === 'light'
                ? t('Тёмная тема', 'Dark theme')
                : t('Светлая тема', 'Light theme')
            }
          >
            <span className="ctrl__stack" aria-hidden="true">
              <Moon className="ctrl__face ctrl__face--moon" strokeWidth={2} />
              <Sun className="ctrl__face ctrl__face--sun" strokeWidth={2} />
            </span>
          </button>
          <SettingsPopover />
        </div>
      </div>
    </header>
  )
}
