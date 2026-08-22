import { NextRequest, NextResponse } from 'next/server'
import { translateEnToRuManyDirect } from '@/lib/translateEnRu'

export const runtime = 'nodejs'

const MAX_BATCH = 40
const MAX_CHARS = 12000

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 })
  }

  const texts = (body as { texts?: unknown })?.texts
  if (!Array.isArray(texts) || texts.some((t) => typeof t !== 'string')) {
    return NextResponse.json({ error: 'texts required' }, { status: 400 })
  }
  if (texts.length === 0) {
    return NextResponse.json({ translations: [] })
  }
  if (texts.length > MAX_BATCH) {
    return NextResponse.json({ error: 'batch too large' }, { status: 400 })
  }
  const total = (texts as string[]).reduce((n, t) => n + t.length, 0)
  if (total > MAX_CHARS) {
    return NextResponse.json({ error: 'payload too large' }, { status: 400 })
  }

  try {
    const translations = await translateEnToRuManyDirect(texts as string[])
    return NextResponse.json({ translations })
  } catch {
    return NextResponse.json({ error: 'translate failed' }, { status: 502 })
  }
}
