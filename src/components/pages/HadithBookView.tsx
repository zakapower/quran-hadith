'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { fetchHadithSections } from '@/api/hadith'
import { getHadithCollection } from '@/data/hadithCatalog'
import type { HadithSectionMeta } from '@/data/types'
import { ReaderSkeleton } from '@/components/ReaderSkeleton'
import { useRestoreListScroll } from '@/hooks/useRestoreListScroll'
import { saveLastHadith, saveListScroll } from '@/utils/scrollMemory'
import {
  findSectionForHadith,
  hadithRefPath,
  parseHadithNumber,
} from '@/utils/hadithRef'
import { useApp } from '@/context/AppContext'
import './List.css'
import './Reader.css'

export function HadithBookView() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { lang, t } = useApp()
  const book = params.id ? getHadithCollection(params.id) : undefined
  const [sections, setSections] = useState<HadithSectionMeta[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const listPath = book ? `/hadith/${book.id}` : ''

  useRestoreListScroll(listPath, Boolean(sections) && !query.trim())

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

  const hadithNum = useMemo(() => parseHadithNumber(query), [query])

  const hadithTarget = useMemo(() => {
    if (!hadithNum || !sections) return null
    const section = findSectionForHadith(sections, hadithNum)
    if (!section) return null
    return { section, number: hadithNum }
  }, [hadithNum, sections])

  const filtered = useMemo(() => {
    if (!sections || hadithTarget) return []
    const q = query.trim().toLowerCase()
    if (!q) return sections
    return sections.filter(
      (s) =>
        String(s.number).includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.hadithFirst > 0 &&
          `${s.hadithFirst}-${s.hadithLast}`.includes(q)),
    )
  }, [sections, query, hadithTarget])

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault()
    if (!book || !hadithTarget) return
    router.push(
      hadithRefPath(book.id, hadithTarget.section.id, hadithTarget.number),
    )
  }

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
          {t(
            'Глава по названию или номер хадиса, напр. 756.',
            'Chapter by name, or hadith number, e.g. 756.',
          )}
        </p>
        {!sections && !error ? (
          <div className="search-skel" aria-hidden="true">
            <div className="search-skel__bone" />
          </div>
        ) : (
          <form className="search" onSubmit={onSearchSubmit}>
            <label>
              <span className="sr-only">{t('Поиск', 'Search')}</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t(
                  'Глава или хадис, напр. 756…',
                  'Chapter or hadith, e.g. 756…',
                )}
                inputMode="search"
                autoComplete="off"
              />
            </label>
          </form>
        )}
      </header>

      {error === 'load-failed' && (
        <p className="reader__status">
          {t('Не удалось загрузить сборник', 'Could not load collection')}
        </p>
      )}

      {!sections && !error && (
        <ReaderSkeleton variant="chapters" />
      )}

      {sections && hadithNum && !hadithTarget && (
        <p className="list-page__status">
          {t(
            'Хадис не найден. Проверь номер.',
            'Hadith not found. Check the number.',
          )}
        </p>
      )}

      {hadithTarget && (
        <ol className="card-list">
          <li>
            <Link
              className="card-list__ayah-hit"
              href={hadithRefPath(
                book.id,
                hadithTarget.section.id,
                hadithTarget.number,
              )}
            >
              <span className="card-list__n">{hadithTarget.number}</span>
              <span className="card-list__body">
                <strong>{hadithTarget.section.name}</strong>
                <span className="card-list__meta">
                  {t('Перейти к хадису', 'Go to hadith')}
                  {` · ${hadithTarget.section.hadithFirst}–${hadithTarget.section.hadithLast}`}
                </span>
              </span>
            </Link>
          </li>
        </ol>
      )}

      {sections && !hadithTarget && (
        <ol className="card-list">
          {filtered.map((s) => (
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
