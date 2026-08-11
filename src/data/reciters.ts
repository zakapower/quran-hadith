export type Reciter = {
  id: number
  nameRu: string
  nameEn: string
  /** everyayah.com folder under /data/ */
  everyayahFolder: string
}

export const RECITERS: Reciter[] = [
  {
    id: 4,
    nameRu: 'Абу Бакр аш-Шатри',
    nameEn: 'Abu Bakr ash-Shatri',
    everyayahFolder: 'Abu_Bakr_Ash-Shaatree_128kbps',
  },
  {
    id: 7,
    nameRu: 'Мишари Аль-Афаси',
    nameEn: 'Mishary Al-Afasy',
    everyayahFolder: 'Alafasy_128kbps',
  },
]

export const DEFAULT_RECITER_ID = 7

export function getReciter(id: number): Reciter {
  return RECITERS.find((r) => r.id === id) ?? RECITERS[0]
}

export function pad3(n: number) {
  return String(n).padStart(3, '0')
}

/** Direct CDN URL (server-side / tooling). Browser should use `/api/quran-audio`. */
export function everyayahUrl(reciterId: number, surah: number, ayah: number) {
  const folder = getReciter(reciterId).everyayahFolder
  return `https://everyayah.com/data/${folder}/${pad3(surah)}${pad3(ayah)}.mp3`
}

export function localAyahAudioPath(
  reciterId: number,
  surah: number,
  ayah: number,
) {
  const q = new URLSearchParams({
    reciter: String(reciterId),
    surah: String(surah),
    ayah: String(ayah),
  })
  return `/api/quran-audio?${q.toString()}`
}
