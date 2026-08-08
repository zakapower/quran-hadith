import { useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * На новых переходах (PUSH/REPLACE) поднимает страницу вверх.
 * Возврат к спискам обрабатывают сами страницы через scrollMemory.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()
  const prevPath = useRef(pathname)
  const isFirst = useRef(true)

  useLayoutEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
  }, [])

  useLayoutEffect(() => {
    const from = prevPath.current
    prevPath.current = pathname

    if (isFirst.current) {
      isFirst.current = false
      window.scrollTo(0, 0)
      return
    }

    // Назад / вперёд — позицию восстанавливает целевая страница
    if (navigationType === 'POP') return

    // Возврат со суры/хадиса на список по ссылке — тоже не сбрасываем
    const toList =
      (pathname === '/' ||
        pathname === '/quran' ||
        pathname === '/hadith' ||
        /^\/hadith\/[^/]+$/.test(pathname)) &&
      (from.startsWith('/quran/') || from.startsWith('/hadith/'))
    if (toList) return

    window.scrollTo(0, 0)
  }, [pathname, navigationType])

  return null
}
