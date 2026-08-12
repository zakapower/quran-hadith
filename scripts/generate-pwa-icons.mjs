// One-shot: node scripts/generate-pwa-icons.mjs
// Uses sharp (available via next's dependency tree).
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const sharp = require('sharp')

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'public', 'icons')
const svgPath = path.join(root, 'public', 'favicon.svg')

await mkdir(outDir, { recursive: true })
const svg = await readFile(svgPath)

async function writePng(name, size, { padded = false } = {}) {
  const side = size
  if (!padded) {
    await sharp(svg)
      .resize(side, side, { fit: 'contain', background: '#2f5d4a' })
      .png()
      .toFile(path.join(outDir, name))
    return
  }
  const inner = Math.round(side * 0.8)
  const pad = Math.round((side - inner) / 2)
  const innerBuf = await sharp(svg)
    .resize(inner, inner, { fit: 'contain', background: '#2f5d4a' })
    .png()
    .toBuffer()
  await sharp({
    create: { width: side, height: side, channels: 4, background: '#2f5d4a' },
  })
    .composite([{ input: innerBuf, left: pad, top: pad }])
    .png()
    .toFile(path.join(outDir, name))
}

await writePng('icon-192.png', 192)
await writePng('icon-512.png', 512)
await writePng('icon-maskable-512.png', 512, { padded: true })
console.log('Wrote public/icons/*.png')
