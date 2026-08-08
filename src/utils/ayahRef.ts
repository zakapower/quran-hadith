export type AyahRef = {
  surah: number
  from: number
  to: number
}

/** Разбор «2:2» или «2:2-6». */
export function parseAyahRef(input: string): AyahRef | null {
  const m = input
    .trim()
    .match(/^(\d{1,3})\s*:\s*(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?$/)
  if (!m) return null

  const surah = Number(m[1])
  let from = Number(m[2])
  let to = m[3] ? Number(m[3]) : from

  if (!Number.isFinite(surah) || !Number.isFinite(from) || !Number.isFinite(to)) {
    return null
  }
  if (surah < 1 || surah > 114 || from < 1 || to < 1) return null
  if (to < from) [from, to] = [to, from]

  return { surah, from, to }
}

export function formatAyahRef(ref: AyahRef) {
  return ref.from === ref.to
    ? `${ref.surah}:${ref.from}`
    : `${ref.surah}:${ref.from}-${ref.to}`
}

export function ayahRefPath(ref: AyahRef) {
  const a = ref.from === ref.to ? String(ref.from) : `${ref.from}-${ref.to}`
  return `/quran/${ref.surah}?a=${a}`
}

/** Параметр ?a=2 или ?a=2-6 */
export function parseAyahParam(value: string | null): { from: number; to: number } | null {
  if (!value) return null
  const m = value.trim().match(/^(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?$/)
  if (!m) return null
  let from = Number(m[1])
  let to = m[2] ? Number(m[2]) : from
  if (!Number.isFinite(from) || !Number.isFinite(to) || from < 1 || to < 1) {
    return null
  }
  if (to < from) [from, to] = [to, from]
  return { from, to }
}
