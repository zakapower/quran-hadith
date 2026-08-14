import type { Metadata } from 'next'
import { AboutView } from '@/components/pages/AboutView'
import { clipDescription, pageAlternates, pageTitle } from '@/lib/site'

export const dynamic = 'force-static'

export async function generateMetadata(): Promise<Metadata> {
  const title = 'О проекте / About'
  const description =
    'О проекте Tilāwah: Коран, хадисы, озвучка и избранное. About Tilāwah.'

  return {
    title,
    description: clipDescription(description),
    alternates: pageAlternates('/about'),
    openGraph: { title: pageTitle(title), description: clipDescription(description) },
  }
}

export default function AboutPage() {
  return <AboutView />
}
