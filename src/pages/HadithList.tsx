import { Link } from 'react-router-dom'
import { hadithBooks } from '../data/hadiths'
import { useApp } from '../context/AppContext'
import './List.css'

export function HadithList() {
  const { lang, t } = useApp()

  return (
    <div className="list-page">
      <header className="list-page__head">
        <h1>{t('Хадисы', 'Hadith')}</h1>
        <p>
          {t(
            'Короткие сборники для начала. Позже можно добавить больше.',
            'Short collections to start. More can be added later.',
          )}
        </p>
      </header>

      <ol className="card-list">
        {hadithBooks.map((b, i) => (
          <li key={b.id}>
            <Link to={`/hadith/${b.id}`}>
              <span className="card-list__n">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="card-list__body">
                <strong>{b.title[lang]}</strong>
                <span className="card-list__meta">
                  {b.narrator[lang]} · {b.hadiths.length}{' '}
                  {t('хадисов', 'hadiths')}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
