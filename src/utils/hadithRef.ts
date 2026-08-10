import type { HadithSectionMeta } from '@/data/types'

/** Разбор номера хадиса: «756». */
export function parseHadithNumber(input: string): number | null {
  const m = input.trim().match(/^(\d{1,5})$/)
  if (!m) return null
  const n = Number(m[1])
  if (!Number.isFinite(n) || n < 1) return null
  return n
}

/** Параметр ?h=756 */
export function parseHadithParam(value: string | null): number | null {
  return parseHadithNumber(value ?? '')
}

export function findSectionForHadith(
  sections: HadithSectionMeta[],
  n: number,
): HadithSectionMeta | null {
  return (
    sections.find(
      (s) => s.hadithFirst > 0 && n >= s.hadithFirst && n <= s.hadithLast,
    ) ?? null
  )
}

export function hadithRefPath(bookId: string, sectionId: string, n: number) {
  return `/hadith/${bookId}/${sectionId}?h=${n}`
}
