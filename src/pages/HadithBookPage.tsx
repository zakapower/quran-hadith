import { Link, useParams } from 'react-router-dom'
import { getHadithBook } from '../data/hadiths'
import { useApp } from '../context/AppContext'
import './Reader.css'

export function HadithBookPage() {
  const { id } = useParams()
  const { lang, t } = useApp()
  const book = id ? getHadithBook(id) : undefined

  if (!book) {
    return (
      <div className="reader">
        <h1>{t('Не найдено', 'Not found')}</h1>
        <Link to="/hadith">{t('К хадисам', 'Back to hadith')}</Link>
      </div>
    )
  }

  return (
    <div className="reader">
      <nav className="reader__crumb">
        <Link to="/hadith">{t('Хадисы', 'Hadith')}</Link>
        <span aria-hidden="true">/</span>
        <span>{book.title[lang]}</span>
      </nav>

      <header className="reader__head">
        <h1>{book.title[lang]}</h1>
        <p className="reader__sub">{book.narrator[lang]}</p>
      </header>

      <div className="ayah-list">
        {book.hadiths.map((h) => (
          <article key={h.id} className="ayah" id={h.id}>
            <p className="ayah__n">{h.number}</p>
            {h.arabic && (
              <p className="ayah__ar" dir="rtl" lang="ar">
                {h.arabic}
              </p>
            )}
            <p className="ayah__tr">{h.text[lang]}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
