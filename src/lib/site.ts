import type { Metadata } from 'next'

export function getSiteOrigin(): string {
  return (process.env.SITE_ORIGIN || 'https://example.com').replace(/\/$/, '')
}

export function clipDescription(text: string, max = 160): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trimEnd()}…`
}

export function pageAlternates(pathname: string): NonNullable<Metadata['alternates']> {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  return {
    canonical: path,
    languages: {
      ru: `${path}?lang=ru`,
      en: `${path}?lang=en`,
      'x-default': path,
    },
  }
}

/** Bypass Next.js 15.5 root-path query stripping when resolving alternates. */
export function pageAlternatesMetadataBase(pathname: string): Metadata['metadataBase'] | undefined {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  return path === '/' ? null : undefined
}
