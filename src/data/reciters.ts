export type Reciter = {
  id: number
  nameRu: string
  nameEn: string
}

export const RECITERS: Reciter[] = [
  {
    id: 4,
    nameRu: 'Абу Бакр аш-Шатри',
    nameEn: 'Abu Bakr ash-Shatri',
  },
  {
    id: 7,
    nameRu: 'Мишари Аль-Афаси',
    nameEn: 'Mishary Al-Afasy',
  },
]

export const DEFAULT_RECITER_ID = 7

export function getReciter(id: number): Reciter {
  return (
    RECITERS.find((r) => r.id === id) ??
    RECITERS.find((r) => r.id === DEFAULT_RECITER_ID) ??
    RECITERS[0]
  )
}

/** Same-origin chapter audio (proxied). */
export function localChapterAudioPath(reciterId: number, surah: number) {
  const q = new URLSearchParams({
    reciter: String(reciterId),
    surah: String(surah),
  })
  return `/api/quran-audio?${q.toString()}`
}
