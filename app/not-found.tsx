import type { Metadata } from 'next'
import Link from 'next/link'
import { getRequestLang } from '@/lib/request-lang'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLang()
  return {
    title: lang === 'ru' ? 'Не найдено' : 'Not found',
  }
}

export default function NotFound() {
  return (
    <div className="reader">
      <h1>Не найдено / Not found</h1>
      <Link href="/">На главную / Home</Link>
    </div>
  )
}
