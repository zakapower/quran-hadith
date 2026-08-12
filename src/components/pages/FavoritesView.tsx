'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Bookmark } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useFavoritesStore } from '@/hooks/useFavorites'
import { FavoriteButton } from '@/components/FavoriteButton'
import { ayahRefPath } from '@/utils/ayahRef'
import { hadithRefPath } from '@/utils/hadithRef'
import { surahTitleRu } from '@/data/surahNamesRu'
import { getSurahMeta } from '@/data/surahList'
import './List.css'
import './Favorites.css'

type Tab = 'quran' | 'hadith'

export function FavoritesView() {
  const { lang, t } = useApp()
  const store = useFavoritesStore()
  const [tab, setTab] = useState<Tab>('quran')

  const ayahs = useMemo(
    () => [...store.ayahs].sort((a, b) => b.addedAt - a.addedAt),
    [store.ayahs],
  )
  const hadiths = useMemo(
    () => [...store.hadiths].sort((a, b) => b.addedAt - a.addedAt),
    [store.hadiths],
  )

  return (
    <div className="list-page favorites-page">
      <header className="list-page__head">
        <h1>{t('Избранное', 'Favorites')}</h1>
        <p>
          {t(
            'Сохранённые аяты и хадисы на этом устройстве.',
            'Saved ayahs and hadiths on this device.',
          )}
        </p>
      </header>

      <div className="favorites-tabs" role="tablist" aria-label={t('Разделы', 'Sections')}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'quran'}
          className={`favorites-tabs__btn${tab === 'quran' ? ' is-active' : ''}`}
          onClick={() => setTab('quran')}
        >
          {t('Коран', 'Qur’an')}
          <span className="favorites-tabs__count">{ayahs.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'hadith'}
          className={`favorites-tabs__btn${tab === 'hadith' ? ' is-active' : ''}`}
          onClick={() => setTab('hadith')}
        >
          {t('Хадисы', 'Hadith')}
          <span className="favorites-tabs__count">{hadiths.length}</span>
        </button>
      </div>

      {tab === 'quran' && (
        <div role="tabpanel" className="favorites-panel">
          {ayahs.length === 0 ? (
            <EmptyHint
              text={t(
                'Нажмите флажок на аяте, чтобы сохранить его здесь.',
                'Tap the bookmark on an ayah to save it here.',
              )}
            />
          ) : (
            <ul className="favorites-list">
              {ayahs.map((a) => {
                const meta = getSurahMeta(a.surah)
                const title =
                  lang === 'ru'
                    ? surahTitleRu(a.surah, meta?.englishName ?? String(a.surah))
                    : meta?.englishName ?? String(a.surah)
                const href = ayahRefPath({
                  surah: a.surah,
                  from: a.ayah,
                  to: a.ayah,
                })
                return (
                  <li key={`${a.surah}:${a.ayah}`} className="favorites-item">
                    <Link href={href} className="favorites-item__link">
                      <p className="favorites-item__ref">
                        {title} · {a.surah}:{a.ayah}
                      </p>
                      {a.snippet ? (
                        <p className="favorites-item__snip">{a.snippet}</p>
                      ) : null}
                    </Link>
                    <FavoriteButton
                      kind="ayah"
                      surah={a.surah}
                      ayah={a.ayah}
                      snippet={a.snippet}
                    />
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {tab === 'hadith' && (
        <div role="tabpanel" className="favorites-panel">
          {hadiths.length === 0 ? (
            <EmptyHint
              text={t(
                'Нажмите флажок на хадисе, чтобы сохранить его здесь.',
                'Tap the bookmark on a hadith to save it here.',
              )}
            />
          ) : (
            <ul className="favorites-list">
              {hadiths.map((h) => {
                const href = hadithRefPath(h.bookId, h.sectionId, h.number)
                return (
                  <li
                    key={`${h.bookId}:${h.sectionId}:${h.number}`}
                    className="favorites-item"
                  >
                    <Link href={href} className="favorites-item__link">
                      <p className="favorites-item__ref">
                        {h.bookTitle} · {h.number}
                      </p>
                      {h.snippet ? (
                        <p className="favorites-item__snip">{h.snippet}</p>
                      ) : null}
                    </Link>
                    <FavoriteButton
                      kind="hadith"
                      bookId={h.bookId}
                      sectionId={h.sectionId}
                      number={h.number}
                      bookTitle={h.bookTitle}
                      snippet={h.snippet}
                    />
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p className="favorites-empty">
      <Bookmark className="favorites-empty__icon" strokeWidth={2} aria-hidden />
      <span>{text}</span>
    </p>
  )
}
