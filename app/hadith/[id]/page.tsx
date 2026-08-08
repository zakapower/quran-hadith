import type { Metadata } from 'next'
import { HadithBookView } from '@/components/pages/HadithBookView'
import { getHadithCollection, hadithCollections } from '@/data/hadithCatalog'
import { getRequestLang } from '@/lib/request-lang'
import { clipDescription, pageAlternates } from '@/lib/site'

export function generateStaticParams() {
  return hadithCollections.map((b) => ({ id: b.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const lang = await getRequestLang()
  const book = getHadithCollection(id)
  const title = book
    ? `${book.title[lang]} – Tilāwah`
    : lang === 'ru'
      ? 'Не найдено – Tilāwah'
      : 'Not found – Tilāwah'
  const description = book
    ? book.narrator[lang]
    : lang === 'ru'
      ? 'Сборник хадисов не найден.'
      : 'Hadith collection not found.'

  return {
    title,
    description: clipDescription(description),
    alternates: pageAlternates(`/hadith/${id}`),
    openGraph: { title, description: clipDescription(description) },
  }
}

export default function HadithBookPage() {
  return <HadithBookView />
}
