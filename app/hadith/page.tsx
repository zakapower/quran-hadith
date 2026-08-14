import type { Metadata } from 'next'
import { HadithListView } from '@/components/pages/HadithListView'
import { clipDescription, pageAlternates, pageTitle } from '@/lib/site'

export const dynamic = 'force-static'

export async function generateMetadata(): Promise<Metadata> {
  const title = 'Хадисы / Hadith'
  const description =
    'Сахих аль-Бухари и Сахих Муслим. Sahih al-Bukhari and Sahih Muslim.'

  return {
    title,
    description: clipDescription(description),
    alternates: pageAlternates('/hadith'),
    openGraph: { title: pageTitle(title), description: clipDescription(description) },
  }
}

export default function HadithPage() {
  return <HadithListView />
}
