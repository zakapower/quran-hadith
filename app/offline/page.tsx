import type { Metadata } from 'next'
import Link from 'next/link'
import { getRequestLang } from '@/lib/request-lang'
import { pageTitle } from '@/lib/site'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLang()
  const tab = lang === 'ru' ? 'Нет сети' : 'Offline'
  return {
    title: tab,
    robots: { index: false, follow: false },
    openGraph: { title: pageTitle(tab) },
  }
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
