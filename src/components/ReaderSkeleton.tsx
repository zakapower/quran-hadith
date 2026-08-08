import './ReaderSkeleton.css'

type ReaderSkeletonVariant = 'surah' | 'hadith' | 'chapters'

const LINE_WIDTHS = ['92%', '78%', '88%', '70%', '84%'] as const
const AR_WIDTHS = ['100%', '94%', '100%', '86%', '98%'] as const
const CHAPTER_WIDTHS = ['72%', '64%', '80%', '58%', '76%', '68%', '74%', '62%'] as const

type Props = {
  variant?: ReaderSkeletonVariant
  label: string
}

export function ReaderSkeleton({ variant = 'hadith', label }: Props) {
  const isChapters = variant === 'chapters'
  const isSurah = variant === 'surah'
  const count = isChapters ? 8 : 5

  return (
    <div
      className={`reader-skel reader-skel--${variant}`}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{label}</span>

      {!isChapters && (
        <header className="reader-skel__head" aria-hidden="true">
          {isSurah && <div className="reader-skel__bone reader-skel__ar-title" />}
          <div className="reader-skel__bone reader-skel__title" />
          {!isSurah && <div className="reader-skel__bone reader-skel__sub" />}
        </header>
      )}

      <div className="reader-skel__list" aria-hidden="true">
        {Array.from({ length: count }, (_, i) =>
          isChapters ? (
            <div key={i} className="reader-skel__chapter">
              <div className="reader-skel__bone reader-skel__num" />
              <div className="reader-skel__chapter-body">
                <div
                  className="reader-skel__bone reader-skel__line"
                  style={{ width: CHAPTER_WIDTHS[i % CHAPTER_WIDTHS.length] }}
                />
                <div
                  className="reader-skel__bone reader-skel__line reader-skel__line--sm"
                  style={{ width: '42%' }}
                />
              </div>
            </div>
          ) : isSurah ? (
            <div key={i} className="reader-skel__card reader-skel__card--ayah">
              <div className="reader-skel__card-top">
                <div className="reader-skel__bone reader-skel__badge" />
                <div className="reader-skel__bone reader-skel__icon" />
              </div>
              <div className="reader-skel__ayah-ar">
                <div
                  className="reader-skel__bone reader-skel__line reader-skel__line--ar"
                  style={{ width: AR_WIDTHS[i % AR_WIDTHS.length] }}
                />
                <div
                  className="reader-skel__bone reader-skel__line reader-skel__line--ar"
                  style={{ width: AR_WIDTHS[(i + 2) % AR_WIDTHS.length] }}
                />
              </div>
              <div
                className="reader-skel__bone reader-skel__line reader-skel__line--tr"
                style={{ width: LINE_WIDTHS[i % LINE_WIDTHS.length] }}
              />
            </div>
          ) : (
            <div key={i} className="reader-skel__card">
              <div className="reader-skel__card-top">
                <div className="reader-skel__bone reader-skel__badge" />
                <div className="reader-skel__bone reader-skel__icon" />
              </div>
              <div
                className="reader-skel__bone reader-skel__line"
                style={{ width: LINE_WIDTHS[i % LINE_WIDTHS.length] }}
              />
              <div
                className="reader-skel__bone reader-skel__line reader-skel__line--sm"
                style={{ width: LINE_WIDTHS[(i + 2) % LINE_WIDTHS.length] }}
              />
            </div>
          ),
        )}
      </div>
    </div>
  )
}
