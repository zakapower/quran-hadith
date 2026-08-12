import type { Metadata } from 'next'
import { Suspense } from 'react'
import { HadithSectionView } from '@/components/pages/HadithSectionView'
import {
  fetchHadithSection,
  fetchHadithSections,
} from '@/api/hadith'
import { getHadithCollection, hadithCollections } from '@/data/hadithCatalog'
import { clipDescription, pageAlternates } from '@/lib/site'

/** First visit builds HTML; then cached (ISR). Avoids huge Vercel builds. */
export const revalidate = 86400
export const dynamicParams = true

/** Prefetch a few early chapters per book so common paths are warm. */
export async function generateStaticParams() {
  const params: Array<{ id: string; sectionId: string }> = []
  for (const book of hadithCollections) {
    try {
      const sections = await fetchHadithSections(book.id, 'en')
      for (const s of sections.slice(0, 8)) {
        params.push({ id: book.id, sectionId: s.id })
      }
    } catch {
      /* skip */
    }
  }
  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; sectionId: string }>
}): Promise<Metadata> {
  const { id, sectionId } = await params
  const book = getHadithCollection(id)
  const title = book
    ? `${book.title.ru} / ${book.title.en} – Tilāwah`
    : 'Hadith – Tilāwah'
  const description = 'Чтение главы хадисов. Read a hadith chapter.'

  return {
    title,
    description: clipDescription(description),
    alternates: pageAlternates(`/hadith/${id}/${sectionId}`),
    openGraph: { title, description: clipDescription(description) },
  }
}

export default async function HadithSectionPage({
  params,
}: {
  params: Promise<{ id: string; sectionId: string }>
}) {
  const { id, sectionId } = await params
  const book = getHadithCollection(id)

  type Pack = {
    sections: Awaited<ReturnType<typeof fetchHadithSections>>
    hadiths: Awaited<ReturnType<typeof fetchHadithSection>>
    title: string
  }

  let initialByLang: Partial<Record<'ru' | 'en', Pack>> = {}

  if (book) {
    const load = async (lang: 'ru' | 'en'): Promise<Pack | null> => {
      try {
        const [sections, hadiths] = await Promise.all([
          fetchHadithSections(book.id, lang),
          fetchHadithSection(book.id, sectionId, lang),
        ])
        const sec = sections.find((s) => s.id === sectionId)
        return {
          sections,
          hadiths,
          title: sec?.name ?? sectionId,
        }
      } catch {
        return null
      }
    }

    const [ru, en] = await Promise.all([load('ru'), load('en')])
    initialByLang = {
      ...(ru ? { ru } : {}),
      ...(en ? { en } : {}),
    }
  }

  return (
    <Suspense fallback={null}>
      <HadithSectionView initialByLang={initialByLang} />
    </Suspense>
  )
}
