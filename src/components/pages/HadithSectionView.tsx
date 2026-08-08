'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { fetchHadithSection, fetchHadithSections } from '@/api/hadith'
import { getHadithCollection } from '@/data/hadithCatalog'
import type { HadithItem } from '@/data/types'
import { CopyQuoteButton } from '@/components/CopyQuoteButton'
import { ReaderSkeleton } from '@/components/ReaderSkeleton'
import { useReaderScrollMemory } from '@/hooks/useReaderScrollMemory'
import { useApp } from '@/context/AppContext'
import './Reader.css'

export function HadithSectionView() {
  const params = useParams<{ id: string; sectionId: string }>()
  const { lang, t } = useApp()
  const book = params.id ? getHadithCollection(params.id) : undefined
  const sectionId = params.sectionId
  const [title, setTitle] = useState<string>('')
  const [hadiths, setHadiths] = useState<HadithItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const readerPath =
    book && sectionId ? `/hadith/${book.id}/${sectionId}` : null

  useReaderScrollMemory(readerPath, Boolean(hadiths))

  useEffect(() => {
    if (!book || !sectionId) {
      setError('missing')
      return
    }
    let cancelled = false
    setError(null)
    setHadiths(null)

    Promise.all([
      fetchHadithSections(book.id, lang),
      fetchHadithSection(book.id, sectionId, lang),
    ])
      .then(([sections, items]) => {
        if (cancelled) return
        const sec = sections.find((s) => s.id === sectionId)
        setTitle(sec?.name ?? sectionId)
        setHadiths(items)
      })
      .catch(() => {
        if (!cancelled) setError('load-failed')
      })

    return () => {
      cancelled = true
    }
  }, [book, sectionId, lang])

  if (!book || error === 'missing') {
    return (
      <div className="reader">
        <h1>{t('Не найдено', 'Not found')}</h1>
        <Link href="/hadith">{t('К хадисам', 'Back to hadith')}</Link>
      </div>
    )
  }

  return (
    <div className="reader">
      <nav className="reader__crumb">
        <Link href="/hadith">{t('Хадисы', 'Hadith')}</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/hadith/${book.id}`}>{book.title[lang]}</Link>
        <span aria-hidden="true">/</span>
        <span>{title || '…'}</span>
      </nav>

      {hadiths && (
        <header className="reader__head">
          <h1>{title}</h1>
          <p className="reader__sub">{book.title[lang]}</p>
        </header>
      )}

      {error === 'load-failed' && (
        <p className="reader__status">
          {t('Не удалось загрузить главу', 'Could not load chapter')}
        </p>
      )}
      {!hadiths && !error && (
        <ReaderSkeleton
          variant="hadith"
          label={t('Загрузка…', 'Loading…')}
        />
      )}

      {hadiths && (
        <div className="ayah-list">
          {hadiths.map((h) => (
            <article key={h.id} className="ayah" id={h.id}>
              <div className="ayah__top">
                <p className="ayah__n">{h.number}</p>
                <CopyQuoteButton
                  heading={`${book.title[lang]} ${h.number}`}
                  body={h.text || h.arabic || ''}
                  label={t('Копировать хадис', 'Copy hadith')}
                />
              </div>
              {h.arabic && (
                <p className="ayah__ar" dir="rtl" lang="ar">
                  {h.arabic}
                </p>
              )}
              {h.text && <p className="ayah__tr">{h.text}</p>}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
