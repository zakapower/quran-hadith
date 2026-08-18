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
  {
    id: 'abudawud',
    title: {
      ru: 'Сунан Абу Дауд',
      en: 'Sunan Abu Dawud',
    },
    narrator: {
      ru: 'Имам Абу Дауд',
      en: 'Imam Abu Dawud',
    },
    apiBook: 'abudawud',
    hadithCount: 5274,
    editions: {
      ar: 'ara-abudawud',
      en: 'eng-abudawud',
      ru: 'rus-abudawud',
    },
  },
  {
    id: 'tirmidhi',
    title: {
      ru: 'Сунан ат-Тирмизи',
      en: 'Sunan at-Tirmidhi',
    },
    narrator: {
      ru: 'Имам ат-Тирмизи',
      en: 'Imam at-Tirmidhi',
    },
    apiBook: 'tirmidhi',
    hadithCount: 3956,
    editions: {
      ar: 'ara-tirmidhi',
      en: 'eng-tirmidhi',
    },
  },
  {
    id: 'nasai',
    title: {
      ru: 'Сунан ан-Насаи',
      en: 'Sunan an-Nasa’i',
    },
    narrator: {
      ru: 'Имам ан-Насаи',
      en: 'Imam an-Nasa’i',
    },
    apiBook: 'nasai',
    hadithCount: 5758,
    editions: {
      ar: 'ara-nasai',
      en: 'eng-nasai',
    },
  },
  {
    id: 'ibnmajah',
    title: {
      ru: 'Сунан ибн Маджа',
      en: 'Sunan Ibn Majah',
    },
    narrator: {
      ru: 'Имам ибн Маджа',
      en: 'Imam Ibn Majah',
    },
    apiBook: 'ibnmajah',
    hadithCount: 4341,
    editions: {
      ar: 'ara-ibnmajah',
      en: 'eng-ibnmajah',
    },
  },
]

export function getHadithCollection(id: string) {
  return hadithCollections.find((c) => c.id === id)
}
