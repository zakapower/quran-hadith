import type { Metadata } from 'next'
import { HomeView } from '@/components/pages/HomeView'
import { getSurahList } from '@/data/surahList'
import { clipDescription, pageAlternates, pageAlternatesMetadataBase, pageTitle } from '@/lib/site'

export const dynamic = 'force-static'

export async function generateMetadata(): Promise<Metadata> {
  const title = pageTitle()
  const description =
    'Tilāwah – минималистичное чтение Корана и хадисов. Minimal Qur’an and Hadith reading.'

  return {
    metadataBase: pageAlternatesMetadataBase('/'),
    title: { absolute: title },
    description: clipDescription(description),
    alternates: pageAlternates('/'),
    openGraph: { title, description: clipDescription(description) },
  }
}

export default function HomePage() {
  return <HomeView surahs={getSurahList()} />
}
