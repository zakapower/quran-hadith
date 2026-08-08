import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SurahView } from '@/components/pages/SurahView'
import { getRequestLang } from '@/lib/request-lang'
import { clipDescription, pageAlternates } from '@/lib/site'
import { surahTitleRu } from '@/data/surahNamesRu'

export function generateStaticParams() {
  return Array.from({ length: 114 }, (_, i) => ({ number: String(i + 1) }))
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
  const title = valid
    ? lang === 'ru'
      ? `${n}. ${surahTitleRu(n, '')} – Tilāwah`
      : `Surah ${n} – Tilāwah`
    : lang === 'ru'
      ? 'Сура не найдена – Tilāwah'
      : 'Surah not found – Tilāwah'
  const description =
    lang === 'ru'
      ? 'Чтение суры Корана с арабским текстом и переводом.'
      : 'Read a Qur’an surah with Arabic text and translation.'

  return {
    title,
    description: clipDescription(description),
    alternates: pageAlternates(`/quran/${number}`),
    openGraph: { title, description: clipDescription(description) },
  }
}

export default function SurahPage() {
  return (
    <Suspense fallback={null}>
      <SurahView />
    </Suspense>
  )
}
