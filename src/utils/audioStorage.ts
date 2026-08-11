const ROOT = 'tilawah-audio-v1'
const RECITER_KEY = `${ROOT}:reciter`
const LAST_KEY = `${ROOT}:lastAyah`

export function readReciterId(fallback: number): number {
  try {
    const raw = localStorage.getItem(RECITER_KEY)
    if (raw == null) return fallback
    const n = Number(raw)
    return Number.isFinite(n) ? n : fallback
  } catch {
    return fallback
  }
}

export function writeReciterId(id: number) {
  try {
    localStorage.setItem(RECITER_KEY, String(id))
  } catch {
    /* ignore */
  }
}

export function readLastAyah(surah: number): number | null {
  try {
    const raw = localStorage.getItem(LAST_KEY)
    if (!raw) return null
    const map = JSON.parse(raw) as Record<string, number>
    const n = map[String(surah)]
    return Number.isFinite(n) && n >= 1 ? n : null
  } catch {
    return null
  }
}

export function writeLastAyah(surah: number, ayah: number) {
  try {
    const raw = localStorage.getItem(LAST_KEY)
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {}
    map[String(surah)] = ayah
    localStorage.setItem(LAST_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}
