import type { MetadataRoute } from 'next'
import { getSiteOrigin } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin()
  const staticPaths = ['/', '/quran', '/hadith'] as const
  const now = new Date()

  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${origin}${path === '/' ? '' : path}` || origin,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: path === '/' ? 1 : 0.8,
    alternates: {
      languages: {
        ru: `${origin}${path === '/' ? '' : path}?lang=ru`,
        en: `${origin}${path === '/' ? '' : path}?lang=en`,
      },
    },
  }))

  entries[0] = {
    ...entries[0],
    url: origin,
    alternates: {
      languages: {
        ru: `${origin}/?lang=ru`,
        en: `${origin}/?lang=en`,
      },
    },
  }

  return entries
}
