export type Lang = 'ru' | 'en'

export interface SurahMeta {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: string
}

export interface Ayah {
  number: number
  numberInSurah: number
  text: string
}

export interface SurahContent {
  number: number
  name: string
  englishName: string
  ayahsArabic: Ayah[]
  ayahsTranslation: Ayah[]
}

export interface HadithItem {
  id: string
  number: number
  arabic?: string
  text: { ru: string; en: string }
}

export interface HadithBook {
  id: string
  title: { ru: string; en: string }
  narrator: { ru: string; en: string }
  hadiths: HadithItem[]
}
