'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { fetchSurah } from '@/api/quran'
import type { SurahContent } from '@/data/types'
import { surahTitleRu } from '@/data/surahNamesRu'
import { parseAyahParam } from '@/utils/ayahRef'
import { CopyAyahButton } from '@/components/CopyAyahButton'
import { ReaderSkeleton } from '@/components/ReaderSkeleton'
import { useReaderScrollMemory } from '@/hooks/useReaderScrollMemory'
import { useApp } from '@/context/AppContext'
import './Reader.css'

export function SurahView() {
  const params = useParams<{ number: string }>()
  const searchParams = useSearchParams()
  const { lang, t } = useApp()
  const [surah, setSurah] = useState<SurahContent | null>(null)
  const [error, setError] = useState<string | null>(null)

  const n = Number(params.number)
  const readerPath =
    Number.isFinite(n) && n >= 1 && n <= 114 ? `/quran/${n}` : null
  const title = surah
    ? lang === 'ru'
      ? surahTitleRu(surah.number, surah.englishName)
      : surah.englishName
    : null

  const highlight = useMemo(() => {
    const range = parseAyahParam(searchParams.get('a'))
    if (!range || !surah) return null
    const max = surah.ayahsArabic.length
    const from = Math.min(range.from, max)
    const to = Math.min(range.to, max)
    if (from < 1) return null
    return { from, to }
  }, [searchParams, surah])

  useEffect(() => {
    if (!Number.isFinite(n) || n < 1 || n > 114) {
      setError('missing')
      return
    }
    let cancelled = false
    setSurah(null)
    setError(null)
    fetchSurah(n, lang)
      .then((data) => {
        if (!cancelled) setSurah(data)
      })
      .catch(() => {
        if (!cancelled) setError('load-failed')
      })
    return () => {
      cancelled = true
    }
  }, [n, lang])

  useEffect(() => {
    if (!surah || !highlight) return
    const el = document.getElementById(`a${highlight.from}`)
    if (!el) return
    const id = window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
    return () => window.clearTimeout(id)
  }, [surah, highlight])

  useReaderScrollMemory(readerPath, Boolean(surah), Boolean(highlight))

  return (
    <div className="reader">
      <nav className="reader__crumb">
        <Link href="/quran">{t('Коран', 'Qur’an')}</Link>
        <span aria-hidden="true">/</span>
        <span>{title ?? '…'}</span>
      </nav>

      {error && (
        <p className="reader__status">
          {error === 'missing'
            ? t('Сура не найдена', 'Surah not found')
            : t('Не удалось загрузить суру', 'Could not load surah')}
        </p>
      )}
      {!surah && !error && (
        <ReaderSkeleton
          variant="surah"
          label={t('Загрузка…', 'Loading…')}
        />
      )}

      {surah && title && (
        <>
          <header className="reader__head">
            <p className="reader__ar-title" dir="rtl" lang="ar">
              {surah.name}
            </p>
            <h1>
              {surah.number}. {title}
            </h1>
            {highlight && (
              <p className="reader__sub">
                {highlight.from === highlight.to
                  ? t(`Аят ${highlight.from}`, `Ayah ${highlight.from}`)
                  : t(
                      `Аяты ${highlight.from}–${highlight.to}`,
                      `Ayahs ${highlight.from}–${highlight.to}`,
                    )}
              </p>
            )}
          </header>

          <div className="ayah-list">
            {surah.ayahsArabic.map((a, i) => {
              const hit =
                highlight &&
                a.numberInSurah >= highlight.from &&
                a.numberInSurah <= highlight.to
              return (
                <article
                  key={a.number}
                  className={hit ? 'ayah ayah--hit' : 'ayah'}
                  id={`a${a.numberInSurah}`}
                >
                  <div className="ayah__top">
                    <p className="ayah__n">{a.numberInSurah}</p>
                    <CopyAyahButton
                      surah={surah.number}
                      ayah={a.numberInSurah}
                      translation={surah.ayahsTranslation[i]?.text ?? ''}
                    />
                  </div>
                  <p className="ayah__ar" dir="rtl" lang="ar">
                    {a.text}
                  </p>
                  <p className="ayah__tr">{surah.ayahsTranslation[i]?.text}</p>
                </article>
              )
            })}
          </div>

          <nav className="reader__nav">
            {n > 1 && (
              <Link href={`/quran/${n - 1}`}>
                ← {t('Предыдущая', 'Previous')}
              </Link>
            )}
            {n < 114 && (
              <Link href={`/quran/${n + 1}`}>
                {t('Следующая', 'Next')} →
              </Link>
            )}
          </nav>
        </>
      )}
    </div>
  )
}
