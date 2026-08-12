import type { Metadata } from 'next'
import { FavoritesView } from '@/components/pages/FavoritesView'
import { clipDescription, pageAlternates } from '@/lib/site'

export const dynamic = 'force-static'

export async function generateMetadata(): Promise<Metadata> {
  const title = 'Избранное / Favorites – Tilāwah'
  const description =
    'Сохранённые аяты Корана и хадисы. Saved Qur’an ayahs and hadith.'

  return {
    title,
    description: clipDescription(description),
    alternates: pageAlternates('/favorites'),
    openGraph: { title, description: clipDescription(description) },
  }
}

export default function FavoritesPage() {
  return <FavoritesView />
}
