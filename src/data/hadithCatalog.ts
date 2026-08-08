import type { HadithCollectionMeta } from './types'

export const hadithCollections: HadithCollectionMeta[] = [
  {
    id: 'bukhari',
    title: {
      ru: 'Сахих аль-Бухари',
      en: 'Sahih al-Bukhari',
    },
    narrator: {
      ru: 'Имам аль-Бухари',
      en: 'Imam al-Bukhari',
    },
    apiBook: 'bukhari',
    hadithCount: 7557,
    editions: {
      ar: 'ara-bukhari',
      en: 'eng-bukhari',
      ru: 'rus-bukhari',
    },
  },
  {
    id: 'muslim',
    title: {
      ru: 'Сахих Муслим',
      en: 'Sahih Muslim',
    },
    narrator: {
      ru: 'Имам Муслим',
      en: 'Imam Muslim',
    },
    apiBook: 'muslim',
    hadithCount: 16041,
    editions: {
      ar: 'ara-muslim',
      en: 'eng-muslim',
      ru: 'rus-muslim',
    },
  },
]

export function getHadithCollection(id: string) {
  return hadithCollections.find((c) => c.id === id)
}
