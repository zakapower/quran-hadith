import type { Metadata } from 'next'
import { QuranListView } from '@/components/pages/QuranListView'
import { getSurahList } from '@/data/surahList'
import { getRequestLang } from '@/lib/request-lang'
import { clipDescription, pageAlternates } from '@/lib/site'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLang()
  const title = lang === 'ru' ? 'Коран – Tilāwah' : 'Qur’an – Tilāwah'
  const description =
    lang === 'ru'
      ? 'Список сур Корана. Чтение с арабским текстом и переводом.'
      : 'Qur’an surah list. Read Arabic text with translation.'

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
