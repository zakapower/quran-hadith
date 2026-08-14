import type { Metadata } from 'next'
import Link from 'next/link'
import { pageTitle } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Не найдено / Not found',
  openGraph: { title: pageTitle('Не найдено / Not found') },
}

export default function NotFound() {
  return (
    <div className="reader">
      <h1>Не найдено / Not found</h1>
      <Link href="/">На главную / Home</Link>
    </div>
  )
}
