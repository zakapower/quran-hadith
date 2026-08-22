/**
 * Fetches hadith-api info.min.json and writes src/data/hadithSectionsMeta.ts.
 * Run: node scripts/generate-hadith-sections-meta.mjs
 */

import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const INFO_URL =
  'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/info.min.json'

const BOOKS = [
  'bukhari',
  'muslim',
  'abudawud',
  'tirmidhi',
  'nasai',
  'ibnmajah',
]

const res = await fetch(INFO_URL)
if (!res.ok) throw new Error(`Failed to fetch info: ${res.status}`)
const info = await res.json()

/** @type {Record<string, Array<{ id: string; number: number; en: string; hadithFirst: number; hadithLast: number }>>} */
const out = {}

for (const bookId of BOOKS) {
  const meta = info[bookId]?.metadata
  const sections = meta?.sections ?? {}
  const details = meta?.section_details ?? {}

  out[bookId] = Object.entries(sections)
    .map(([id, name]) => {
      const number = Number(id)
      const detail = details[id]
      const hadithFirst = detail?.hadithnumber_first ?? 0
      const hadithLast = detail?.hadithnumber_last ?? 0
      return {
        id,
        number,
        en: name || `${number}`,
        hadithFirst,
        hadithLast,
      }
    })
    .filter((s) => s.number > 0 && s.en.trim().length > 0)
    .sort((a, b) => a.number - b.number)
}

const body = `/** Static chapter metadata from fawazahmed0/hadith-api — avoids info.min.json at runtime. */
/** Regenerate: node scripts/generate-hadith-sections-meta.mjs */

export type HadithSectionStatic = {
  id: string
  number: number
  en: string
  hadithFirst: number
  hadithLast: number
}

export const hadithSectionsMeta: Record<string, HadithSectionStatic[]> = ${JSON.stringify(out, null, 2)}

export function getHadithSectionsStatic(bookId: string): HadithSectionStatic[] | null {
  return hadithSectionsMeta[bookId] ?? null
}

export function allHadithSectionPathParams(): Array<{ id: string; sectionId: string }> {
  const params: Array<{ id: string; sectionId: string }> = []
  for (const [id, sections] of Object.entries(hadithSectionsMeta)) {
    for (const s of sections) {
      params.push({ id, sectionId: s.id })
    }
  }
  return params
}
`

const target = join(__dirname, '../src/data/hadithSectionsMeta.ts')
writeFileSync(target, body, 'utf-8')

const total = Object.values(out).reduce((n, arr) => n + arr.length, 0)
console.log(`Wrote ${target} (${total} sections across ${BOOKS.length} books)`)
