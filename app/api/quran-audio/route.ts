import { NextRequest, NextResponse } from 'next/server'
import { getReciter } from '@/data/reciters'
import { resolveChapterAudioUrl } from '@/api/quranAudio'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const reciter = Number(req.nextUrl.searchParams.get('reciter'))
  const surah = Number(req.nextUrl.searchParams.get('surah'))

  if (
    !Number.isFinite(reciter) ||
    !Number.isFinite(surah) ||
    surah < 1 ||
    surah > 114
  ) {
    return NextResponse.json({ error: 'bad params' }, { status: 400 })
  }

  getReciter(reciter)

  let upstream: string
  try {
    upstream = await resolveChapterAudioUrl(reciter, surah)
  } catch {
    return NextResponse.json({ error: 'resolve failed' }, { status: 502 })
  }

  const range = req.headers.get('range')

  try {
    const res = await fetch(upstream, {
      headers: range ? { Range: range } : undefined,
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
