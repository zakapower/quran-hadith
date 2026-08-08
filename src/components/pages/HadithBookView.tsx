'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { fetchHadithSections } from '@/api/hadith'
import { getHadithCollection } from '@/data/hadithCatalog'
import type { HadithSectionMeta } from '@/data/types'
import { ReaderSkeleton } from '@/components/ReaderSkeleton'
import { useRestoreListScroll } from '@/hooks/useRestoreListScroll'
import { saveLastHadith, saveListScroll } from '@/utils/scrollMemory'
import { useApp } from '@/context/AppContext'
import './List.css'
import './Reader.css'

export function HadithBookView() {
  const params = useParams<{ id: string }>()
  const { lang, t } = useApp()
  const book = params.id ? getHadithCollection(params.id) : undefined
  const [sections, setSections] = useState<HadithSectionMeta[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const listPath = book ? `/hadith/${book.id}` : ''

  useRestoreListScroll(listPath, Boolean(sections))

  useEffect(() => {
    if (!book) {
      setError('missing')
      return
    }
    let cancelled = false
    setError(null)
    setSections(null)

    fetchHadithSections(book.id, lang)
      .then((data) => {
        if (!cancelled) setSections(data)
      })
      .catch(() => {
        if (!cancelled) setError('load-failed')
      })

    return () => {
      cancelled = true
    }
  }, [book, lang])

  if (!book || error === 'missing') {
    return (
      <div className="reader">
        <h1>{t('Не найдено', 'Not found')}</h1>
        <Link href="/hadith">{t('К хадисам', 'Back to hadith')}</Link>
      </div>
    )
  }

  return (
    <div className="list-page">
      <nav className="reader__crumb">
        <Link href="/hadith">{t('Хадисы', 'Hadith')}</Link>
        <span aria-hidden="true">/</span>
        <span>{book.title[lang]}</span>
      </nav>

      <header className="list-page__head">
        <h1>{book.title[lang]}</h1>
        <p>
          {book.narrator[lang]}
          {t('. Выбери главу (китаб).', '. Pick a chapter (kitab).')}
        </p>
      </header>

      {error === 'load-failed' && (
        <p className="reader__status">
          {t('Не удалось загрузить сборник', 'Could not load collection')}
        </p>
      )}

      {!sections && !error && (
        <ReaderSkeleton
          variant="chapters"
          label={t('Загрузка…', 'Loading…')}
        />
      )}

      {sections && (
        <ol className="card-list">
          {sections.map((s) => (
            <li key={s.id} id={`hadith-section-${book.id}-${s.id}`}>
              <Link
                href={`/hadith/${book.id}/${s.id}`}
                onClick={() => {
                  saveListScroll(`/hadith/${book.id}`)
                  saveLastHadith(book.id, s.id)
                }}
              >
                <span className="card-list__n">
                  {String(s.number).padStart(2, '0')}
                </span>
                <span className="card-list__body">
                  <strong>{s.name}</strong>
                  <span className="card-list__meta">
                    {s.count} {t('хадисов', 'hadiths')}
                    {s.hadithFirst > 0
                      ? ` · ${s.hadithFirst}–${s.hadithLast}`
                      : ''}
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
