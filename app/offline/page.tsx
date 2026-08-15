import type { Metadata } from 'next'
import { OfflineView } from '@/components/pages/OfflineView'
import { getRequestLang } from '@/lib/request-lang'
import { pageTitle } from '@/lib/site'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLang()
  const tab = lang === 'ru' ? 'Нет сети' : 'Offline'
  return {
    title: tab,
    robots: { index: false, follow: false },
    openGraph: { title: pageTitle(tab) },
  }
}

export default async function OfflinePage() {
  const lang = await getRequestLang()
  return <OfflineView lang={lang} />
}
