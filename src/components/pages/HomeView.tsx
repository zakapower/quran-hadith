'use client'

import Link from 'next/link'
import type { SurahMeta } from '@/data/types'
import { surahMeaningRu, surahTitleRu } from '@/data/surahNamesRu'
import { useRestoreListScroll } from '@/hooks/useRestoreListScroll'
import { saveLastSurah, saveListScroll } from '@/utils/scrollMemory'
import { useApp } from '@/context/AppContext'
import './List.css'
import './Home.css'

export function HomeView({ surahs }: { surahs: SurahMeta[] }) {
  const { lang, t } = useApp()

  useRestoreListScroll('/', true)

  return (
    <div className="home">
      <section className="hero">
        <div className="hero__bg" aria-hidden="true" />
        <div className="hero__inner">
          <p className="hero__brand">Tilāwah</p>
          <h1>
            {t('Коран и хадисы', 'Qur’an and Hadith')}
            <br />
            {t('простое чтение', 'simple reading')}
          </h1>
          <p className="hero__lead">
            {t(
              'Читай арабский текст и перевод. Русский или English. Светлая или тёмная тема.',
              'Read Arabic text and translation. Russian or English. Light or dark theme.',
            )}
          </p>
          <div className="hero__actions">
            <Link className="btn" href="/quran">
              {t('Открыть Коран', 'Open Qur’an')}
            </Link>
            <Link className="btn btn--ghost" href="/hadith">
              {t('Хадисы', 'Hadith')}
            </Link>
          </div>
        </div>
      </section>

      <section className="home-surahs" aria-labelledby="home-surahs-title">
        <header className="home-surahs__head">
          <div className="home-surahs__title-row">
            <h2 id="home-surahs-title">{t('Суры', 'Surahs')}</h2>
            <Link href="/quran">{t('Все →', 'All →')}</Link>
          </div>
          <p>
            {t(
              'Все 114 сур. Выбери и читай.',
              'All 114 surahs. Pick one and read.',
            )}
          </p>
        </header>

        <ol className="card-list card-list--cols">
          {surahs.map((s) => (
            <li key={s.number} id={`surah-${s.number}`}>
              <Link
                href={`/quran/${s.number}`}
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
      </section>
    </div>
  )
}
