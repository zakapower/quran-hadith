'use client'

import { useLayoutEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

function fromReaderToList(from: string, to: string) {
  if ((to === '/' || to === '/quran') && /^\/quran\/\d+/.test(from)) return true
  if (to === '/hadith' && /^\/hadith\/[^/]+/.test(from)) return true
  if (
    /^\/hadith\/[^/]+$/.test(to) &&
    /^\/hadith\/[^/]+\/[^/]+$/.test(from)
  ) {
    return true
  }
  return false
}

/**
 * При смене маршрута — наверх.
 * Исключение: возврат из читалки на список (там scrollMemory списка).
 */
export function ScrollToTop() {
  const pathname = usePathname()
  const prevPath = useRef(pathname)

  useLayoutEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
  }, [])

  useLayoutEffect(() => {
    const from = prevPath.current
    prevPath.current = pathname
    if (fromReaderToList(from, pathname)) return
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
