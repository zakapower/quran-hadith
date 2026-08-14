import type { Metadata } from 'next'
import { AboutView } from '@/components/pages/AboutView'
import { getRequestLang } from '@/lib/request-lang'
import { clipDescription, pageAlternates, pageTitle } from '@/lib/site'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLang()
  const tab = lang === 'ru' ? 'О проекте' : 'About'
  const title = pageTitle(tab)
  const description =
    lang === 'ru'
      ? 'О проекте Tilāwah: Коран, хадисы, озвучка и избранное.'
      : 'About Tilāwah: Qur’an, hadith, recitation, and favorites.'

  return {
    title: tab,
    description: clipDescription(description),
    alternates: pageAlternates('/about'),
    openGraph: { title, description: clipDescription(description) },
  }
}

export default function AboutPage() {
  return <AboutView />
}
