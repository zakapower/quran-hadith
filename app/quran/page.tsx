import type { Metadata } from 'next'
import { QuranListView } from '@/components/pages/QuranListView'
import { getSurahList } from '@/data/surahList'
import { clipDescription, pageAlternates, pageTitle } from '@/lib/site'

export const dynamic = 'force-static'

export async function generateMetadata(): Promise<Metadata> {
  const title = 'Коран / Qur’an'
  const description =
    'Список сур Корана. Чтение с арабским текстом и переводом. Qur’an surah list.'

  return {
    title,
    description: clipDescription(description),
    alternates: pageAlternates('/quran'),
    openGraph: { title: pageTitle(title), description: clipDescription(description) },
  }
}

export default function QuranPage() {
  return <QuranListView surahs={getSurahList()} />
}
