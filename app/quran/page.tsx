import type { Metadata } from 'next'
import { QuranListView } from '@/components/pages/QuranListView'
import { getSurahList } from '@/data/surahList'
import { clipDescription, pageAlternates } from '@/lib/site'

export const dynamic = 'force-static'

export async function generateMetadata(): Promise<Metadata> {
  const title = 'Коран / Qur’an – Tilāwah'
  const description =
    'Список сур Корана. Чтение с арабским текстом и переводом. Qur’an surah list.'

  return {
    title,
    description: clipDescription(description),
    alternates: pageAlternates('/quran'),
    openGraph: { title, description: clipDescription(description) },
  }
}

export default function QuranPage() {
  return <QuranListView surahs={getSurahList()} />
}
