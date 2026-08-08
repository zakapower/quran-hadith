import { useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const scrollPositions = new Map<string, number>()

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
    const onScroll = () => {
      scrollPositions.set(pathname, window.scrollY)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  useLayoutEffect(() => {
    const from = prevPath.current
    prevPath.current = pathname

    if (isFirst.current) {
      isFirst.current = false
      window.scrollTo(0, 0)
      return
    }

    const backToList =
      (pathname === '/quran' || pathname === '/hadith') &&
      (navigationType === 'POP' ||
        from.startsWith('/quran/') ||
        from.startsWith('/hadith/'))

    if (backToList) {
      window.scrollTo(0, scrollPositions.get(pathname) ?? 0)
      return
    }

    if (navigationType === 'POP') {
      window.scrollTo(0, scrollPositions.get(pathname) ?? 0)
      return
    }

    window.scrollTo(0, 0)
  }, [pathname, navigationType])

  return null
}
