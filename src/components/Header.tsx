'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SiGithub } from '@icons-pack/react-simple-icons'
import { BookOpen, Moon, Sun } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SettingsPopover } from './SettingsPopover'
import './Header.css'

const GITHUB_URL = 'https://github.com/zakapower'

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
            className="ctrl"
            onClick={toggleLang}
            aria-label={t('Switch to English', 'Переключить на русский')}
          >
            <span className="ctrl__label" aria-hidden="true">
              {lang === 'ru' ? 'EN' : 'RU'}
            </span>
          </button>
          <button
            type="button"
            className="ctrl"
            onClick={toggleTheme}
            aria-label={
              theme === 'light'
                ? t('Тёмная тема', 'Dark theme')
                : t('Светлая тема', 'Light theme')
            }
          >
            {theme === 'light' ? (
              <Moon className="ctrl__icon" strokeWidth={2} aria-hidden="true" />
            ) : (
              <Sun className="ctrl__icon" strokeWidth={2} aria-hidden="true" />
            )}
          </button>
          <SettingsPopover />
        </div>
      </div>
    </header>
  )
}
