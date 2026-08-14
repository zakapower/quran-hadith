import type { Metadata } from 'next'
import { HadithBookView } from '@/components/pages/HadithBookView'
import { fetchHadithSections } from '@/api/hadith'
import { getHadithCollection, hadithCollections } from '@/data/hadithCatalog'
import { getRequestLang } from '@/lib/request-lang'
import { clipDescription, pageAlternates, pageTitle } from '@/lib/site'

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
