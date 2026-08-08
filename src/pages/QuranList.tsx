import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchSurahList } from '../api/quran'
import type { SurahMeta } from '../data/types'
import { surahMeaningRu, surahTitleRu } from '../data/surahNamesRu'
import {
  ayahRefPath,
  formatAyahRef,
  parseAyahRef,
} from '../utils/ayahRef'
import { useRestoreListScroll } from '../hooks/useRestoreListScroll'
import { saveLastSurah, saveListScroll } from '../utils/scrollMemory'
import { useApp } from '../context/AppContext'
import './List.css'

export function QuranList() {
  const { lang, t } = useApp()
  const navigate = useNavigate()
  const [list, setList] = useState<SurahMeta[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

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

  useRestoreListScroll('/quran', Boolean(list) && !query.trim())

  const ayahRef = useMemo(() => parseAyahRef(query), [query])

  const ayahTarget = useMemo(() => {
    if (!list || !ayahRef) return null
    const surah = list.find((s) => s.number === ayahRef.surah)
    if (!surah) return null
    if (ayahRef.from > surah.numberOfAyahs) return null
    const to = Math.min(ayahRef.to, surah.numberOfAyahs)
    return {
      surah,
      ref: { ...ayahRef, to },
      clipped: to !== ayahRef.to,
    }
  }, [list, ayahRef])

  const filtered = useMemo(() => {
    if (!list) return []
    if (ayahTarget) return []
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((s) => {
      const ruName = surahTitleRu(s.number, '').toLowerCase()
      const ruMeaning = surahMeaningRu(s.number, '').toLowerCase()
      return (
        String(s.number).includes(q) ||
        s.englishName.toLowerCase().includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        ruName.includes(q) ||
        ruMeaning.includes(q) ||
        s.name.includes(query.trim())
      )
    })
  }, [list, query, ayahTarget])

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault()
    if (ayahTarget) navigate(ayahRefPath(ayahTarget.ref))
  }

  return (
    <div className="list-page">
      <header className="list-page__head">
        <h1>{t('Коран', 'Qur’an')}</h1>
        <p>
          {t(
            'Сура по названию или аят: 2:2, диапазон: 2:2-6.',
            'Surah by name, or ayah: 2:2, range: 2:2-6.',
          )}
        </p>
        <form className="search" onSubmit={onSearchSubmit}>
          <label>
            <span className="sr-only">{t('Поиск', 'Search')}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(
                'Сура или аят, напр. 2:2-6…',
                'Surah or ayah, e.g. 2:2-6…',
              )}
              inputMode="search"
              autoComplete="off"
            />
          </label>
        </form>
      </header>

      {error && (
        <p className="list-page__status">
          {t('Не удалось загрузить список сур', 'Could not load surah list')}
        </p>
      )}
      {!list && !error && (
        <p className="list-page__status">{t('Загрузка…', 'Loading…')}</p>
      )}

      {list && ayahRef && !ayahTarget && (
        <p className="list-page__status">
          {t(
            'Аят не найден. Проверь номер суры и аята.',
            'Ayah not found. Check the surah and ayah numbers.',
          )}
        </p>
      )}

      {list && ayahTarget && (
        <ol className="card-list">
          <li>
            <Link
              className="card-list__ayah-hit"
              to={ayahRefPath(ayahTarget.ref)}
            >
              <span className="card-list__n">
                {formatAyahRef(ayahTarget.ref)}
              </span>
              <span className="card-list__body">
                <strong>
                  {lang === 'ru'
                    ? surahTitleRu(
                        ayahTarget.surah.number,
                        ayahTarget.surah.englishName,
                      )
                    : ayahTarget.surah.englishName}
                  <span className="card-list__ar" dir="rtl">
                    {ayahTarget.surah.name}
                  </span>
                </strong>
                <span className="card-list__meta">
                  {ayahTarget.ref.from === ayahTarget.ref.to
                    ? t('Перейти к аяту', 'Go to ayah')
                    : t('Перейти к аятам', 'Go to ayahs')}
                  {ayahTarget.clipped
                    ? ` · ${t('до конца суры', 'to end of surah')}`
                    : ''}
                </span>
              </span>
            </Link>
          </li>
        </ol>
      )}

      {list && !ayahTarget && (
        <ol className="card-list">
          {filtered.map((s) => (
            <li key={s.number} id={`surah-${s.number}`}>
              <Link
                to={`/quran/${s.number}`}
                onClick={() => {
                  saveListScroll('/quran')
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
    </div>
  )
}
