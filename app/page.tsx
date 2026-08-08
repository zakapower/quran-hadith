import type { Metadata } from 'next'
import { HomeView } from '@/components/pages/HomeView'
import { getRequestLang } from '@/lib/request-lang'
import { clipDescription, pageAlternates, pageAlternatesMetadataBase } from '@/lib/site'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLang()
  const title =
    lang === 'ru'
      ? 'Tilāwah – Коран и хадисы'
      : 'Tilāwah – Qur’an and Hadith'
  const description =
    lang === 'ru'
      ? 'Tilāwah – минималистичное чтение Корана и хадисов. Русский / English.'
      : 'Tilāwah – minimal Qur’an and Hadith reading. Russian / English.'

  return {
    metadataBase: pageAlternatesMetadataBase('/'),
    title,
    description: clipDescription(description),
    alternates: pageAlternates('/'),
    openGraph: { title, description: clipDescription(description) },
  }
}

export default function HomePage() {
  return <HomeView />
}
