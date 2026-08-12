import { NextResponse, type NextRequest } from 'next/server'
import { LANG_COOKIE, resolveLang } from './src/lib/lang'

export function middleware(request: NextRequest) {
  const queryLang = request.nextUrl.searchParams.get('lang')
  const cookieLang = request.cookies.get(LANG_COOKIE)?.value
  const acceptLanguage = request.headers.get('accept-language')
  const lang = resolveLang({ queryLang, cookieLang, acceptLanguage })

  const response = NextResponse.next()
  const existing = request.cookies.get(LANG_COOKIE)?.value
  if (existing !== lang) {
    response.cookies.set(LANG_COOKIE, lang, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  }
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|fonts|favicon\\.svg|favicon-dark\\.svg|favicon-light\\.svg|icons/|sw\\.js$|swe-worker).*)',
  ],
}
