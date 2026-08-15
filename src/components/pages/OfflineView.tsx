import Link from 'next/link'
import { WifiOff } from 'lucide-react'
import type { Lang } from '@/lib/lang'
import './Offline.css'

export function OfflineView({ lang }: { lang: Lang }) {
  const ru = lang === 'ru'

  return (
    <div className="offline">
      <div className="offline-empty">
        <WifiOff className="offline-empty__icon" strokeWidth={2} aria-hidden />
        <h1>{ru ? 'Нет сети' : 'Offline'}</h1>
        <p className="offline-empty__lead">
          {ru
            ? 'Эта страница ещё не сохранена для офлайна. Откройте раздел, который уже посещали.'
            : 'This page is not available offline yet. Open a section you have already visited.'}
        </p>
        <nav className="offline-empty__actions" aria-label={ru ? 'Разделы' : 'Sections'}>
          <Link className="offline-empty__btn" href="/">
            {ru ? 'Главная' : 'Home'}
          </Link>
          <Link className="offline-empty__btn offline-empty__btn--ghost" href="/quran">
            {ru ? 'Коран' : 'Qur’an'}
          </Link>
          <Link className="offline-empty__btn offline-empty__btn--ghost" href="/hadith">
            {ru ? 'Хадисы' : 'Hadith'}
          </Link>
          <Link className="offline-empty__btn offline-empty__btn--ghost" href="/favorites">
            {ru ? 'Избранное' : 'Favorites'}
          </Link>
        </nav>
      </div>
    </div>
  )
}
