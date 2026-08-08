import { useEffect } from 'react'
import {
  consumeListRestore,
  peekLastHadithAnchor,
  peekLastSurahAnchor,
  restoreListScroll,
} from '../utils/scrollMemory'

/**
 * Восстанавливает скролл только по явному флагу (клик в суру/хадис),
 * а не по navigationType === 'POP' — на первом заходе React Router тоже даёт POP.
 */
export function useRestoreListScroll(
  path: string,
  ready: boolean,
  anchorId?: string | null,
) {
  useEffect(() => {
    if (!ready) return
    if (!consumeListRestore(path)) return
    const anchor =
      anchorId ??
      (path === '/' || path === '/quran'
        ? peekLastSurahAnchor()
        : path === '/hadith' || /^\/hadith\/[^/]+$/.test(path)
          ? peekLastHadithAnchor(path)
          : null)
    return restoreListScroll(path, anchor)
  }, [ready, path, anchorId])
}
