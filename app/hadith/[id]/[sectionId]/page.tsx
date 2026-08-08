import type { Metadata } from 'next'
import { HadithSectionView } from '@/components/pages/HadithSectionView'
import { getHadithCollection } from '@/data/hadithCatalog'
import { getRequestLang } from '@/lib/request-lang'
import { clipDescription, pageAlternates } from '@/lib/site'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; sectionId: string }>
}): Promise<Metadata> {
  const { id, sectionId } = await params
  const lang = await getRequestLang()
  const book = getHadithCollection(id)
  const title = book
    ? `${book.title[lang]} – Tilāwah`
    : lang === 'ru'
      ? 'Не найдено – Tilāwah'
      : 'Not found – Tilāwah'
  const description =
    lang === 'ru'
      ? 'Чтение главы хадисов.'
      : 'Read a hadith chapter.'

  return {
    title,
    description: clipDescription(description),
    alternates: pageAlternates(`/hadith/${id}/${sectionId}`),
    openGraph: { title, description: clipDescription(description) },
  }
}

export default function HadithSectionPage() {
  return <HadithSectionView />
}
