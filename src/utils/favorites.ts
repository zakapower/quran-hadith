export type FavoriteAyah = {
  surah: number
  ayah: number
  snippet: string
  addedAt: number
}

export type FavoriteHadith = {
  bookId: string
  sectionId: string
  number: number
  bookTitle: string
  snippet: string
  addedAt: number
}

export type FavoritesStore = {
  ayahs: FavoriteAyah[]
  hadiths: FavoriteHadith[]
}

const KEY = 'tilawah-favorites-v1'
const MAX = 200
const EVENT = 'tilawah-favorites'

const empty: FavoritesStore = { ayahs: [], hadiths: [] }

function canUseStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

function emit() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(EVENT))
}

function truncate(text: string, max = 180) {
  const t = text.trim().replace(/\s+/g, ' ')
  if (t.length <= max) return t
  return `${t.slice(0, max - 1).trimEnd()}…`
}

function readRaw(): FavoritesStore {
  if (!canUseStorage()) return empty
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw) as Partial<FavoritesStore>
    return {
      ayahs: Array.isArray(parsed.ayahs) ? parsed.ayahs : [],
      hadiths: Array.isArray(parsed.hadiths) ? parsed.hadiths : [],
    }
  } catch {
    return empty
  }
}

function writeRaw(store: FavoritesStore) {
  if (!canUseStorage()) return
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    /* quota */
  }
  emit()
}

let cache: FavoritesStore | null = null

export function getFavoritesSnapshot(): FavoritesStore {
  if (!cache) cache = readRaw()
  return cache
}

export function getServerFavoritesSnapshot(): FavoritesStore {
  return empty
}

export function subscribeFavorites(onChange: () => void) {
  if (typeof window === 'undefined') return () => {}
  const handler = () => {
    cache = readRaw()
    onChange()
  }
  window.addEventListener(EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

function ayahKey(surah: number, ayah: number) {
  return `${surah}:${ayah}`
}

function hadithKey(bookId: string, sectionId: string, number: number) {
  return `${bookId}:${sectionId}:${number}`
}

export function isAyahFavorite(surah: number, ayah: number) {
  return getFavoritesSnapshot().ayahs.some(
    (a) => a.surah === surah && a.ayah === ayah,
  )
}

export function isHadithFavorite(
  bookId: string,
  sectionId: string,
  number: number,
) {
  return getFavoritesSnapshot().hadiths.some(
    (h) =>
      h.bookId === bookId && h.sectionId === sectionId && h.number === number,
  )
}

export function toggleAyahFavorite(opts: {
  surah: number
  ayah: number
  snippet: string
}) {
  const store = { ...getFavoritesSnapshot() }
  const i = store.ayahs.findIndex(
    (a) => a.surah === opts.surah && a.ayah === opts.ayah,
  )
  if (i >= 0) {
    store.ayahs = store.ayahs.filter((_, idx) => idx !== i)
  } else {
    store.ayahs = [
      {
        surah: opts.surah,
        ayah: opts.ayah,
        snippet: truncate(opts.snippet),
        addedAt: Date.now(),
      },
      ...store.ayahs,
    ].slice(0, MAX)
  }
  cache = store
  writeRaw(store)
  return i < 0
}

export function toggleHadithFavorite(opts: {
  bookId: string
  sectionId: string
  number: number
  bookTitle: string
  snippet: string
}) {
  const store = { ...getFavoritesSnapshot() }
  const i = store.hadiths.findIndex(
    (h) =>
      h.bookId === opts.bookId &&
      h.sectionId === opts.sectionId &&
      h.number === opts.number,
  )
  if (i >= 0) {
    store.hadiths = store.hadiths.filter((_, idx) => idx !== i)
  } else {
    store.hadiths = [
      {
        bookId: opts.bookId,
        sectionId: opts.sectionId,
        number: opts.number,
        bookTitle: opts.bookTitle,
        snippet: truncate(opts.snippet),
        addedAt: Date.now(),
      },
      ...store.hadiths,
    ].slice(0, MAX)
  }
  cache = store
  writeRaw(store)
  return i < 0
}

export function removeAyahFavorite(surah: number, ayah: number) {
  if (!isAyahFavorite(surah, ayah)) return
  toggleAyahFavorite({ surah, ayah, snippet: '' })
}

export function removeHadithFavorite(
  bookId: string,
  sectionId: string,
  number: number,
) {
  if (!isHadithFavorite(bookId, sectionId, number)) return
  toggleHadithFavorite({
    bookId,
    sectionId,
    number,
    bookTitle: '',
    snippet: '',
  })
}

export { ayahKey, hadithKey }
