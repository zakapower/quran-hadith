import { useEffect } from 'react'
import {
  findReadingAnchorId,
  restoreReaderAnchor,
  saveReaderAnchor,
} from '../utils/scrollMemory'

/**
 * Помнит, до какого аята/хадиса доскроллили, и восстанавливает при возврате.
 * `skip` — например, когда в URL задан ?a=...
 */
export function useReaderScrollMemory(
  path: string | null,
  ready: boolean,
  skip = false,
) {
  useEffect(() => {
    if (!path || !ready || skip) return

    const persist = () => {
      const id = findReadingAnchorId()
      if (id) saveReaderAnchor(path, id)
    }

    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        persist()
        ticking = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('pointerdown', persist, true)
    window.addEventListener('pagehide', persist)

    return () => {
      persist()
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('pointerdown', persist, true)
      window.removeEventListener('pagehide', persist)
    }
  }, [path, ready, skip])

  useEffect(() => {
    if (!path || !ready || skip) return
    return restoreReaderAnchor(path)
  }, [path, ready, skip])
}
