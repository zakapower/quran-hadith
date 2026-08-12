'use client'

import { useEffect, useId, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SiGithub } from '@icons-pack/react-simple-icons'
import { BookOpen, Bookmark, Menu, Moon, Sun, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SettingsPopover } from './SettingsPopover'
import './Header.css'

const GITHUB_URL = 'https://github.com/zakapower'

export function Header() {
  const { lang, theme, toggleLang, toggleTheme, t } = useApp()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()

  function navClass(href: string, end = false) {
    const active = end
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`)
    return active ? 'active' : undefined
  }

  const favoritesActive =
    pathname === '/favorites' || pathname.startsWith('/favorites/')

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.documentElement.classList.add('menu-open')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.documentElement.classList.remove('menu-open')
    }
  }, [menuOpen])

  const toolControls = (
    <>
      <Link
        href="/favorites"
        className={`ctrl${favoritesActive ? ' ctrl--active' : ''}`}
        aria-label={t('Избранное', 'Favorites')}
        title={t('Избранное', 'Favorites')}
        onClick={() => setMenuOpen(false)}
      >
        <Bookmark className="ctrl__icon" strokeWidth={2} aria-hidden="true" />
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
    </>
  )

  return (
    <header className={`site-header${menuOpen ? ' site-header--menu-open' : ''}`}>
      <div className="site-header__inner">
        <div className="site-header__bar">
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
            <Link href="/about" className={navClass('/about')}>
              {t('О проекте', 'About')}
            </Link>
          </nav>

          <div className="site-controls">
            <button
              type="button"
              className="ctrl site-controls__burger"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label={
                menuOpen
                  ? t('Закрыть меню', 'Close menu')
                  : t('Открыть меню', 'Open menu')
              }
            >
              {menuOpen ? (
                <X className="ctrl__icon" strokeWidth={2} aria-hidden="true" />
              ) : (
                <Menu className="ctrl__icon" strokeWidth={2} aria-hidden="true" />
              )}
            </button>

            <div className="site-controls__tools">{toolControls}</div>
          </div>

          {menuOpen && (
            <div
              className="site-menu"
              id={menuId}
              aria-label={t('Действия', 'Actions')}
            >
              <div className="site-menu__actions">
                <Link
                  href="/favorites"
                  className={`site-menu__action${favoritesActive ? ' is-active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <Bookmark
                    className="site-menu__action-icon"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span>{t('Избранное', 'Favorites')}</span>
                </Link>

                <button type="button" className="site-menu__action" onClick={toggleLang}>
                  <span className="site-menu__action-badge" aria-hidden="true">
                    {lang === 'ru' ? 'EN' : 'RU'}
                  </span>
                  <span>
                    {lang === 'ru'
                      ? t('English', 'English')
                      : t('Русский', 'Russian')}
                  </span>
                </button>

                <button type="button" className="site-menu__action" onClick={toggleTheme}>
                  {theme === 'light' ? (
                    <Moon
                      className="site-menu__action-icon"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  ) : (
                    <Sun
                      className="site-menu__action-icon"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  )}
                  <span>
                    {theme === 'light'
                      ? t('Тёмная тема', 'Dark theme')
                      : t('Светлая тема', 'Light theme')}
                  </span>
                </button>

                <a
                  className="site-menu__action"
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SiGithub
                    className="site-menu__action-icon"
                    color="currentColor"
                    size={18}
                    title=""
                    aria-hidden
                  />
                  <span>GitHub</span>
                </a>

                <SettingsPopover variant="menu" />
              </div>
            </div>
          )}
        </div>
      </div>

      {menuOpen && (
        <button
          type="button"
          className="site-menu__backdrop"
          aria-label={t('Закрыть меню', 'Close menu')}
          onClick={() => setMenuOpen(false)}
        />
      )}
    </header>
  )
}
