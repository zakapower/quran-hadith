'use client'

import { Pause, Play, SkipBack, SkipForward, X } from 'lucide-react'
import { RECITERS } from '@/data/reciters'
import { useQuranAudio } from '@/context/QuranAudioContext'
import { useApp } from '@/context/AppContext'
import './QuranPlayerBar.css'

export function QuranPlayerBar() {
  const { t, lang } = useApp()
  const {
    visible,
    playing,
    loading,
    error,
    reciterId,
    surah,
    ayah,
    progress,
    togglePause,
    close,
    nextAyah,
    prevAyah,
    setReciter,
    retry,
  } = useQuranAudio()

  if (!visible) return null

  return (
    <div
      className="quran-player"
      role="region"
      aria-label={t('Плеер Корана', 'Qur’an player')}
    >
      <div
        className="quran-player__progress"
        style={{ ['--p' as string]: String(progress) }}
        aria-hidden="true"
      />
      <div className="quran-player__row">
        <label className="quran-player__reciter">
          <span className="visually-hidden">
            {t('Чтец', 'Reciter')}
          </span>
          <select
            value={reciterId}
            onChange={(e) => setReciter(Number(e.target.value))}
            disabled={loading}
          >
            {RECITERS.map((r) => (
              <option key={r.id} value={r.id}>
                {lang === 'ru' ? r.nameRu : r.nameEn}
              </option>
            ))}
          </select>
        </label>

        <div className="quran-player__transport">
          <button
            type="button"
            className="quran-player__btn"
            onClick={prevAyah}
            aria-label={t('Предыдущий аят', 'Previous ayah')}
            disabled={loading}
          >
            <SkipBack strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="quran-player__btn quran-player__btn--main"
            onClick={togglePause}
            aria-label={
              playing
                ? t('Пауза', 'Pause')
                : t('Слушать', 'Play')
            }
            disabled={loading}
          >
            {playing ? (
              <Pause strokeWidth={2} aria-hidden="true" />
            ) : (
              <Play strokeWidth={2} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className="quran-player__btn"
            onClick={nextAyah}
            aria-label={t('Следующий аят', 'Next ayah')}
            disabled={loading}
          >
            <SkipForward strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <span className="quran-player__ref" aria-live="polite">
          {surah != null && ayah != null ? `${surah}:${ayah}` : '—'}
        </span>

        <button
          type="button"
          className="quran-player__btn"
          onClick={close}
          aria-label={t('Закрыть плеер', 'Close player')}
        >
          <X strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      {loading && (
        <p className="quran-player__status">
          {t('Загрузка…', 'Loading…')}
        </p>
      )}
      {error && (
        <p className="quran-player__error">
          {t('Не удалось загрузить аудио', 'Could not load audio')}
          <button type="button" onClick={retry}>
            {t('Повторить', 'Retry')}
          </button>
        </p>
      )}
    </div>
  )
}
