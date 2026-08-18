import type { Metadata } from 'next'
import { HadithListView } from '@/components/pages/HadithListView'
import { getRequestLang } from '@/lib/request-lang'
import { clipDescription, pageAlternates, pageTitle } from '@/lib/site'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLang()
  const tab = lang === 'ru' ? 'Хадисы' : 'Hadith'
  const title = pageTitle(tab)
  const description =
    lang === 'ru'
      ? 'Сахих аль-Бухари, Сахих Муслим и четыре сунана.'
      : 'Sahih al-Bukhari, Sahih Muslim, and the four Sunan.'

  return {
    title: tab,
    description: clipDescription(description),
    alternates: pageAlternates('/hadith'),
    openGraph: { title, description: clipDescription(description) },
  }
}

export default function HadithPage() {
  return <HadithListView />
}
