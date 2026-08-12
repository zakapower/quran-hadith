import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Нет сети / Offline',
  robots: { index: false, follow: false },
}

export default function OfflinePage() {
  return (
    <div className="reader">
      <h1>Нет сети / Offline</h1>
      <p>
        Эта страница ещё не сохранена для офлайна. / This page is not available
        offline yet.
      </p>
      <p>
        <Link href="/">Главная / Home</Link>
        {' · '}
        <Link href="/quran">Коран / Qur’an</Link>
        {' · '}
        <Link href="/hadith">Хадисы / Hadith</Link>
        {' · '}
        <Link href="/favorites">Избранное / Favorites</Link>
      </p>
    </div>
  )
}
