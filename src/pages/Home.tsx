import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchSurahList } from '../api/quran'
import type { SurahMeta } from '../data/types'
import { surahMeaningRu, surahTitleRu } from '../data/surahNamesRu'
import { useRestoreListScroll } from '../hooks/useRestoreListScroll'
import { saveLastSurah, saveListScroll } from '../utils/scrollMemory'
import { useApp } from '../context/AppContext'
import './List.css'
import './Home.css'

export function Home() {
  const { lang, t } = useApp()
  const [list, setList] = useState<SurahMeta[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchSurahList()
      .then((data) => {
        if (!cancelled) setList(data)
      })
      .catch(() => {
        if (!cancelled) setError('load-failed')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useRestoreListScroll('/', Boolean(list))

  return (
    <div className="home">
      <section className="hero">
        <div className="hero__bg" aria-hidden="true" />
        <div className="hero__inner">
          <p className="hero__brand">Tilāwah</p>
          <h1>
            {t('Коран и хадисы – простое чтение', 'Qur’an and Hadith – simple reading')}
          </h1>
          <p className="hero__lead">
            {t(
              'Читай арабский текст и перевод. Русский или English. Светлая или тёмная тема.',
              'Read Arabic text and translation. Russian or English. Light or dark theme.',
            )}
          </p>
          <div className="hero__actions">
            <Link className="btn" to="/quran">
              {t('Открыть Коран', 'Open Qur’an')}
            </Link>
            <Link className="btn btn--ghost" to="/hadith">
              {t('Хадисы', 'Hadith')}
            </Link>
          </div>
        </div>
      </section>

      <section className="home-surahs" aria-labelledby="home-surahs-title">
        <header className="home-surahs__head">
          <h2 id="home-surahs-title">{t('Суры', 'Surahs')}</h2>
          <p>
            {t(
              'Все 114 сур. Выбери и читай.',
              'All 114 surahs. Pick one and read.',
            )}
          </p>
        </header>

        {error && (
          <p className="home-surahs__status">
            {t('Не удалось загрузить список сур', 'Could not load surah list')}
          </p>
        )}
        {!list && !error && (
          <p className="home-surahs__status">{t('Загрузка…', 'Loading…')}</p>
        )}

        {list && (
          <ol className="card-list card-list--cols">
            {list.map((s) => (
              <li key={s.number} id={`surah-${s.number}`}>
                <Link
                  to={`/quran/${s.number}`}
                  onClick={() => {
                    saveListScroll('/')
                    saveLastSurah(s.number)
                  }}
                >
                  <span className="card-list__n">
                    {String(s.number).padStart(2, '0')}
                  </span>
                  <span className="card-list__body">
                    <strong>
                      {lang === 'ru'
                        ? surahTitleRu(s.number, s.englishName)
                        : s.englishName}
                      <span className="card-list__ar" dir="rtl">
                        {s.name}
                      </span>
                    </strong>
                    <span className="card-list__meta">
                      {lang === 'ru'
                        ? surahMeaningRu(s.number, s.englishNameTranslation)
                        : s.englishNameTranslation}{' '}
                      · {s.numberOfAyahs} {t('аятов', 'ayahs')}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
