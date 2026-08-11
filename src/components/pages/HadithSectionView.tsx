'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchHadithSection, fetchHadithSections } from '@/api/hadith'
import { getHadithCollection } from '@/data/hadithCatalog'
import type { HadithItem, HadithSectionMeta } from '@/data/types'
import { CopyQuoteButton } from '@/components/CopyQuoteButton'
import { ReaderSkeleton } from '@/components/ReaderSkeleton'
import { useReaderScrollMemory } from '@/hooks/useReaderScrollMemory'
import { parseHadithParam } from '@/utils/hadithRef'
import { useApp } from '@/context/AppContext'
import './Reader.css'

function HadithSectionNav({
  bookId,
  prevId,
  nextId,
  index,
  total,
  top = false,
}: {
  bookId: string
  prevId: string | null
  nextId: string | null
  index: number
  total: number
  top?: boolean
}) {
  const { t } = useApp()
  return (
    <nav
      className={`reader__nav${top ? ' reader__nav--top' : ''}`}
      aria-label={t('Главы', 'Chapters')}
    >
      {prevId ? (
        <Link
          className="reader__nav-btn"
          href={`/hadith/${bookId}/${prevId}`}
          aria-label={t('Предыдущая глава', 'Previous chapter')}
          title={t('Предыдущая глава', 'Previous chapter')}
        >
          <ChevronLeft strokeWidth={2.25} aria-hidden="true" />
        </Link>
      ) : (
        <span className="reader__nav-btn reader__nav-btn--ghost" aria-hidden="true" />
      )}
      <p className="reader__nav-meta">
        {t(`Глава ${index} из ${total}`, `Chapter ${index} of ${total}`)}
      </p>
      {nextId ? (
        <Link
          className="reader__nav-btn"
          href={`/hadith/${bookId}/${nextId}`}
          aria-label={t('Следующая глава', 'Next chapter')}
          title={t('Следующая глава', 'Next chapter')}
        >
          <ChevronRight strokeWidth={2.25} aria-hidden="true" />
        </Link>
      ) : (
        <span className="reader__nav-btn reader__nav-btn--ghost" aria-hidden="true" />
      )}
    </nav>
  )
}

export function HadithSectionView() {
  const params = useParams<{ id: string; sectionId: string }>()
  const searchParams = useSearchParams()
  const { lang, t } = useApp()
  const book = params.id ? getHadithCollection(params.id) : undefined
  const sectionId = params.sectionId
  const [title, setTitle] = useState<string>('')
  const [sections, setSections] = useState<HadithSectionMeta[] | null>(null)
  const [hadiths, setHadiths] = useState<HadithItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const readerPath =
    book && sectionId ? `/hadith/${book.id}/${sectionId}` : null

  const highlight = useMemo(() => {
    const n = parseHadithParam(searchParams.get('h'))
    if (!n || !hadiths) return null
    return hadiths.some((h) => h.number === n) ? n : null
  }, [searchParams, hadiths])

  const adjacent = useMemo(() => {
    if (!sections || !sectionId) {
      return { prevId: null as string | null, nextId: null as string | null, index: 0, total: 0 }
    }
    const i = sections.findIndex((s) => s.id === sectionId)
    if (i < 0) {
      return { prevId: null, nextId: null, index: 0, total: sections.length }
    }
    return {
      prevId: i > 0 ? sections[i - 1].id : null,
      nextId: i < sections.length - 1 ? sections[i + 1].id : null,
      index: i + 1,
      total: sections.length,
    }
  }, [sections, sectionId])

  useEffect(() => {
    if (!book || !sectionId) {
      setError('missing')
      return
    }
    let cancelled = false
    setError(null)
    setHadiths(null)
    setSections(null)

    Promise.all([
      fetchHadithSections(book.id, lang),
      fetchHadithSection(book.id, sectionId, lang),
    ])
      .then(([secs, items]) => {
        if (cancelled) return
        const sec = secs.find((s) => s.id === sectionId)
        setSections(secs)
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

  useEffect(() => {
    if (!hadiths || !highlight || !book) return
    const el = document.getElementById(`${book.id}-${highlight}`)
    if (!el) return
    const id = window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
    return () => window.clearTimeout(id)
  }, [hadiths, highlight, book])

  useReaderScrollMemory(readerPath, Boolean(hadiths), Boolean(highlight))

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

      {error === 'load-failed' && (
        <p className="reader__status">
          {t('Не удалось загрузить главу', 'Could not load chapter')}
        </p>
      )}
      {!hadiths && !error && <ReaderSkeleton variant="hadith" />}

      {hadiths && (
        <>
          <header className="reader__head">
            <h1>{title}</h1>
            <p className="reader__sub">
              {highlight
                ? t(`Хадис ${highlight}`, `Hadith ${highlight}`)
                : book.title[lang]}
            </p>
          </header>

          <HadithSectionNav
            bookId={book.id}
            prevId={adjacent.prevId}
            nextId={adjacent.nextId}
            index={adjacent.index}
            total={adjacent.total}
            top
          />

          <div className="ayah-list">
            {hadiths.map((h) => {
              const hit = highlight === h.number
              return (
                <article
                  key={h.id}
                  className={hit ? 'ayah ayah--hit' : 'ayah'}
                  id={h.id}
                >
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
              )
            })}
          </div>

          <HadithSectionNav
            bookId={book.id}
            prevId={adjacent.prevId}
            nextId={adjacent.nextId}
            index={adjacent.index}
            total={adjacent.total}
          />
        </>
      )}
    </div>
  )
}
