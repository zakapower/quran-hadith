import type { Metadata } from 'next'
import { HadithListView } from '@/components/pages/HadithListView'
import { getRequestLang } from '@/lib/request-lang'
import { clipDescription, pageAlternates } from '@/lib/site'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLang()
  const title = lang === 'ru' ? 'Хадисы – Tilāwah' : 'Hadith – Tilāwah'
  const description =
    lang === 'ru'
      ? 'Сахих аль-Бухари и Сахих Муслим.'
      : 'Sahih al-Bukhari and Sahih Muslim.'

  return {
    title,
    description: clipDescription(description),
    alternates: pageAlternates('/hadith'),
    openGraph: { title, description: clipDescription(description) },
  }
}

export default function HadithPage() {
  return <HadithListView />
}
