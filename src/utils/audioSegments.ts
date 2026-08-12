export type WordSegment = {
  wordIndex: number
  startMs: number
  endMs: number
}

export type AyahTiming = {
  verseKey: string
  ayah: number
  fromMs: number
  toMs: number
  segments: WordSegment[]
}

/** Accepts API tuples like [wordIndex, startMs, endMs]; drops malformed. */
export function normalizeSegments(raw: unknown[]): WordSegment[] {
  const out: WordSegment[] = []
  for (const item of raw) {
    if (!Array.isArray(item) || item.length < 3) continue
    const wordIndex = Number(item[0])
    const startMs = Number(item[1])
    const endMs = Number(item[2])
    if (![wordIndex, startMs, endMs].every(Number.isFinite)) continue
    if (endMs <= startMs) continue
    out.push({ wordIndex, startMs, endMs })
  }
  return out
}

export function findActiveWordIndex(
  segments: WordSegment[],
  tMs: number,
): number | null {
  let lastStarted: number | null = null
  for (const s of segments) {
    if (tMs >= s.startMs && tMs < s.endMs) return s.wordIndex
    // Gaps between words: keep the last word that already started
    if (tMs >= s.startMs) lastStarted = s.wordIndex
  }
  return lastStarted
}

export function parseVerseKeyAyah(verseKey: string): number {
  const n = Number(verseKey.split(':')[1])
  return Number.isFinite(n) ? n : 0
}

export function findAyahIndexByTime(
  timestamps: AyahTiming[],
  tMs: number,
): number {
  if (timestamps.length === 0) return 0
  for (let i = 0; i < timestamps.length; i++) {
    const row = timestamps[i]
    if (tMs >= row.fromMs && tMs < row.toMs) return i
  }
  if (tMs >= timestamps[timestamps.length - 1].toMs) {
    return timestamps.length - 1
  }
  return 0
}
