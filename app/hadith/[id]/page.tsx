import type { Metadata } from 'next'
import { HadithBookView } from '@/components/pages/HadithBookView'
import { fetchHadithSections } from '@/api/hadith'
import { getHadithCollection } from '@/data/hadithCatalog'
import { getRequestLang } from '@/lib/request-lang'
import { hadithBookStaticParams, loadBothLangs } from '@/lib/ssg'
import { clipDescription, pageAlternates, pageTitle } from '@/lib/site'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return hadithBookStaticParams()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const lang = await getRequestLang()
  const book = getHadithCollection(id)
  const tab = book
    ? book.title[lang]
    : lang === 'ru'
      ? 'Хадисы'
      : 'Hadith'
  const title = pageTitle(tab)
  const description = book
    ? book.narrator[lang]
    : lang === 'ru'
      ? 'Сборник хадисов.'
      : 'Hadith collection.'

  return {
    title: tab,
    description: clipDescription(description),
    alternates: pageAlternates(`/hadith/${id}`),
    openGraph: { title, description: clipDescription(description) },
  }
}

export default async function HadithBookPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const book = getHadithCollection(id)

  const initialByLang = book
    ? await loadBothLangs((lang) =>
        fetchHadithSections(book.id, lang).catch(() => null),
      )
    : {}

  return <HadithBookView initialByLang={initialByLang} />
}
