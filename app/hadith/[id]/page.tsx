import type { Metadata } from 'next'
import { HadithBookView } from '@/components/pages/HadithBookView'
import { fetchHadithSections } from '@/api/hadith'
import { getHadithCollection, hadithCollections } from '@/data/hadithCatalog'
import { clipDescription, pageAlternates, pageTitle } from '@/lib/site'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return hadithCollections.map((b) => ({ id: b.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const book = getHadithCollection(id)
  const title = book ? `${book.title.ru} / ${book.title.en}` : 'Hadith'
  const description = book
    ? `${book.narrator.ru}. ${book.narrator.en}.`
    : 'Hadith collection.'

  return {
    title,
    description: clipDescription(description),
    alternates: pageAlternates(`/hadith/${id}`),
    openGraph: { title: pageTitle(title), description: clipDescription(description) },
  }
}

export default async function HadithBookPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const book = getHadithCollection(id)
  let initialByLang: {
    ru?: Awaited<ReturnType<typeof fetchHadithSections>>
    en?: Awaited<ReturnType<typeof fetchHadithSections>>
  } = {}

  if (book) {
    const [ru, en] = await Promise.all([
      fetchHadithSections(book.id, 'ru').catch(() => null),
      fetchHadithSections(book.id, 'en').catch(() => null),
    ])
    initialByLang = {
      ...(ru ? { ru } : {}),
      ...(en ? { en } : {}),
    }
  }

  return <HadithBookView initialByLang={initialByLang} />
}
