import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SurahView } from '@/components/pages/SurahView'
import { fetchSurah } from '@/api/quran'
import { getRequestLang } from '@/lib/request-lang'
import { loadBothLangs, quranStaticParams } from '@/lib/ssg'
import { clipDescription, pageAlternates, pageTitle } from '@/lib/site'
import { surahTitleRu } from '@/data/surahNamesRu'
import { getSurahMeta } from '@/data/surahList'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return quranStaticParams()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ number: string }>
}): Promise<Metadata> {
  const { number } = await params
  const lang = await getRequestLang()
  const n = Number(number)
  const valid = Number.isFinite(n) && n >= 1 && n <= 114
  const meta = valid ? getSurahMeta(n) : null
  const tab = valid
    ? lang === 'ru'
      ? `${n}. ${surahTitleRu(n, meta?.englishName ?? '')}`
      : `${n}. ${meta?.englishName ?? n}`
    : lang === 'ru'
      ? 'Сура'
      : 'Surah'
  const title = pageTitle(tab)
  const description =
    lang === 'ru'
      ? 'Чтение суры Корана с арабским текстом и переводом.'
      : 'Read a Qur’an surah with Arabic text and translation.'

  return {
    title: tab,
    description: clipDescription(description),
    alternates: pageAlternates(`/quran/${number}`),
    openGraph: { title, description: clipDescription(description) },
  }
}

export default async function SurahPage({
  params,
}: {
  params: Promise<{ number: string }>
}) {
  const { number } = await params
  const n = Number(number)

  const initialByLang =
    Number.isFinite(n) && n >= 1 && n <= 114
      ? await loadBothLangs((lang) =>
          fetchSurah(n, lang).catch(() => null),
        )
      : {}

  return (
    <Suspense fallback={null}>
      <SurahView initialByLang={initialByLang} />
    </Suspense>
  )
}
