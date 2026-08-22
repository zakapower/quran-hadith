import { fetchHadithSections } from '@/api/hadith'
import { hadithCollections } from '@/data/hadithCatalog'

/** ISR window for on-demand hadith chapters (24 h). */
export const SSG_REVALIDATE_SECONDS = 86400

/** Prefetch early chapters per book at build time — keeps Vercel builds small. */
export const HADITH_SECTION_PREFETCH = 8

export function quranStaticParams() {
  return Array.from({ length: 114 }, (_, i) => ({ number: String(i + 1) }))
}

export function hadithBookStaticParams() {
  return hadithCollections.map((b) => ({ id: b.id }))
}

export async function hadithSectionStaticParams() {
  const params: Array<{ id: string; sectionId: string }> = []
  for (const book of hadithCollections) {
    try {
      const sections = await fetchHadithSections(book.id, 'en')
      for (const s of sections.slice(0, HADITH_SECTION_PREFETCH)) {
        params.push({ id: book.id, sectionId: s.id })
      }
    } catch {
      /* skip book when CDN is unreachable during build */
    }
  }
  return params
}

/** All hadith section paths for sitemap (no content fetch). */
export async function allHadithSectionPaths(): Promise<
  Array<{ id: string; sectionId: string }>
> {
  const params: Array<{ id: string; sectionId: string }> = []
  for (const book of hadithCollections) {
    try {
      const sections = await fetchHadithSections(book.id, 'en')
      for (const s of sections) {
        params.push({ id: book.id, sectionId: s.id })
      }
    } catch {
      /* skip */
    }
  }
  return params
}

/** Load data for both languages in parallel; skips failed fetches. */
export async function loadBothLangs<T>(
  load: (lang: 'ru' | 'en') => Promise<T | null>,
): Promise<Partial<Record<'ru' | 'en', T>>> {
  const [ru, en] = await Promise.all([load('ru'), load('en')])
  return {
    ...(ru ? { ru } : {}),
    ...(en ? { en } : {}),
  }
}
