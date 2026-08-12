'use client'

import { useCallback, useSyncExternalStore } from 'react'
import {
  getFavoritesSnapshot,
  getServerFavoritesSnapshot,
  subscribeFavorites,
  toggleAyahFavorite,
  toggleHadithFavorite,
  type FavoritesStore,
} from '@/utils/favorites'

export function useFavoritesStore(): FavoritesStore {
  return useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    getServerFavoritesSnapshot,
  )
}

export function useAyahFavorite(surah: number, ayah: number) {
  const store = useFavoritesStore()
  const active = store.ayahs.some((a) => a.surah === surah && a.ayah === ayah)
  const toggle = useCallback(
    (snippet: string) => toggleAyahFavorite({ surah, ayah, snippet }),
    [surah, ayah],
  )
  return { active, toggle }
}

export function useHadithFavorite(
  bookId: string,
  sectionId: string,
  number: number,
) {
  const store = useFavoritesStore()
  const active = store.hadiths.some(
    (h) =>
      h.bookId === bookId && h.sectionId === sectionId && h.number === number,
  )
  const toggle = useCallback(
    (bookTitle: string, snippet: string) =>
      toggleHadithFavorite({ bookId, sectionId, number, bookTitle, snippet }),
    [bookId, sectionId, number],
  )
  return { active, toggle }
}
