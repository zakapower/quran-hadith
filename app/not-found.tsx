import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="reader">
      <h1>Не найдено / Not found</h1>
      <Link href="/">На главную / Home</Link>
    </div>
  )
}
