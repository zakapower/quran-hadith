import type { MetadataRoute } from 'next'
import { hadithCollections } from '@/data/hadithCatalog'
import { allHadithSectionPaths } from '@/lib/ssg'
import { getSiteOrigin } from '@/lib/site'

const STATIC_PATHS = ['/', '/quran', '/hadith', '/favorites', '/about'] as const

function entry(
  origin: string,
  path: string,
  priority: number,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] = 'weekly',
): MetadataRoute.Sitemap[number] {
  const url = path === '/' ? origin : `${origin}${path}`
  return {
    url,
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: {
      languages: {
        ru: `${url}${path === '/' ? '/?lang=ru' : '?lang=ru'}`,
        en: `${url}${path === '/' ? '/?lang=en' : '?lang=en'}`,
      },
    },
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin()
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) =>
    entry(origin, path, path === '/' ? 1 : 0.8),
  )

  for (let n = 1; n <= 114; n++) {
    entries.push(entry(origin, `/quran/${n}`, 0.7, 'monthly'))
  }

  for (const book of hadithCollections) {
    entries.push(entry(origin, `/hadith/${book.id}`, 0.75, 'monthly'))
  }

  const sections = await allHadithSectionPaths()
  for (const { id, sectionId } of sections) {
    entries.push(
      entry(origin, `/hadith/${id}/${sectionId}`, 0.6, 'monthly'),
    )
  }

  return entries
}
