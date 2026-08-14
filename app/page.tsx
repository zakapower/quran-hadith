import type { Metadata } from 'next'
import { HomeView } from '@/components/pages/HomeView'
import { getSurahList } from '@/data/surahList'
import { getRequestLang } from '@/lib/request-lang'
import {
  clipDescription,
  pageAlternates,
  pageAlternatesMetadataBase,
  SITE_NAME,
} from '@/lib/site'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLang()
  const title = SITE_NAME
  const description =
    lang === 'ru'
      ? 'Tilāwah – минималистичное чтение Корана и хадисов.'
      : 'Tilāwah – minimal Qur’an and Hadith reading.'

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
