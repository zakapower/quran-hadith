import { Link, NavLink } from 'react-router-dom'
import { BookOpen, Moon, Sun } from 'lucide-react'
import { useApp } from '../context/AppContext'
import './Header.css'

export function Header() {
  const { lang, theme, toggleLang, toggleTheme, t } = useApp()

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="brand" aria-label="Home">
          <BookOpen className="brand__mark" aria-hidden="true" strokeWidth={2.25} />
          <span className="brand__name">Tilāwah</span>
        </Link>

        <nav className="site-nav" aria-label={t('Меню', 'Menu')}>
          <NavLink to="/" end>
            {t('Главная', 'Home')}
          </NavLink>
          <NavLink to="/quran">{t('Коран', 'Qur’an')}</NavLink>
          <NavLink to="/hadith">{t('Хадисы', 'Hadith')}</NavLink>
        </nav>

        <div className="site-controls">
          <button
            type="button"
            className="ctrl"
            onClick={toggleLang}
            aria-label={t('Switch to English', 'Переключить на русский')}
          >
            {lang === 'ru' ? 'EN' : 'RU'}
          </button>
          <button
            type="button"
            className="ctrl ctrl--icon"
            onClick={toggleTheme}
            aria-label={
              theme === 'light'
                ? t('Тёмная тема', 'Dark theme')
                : t('Светлая тема', 'Light theme')
            }
          >
            {theme === 'light' ? (
              <Moon className="ctrl__icon" aria-hidden="true" strokeWidth={2} />
            ) : (
              <Sun className="ctrl__icon" aria-hidden="true" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
