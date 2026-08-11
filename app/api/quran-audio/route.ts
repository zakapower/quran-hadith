import { NextRequest, NextResponse } from 'next/server'
import { everyayahUrl, getReciter } from '@/data/reciters'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const reciter = Number(req.nextUrl.searchParams.get('reciter'))
  const surah = Number(req.nextUrl.searchParams.get('surah'))
  const ayah = Number(req.nextUrl.searchParams.get('ayah'))

  if (
    !Number.isFinite(reciter) ||
    !Number.isFinite(surah) ||
    !Number.isFinite(ayah) ||
    surah < 1 ||
    surah > 114 ||
    ayah < 1 ||
    ayah > 286
  ) {
    return NextResponse.json({ error: 'bad params' }, { status: 400 })
  }

  // Validate known reciter
  getReciter(reciter)

  const upstream = everyayahUrl(reciter, surah, ayah)
  const range = req.headers.get('range')

  try {
    const res = await fetch(upstream, {
      headers: range ? { Range: range } : undefined,
      // Cache at the edge/server a bit; browser still gets our Cache-Control.
      next: { revalidate: 86400 },
    })

    if (!res.ok || !res.body) {
      return NextResponse.json(
        { error: 'upstream failed', status: res.status },
        { status: 502 },
      )
    }

    const headers = new Headers()
    headers.set('Content-Type', res.headers.get('Content-Type') || 'audio/mpeg')
    headers.set('Cache-Control', 'public, max-age=86400, immutable')
    headers.set('Accept-Ranges', 'bytes')
    const len = res.headers.get('Content-Length')
    if (len) headers.set('Content-Length', len)
    const cr = res.headers.get('Content-Range')
    if (cr) headers.set('Content-Range', cr)

    return new NextResponse(res.body, {
      status: res.status,
      headers,
    })
  } catch {
    return NextResponse.json({ error: 'proxy failed' }, { status: 502 })
  }
}
