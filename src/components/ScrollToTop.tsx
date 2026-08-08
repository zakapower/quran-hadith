'use client'

import { useLayoutEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * На новых переходах поднимает страницу вверх.
 * Возврат к спискам обрабатывают сами страницы через scrollMemory.
 * POP (назад/вперёд) отслеживается через popstate.
 */
export function ScrollToTop() {
  const pathname = usePathname()
  const prevPath = useRef(pathname)
  const isFirst = useRef(true)
  const isPop = useRef(false)

  useLayoutEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    const onPopState = () => {
      isPop.current = true
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useLayoutEffect(() => {
    const from = prevPath.current
    prevPath.current = pathname

    if (isFirst.current) {
      isFirst.current = false
      window.scrollTo(0, 0)
      return
    }

    if (isPop.current) {
      isPop.current = false
      return
    }

    // Возврат со суры/хадиса на список по ссылке — не сбрасываем
    const toList =
      (pathname === '/' ||
        pathname === '/quran' ||
        pathname === '/hadith' ||
        /^\/hadith\/[^/]+$/.test(pathname)) &&
      (from.startsWith('/quran/') || from.startsWith('/hadith/'))
    if (toList) return

    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
