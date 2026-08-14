import type { Metadata } from 'next'
import { QuranListView } from '@/components/pages/QuranListView'
import { getSurahList } from '@/data/surahList'
import { getRequestLang } from '@/lib/request-lang'
import { clipDescription, pageAlternates, pageTitle } from '@/lib/site'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLang()
  const tab = lang === 'ru' ? 'Коран' : 'Qur’an'
  const title = pageTitle(tab)
  const description =
    lang === 'ru'
      ? 'Список сур Корана. Чтение с арабским текстом и переводом.'
      : 'Qur’an surah list. Read with Arabic text and translation.'

  return {
    title: tab,
    description: clipDescription(description),
    alternates: pageAlternates('/quran'),
    openGraph: { title, description: clipDescription(description) },
  }
}

export default function QuranPage() {
  return <QuranListView surahs={getSurahList()} />
}
