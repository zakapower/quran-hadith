import type { Metadata } from 'next'
import { FavoritesView } from '@/components/pages/FavoritesView'
import { getRequestLang } from '@/lib/request-lang'
import { clipDescription, pageAlternates, pageTitle } from '@/lib/site'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLang()
  const tab = lang === 'ru' ? 'Избранное' : 'Favorites'
  const title = pageTitle(tab)
  const description =
    lang === 'ru'
      ? 'Сохранённые аяты Корана и хадисы.'
      : 'Saved Qur’an ayahs and hadith.'

  return {
    title: tab,
    description: clipDescription(description),
    alternates: pageAlternates('/favorites'),
    openGraph: { title, description: clipDescription(description) },
  }
}

export default function FavoritesPage() {
  return <FavoritesView />
}
