'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SiGithub } from '@icons-pack/react-simple-icons'
import { BookOpen, Bookmark, Moon, Sun } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SettingsPopover } from './SettingsPopover'
import './Header.css'

const GITHUB_URL = 'https://github.com/zakapower'

export function Header() {
  const { lang, theme, themeReady, toggleLang, toggleTheme, t } = useApp()
  const pathname = usePathname()

  function navClass(href: string, end = false) {
    const active = end
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`)
    return active ? 'active' : undefined
  }

  const favoritesActive =
    pathname === '/favorites' || pathname.startsWith('/favorites/')

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="site-header__bar">
          <Link href="/" className="brand" aria-label="Tilāwah home">
            <BookOpen className="brand__mark" strokeWidth={2.25} aria-hidden />
            <span className="brand__name">Tilāwah</span>
          </Link>

          <nav className="site-nav" aria-label={t('Меню', 'Menu')} spellCheck={false}>
            <Link href="/" className={navClass('/', true)}>
              {t('Главная', 'Home')}
            </Link>
            <Link href="/quran" className={navClass('/quran')}>
              {t('Коран', 'Qur’an')}
            </Link>
            <Link href="/hadith" className={navClass('/hadith')}>
              {t('Хадисы', 'Hadith')}
            </Link>
            <Link href="/about" className={navClass('/about')}>
              {t('О проекте', 'About')}
            </Link>
          </nav>

          <div className="site-controls">
            <Link
              href="/favorites"
              className={`ctrl${favoritesActive ? ' ctrl--active' : ''}`}
              aria-label={t('Избранное', 'Favorites')}
              title={t('Избранное', 'Favorites')}
            >
              <Bookmark className="ctrl__icon" strokeWidth={2} aria-hidden />
            </Link>

            <a
              className="ctrl"
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('GitHub', 'GitHub')}
            >
              <SiGithub
                className="ctrl__icon"
                color="currentColor"
                size={18}
                title=""
                aria-hidden
              />
            </a>
            <button
              type="button"
              className={`ctrl${lang === 'en' ? ' ctrl--lang-en' : ''}`}
              onClick={toggleLang}
              aria-label={t('Switch to English', 'Переключить на русский')}
            >
              <span className="ctrl__stack" aria-hidden>
                <span className="ctrl__face ctrl__face--en">EN</span>
                <span className="ctrl__face ctrl__face--ru">RU</span>
              </span>
            </button>
            <button
              type="button"
              className={`ctrl${theme === 'dark' ? ' ctrl--theme-dark' : ''}${themeReady ? '' : ' ctrl--theme-boot'}`}
              onClick={toggleTheme}
              aria-label={
                theme === 'light'
                  ? t('Тёмная тема', 'Dark theme')
                  : t('Светлая тема', 'Light theme')
              }
            >
              <span className="ctrl__stack" aria-hidden>
                <Moon className="ctrl__face ctrl__face--moon" strokeWidth={2} />
                <Sun className="ctrl__face ctrl__face--sun" strokeWidth={2} />
              </span>
            </button>
            <SettingsPopover />
          </div>
        </div>
      </div>
    </header>
  )
}
