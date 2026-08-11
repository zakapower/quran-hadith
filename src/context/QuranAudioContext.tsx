'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import { fetchChapterRecitation, fetchChapterWords } from '@/api/quranAudio'
import { DEFAULT_RECITER_ID, getReciter } from '@/data/reciters'
import {
  findActiveWordIndex,
  findAyahIndexByTime,
  type AyahTiming,
} from '@/utils/audioSegments'
import {
  readLastAyah,
  readReciterId,
  writeLastAyah,
  writeReciterId,
} from '@/utils/audioStorage'

type PlayTarget = { surah: number; ayah: number }

type QuranAudioApi = {
  visible: boolean
  playing: boolean
  loading: boolean
  error: string | null
  reciterId: number
  surah: number | null
  ayah: number | null
  activeWordIndex: number | null
  progress: number
  wordsByAyah: Map<number, string[]> | null
  openAndPlay: (opts: { surah: number; ayah?: number }) => void
  togglePause: () => void
  pause: () => void
  close: () => void
  nextAyah: () => void
  prevAyah: () => void
  setReciter: (id: number) => void
  retry: () => void
}

const QuranAudioContext = createContext<QuranAudioApi | null>(null)

function clampAyah(ayah: number, timestamps: AyahTiming[]) {
  if (timestamps.length === 0) return Math.max(1, ayah)
  const max = timestamps[timestamps.length - 1].ayah
  return Math.min(max, Math.max(1, ayah))
}

export function QuranAudioProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timestampsRef = useRef<AyahTiming[]>([])
  const targetRef = useRef<PlayTarget | null>(null)
  const loadGenRef = useRef(0)
  const loadedKeyRef = useRef<string | null>(null)

  const [visible, setVisible] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reciterId, setReciterIdState] = useState(DEFAULT_RECITER_ID)
  const [surah, setSurah] = useState<number | null>(null)
  const [ayah, setAyah] = useState<number | null>(null)
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [wordsByAyah, setWordsByAyah] = useState<Map<number, string[]> | null>(
    null,
  )
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setReciterIdState(readReciterId(DEFAULT_RECITER_ID))
    setHydrated(true)
  }, [])

  const pause = useCallback(() => {
    const audio = audioRef.current
    if (audio) audio.pause()
    setPlaying(false)
  }, [])

  const close = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
    }
    setPlaying(false)
    setVisible(false)
    setActiveWordIndex(null)
    setProgress(0)
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!visible || surah == null) return
    if (pathname !== `/quran/${surah}`) close()
  }, [pathname, surah, visible, close])

  const seekToAyah = useCallback(async (ayahNumber: number, autoplay: boolean) => {
    const audio = audioRef.current
    const timestamps = timestampsRef.current
    if (!audio || timestamps.length === 0) return

    const clamped = clampAyah(ayahNumber, timestamps)
    const row = timestamps.find((t) => t.ayah === clamped) ?? timestamps[0]
    const surahNum = targetRef.current?.surah
    if (surahNum != null) {
      targetRef.current = { surah: surahNum, ayah: row.ayah }
      writeLastAyah(surahNum, row.ayah)
    }
    setAyah(row.ayah)
    setActiveWordIndex(null)
    setProgress(0)

    const startSec = row.fromMs / 1000
    const apply = () => {
      audio.currentTime = startSec
    }
    if (audio.readyState >= 1) apply()
    else {
      await new Promise<void>((resolve) => {
        const onMeta = () => {
          audio.removeEventListener('loadedmetadata', onMeta)
          apply()
          resolve()
        }
        audio.addEventListener('loadedmetadata', onMeta)
      })
    }

    if (autoplay) {
      try {
        await audio.play()
        setPlaying(true)
        setError(null)
      } catch {
        setPlaying(false)
        setError('play-failed')
      }
    }
  }, [])

  const loadAndPlay = useCallback(
    async (opts: { surah: number; ayah: number; reciter: number }) => {
      const gen = ++loadGenRef.current
      setVisible(true)
      setLoading(true)
      setError(null)
      setSurah(opts.surah)
      setAyah(opts.ayah)
      targetRef.current = { surah: opts.surah, ayah: opts.ayah }
      writeLastAyah(opts.surah, opts.ayah)

      try {
        const [recitation, words] = await Promise.all([
          fetchChapterRecitation(opts.reciter, opts.surah),
          fetchChapterWords(opts.surah).catch(() => new Map<number, string[]>()),
        ])
        if (gen !== loadGenRef.current) return

        timestampsRef.current = recitation.timestamps
        setWordsByAyah(words)

        const audio = audioRef.current
        if (!audio) throw new Error('no-audio')

        const sourceKey = `${opts.reciter}:${opts.surah}`
        const needSrc = loadedKeyRef.current !== sourceKey
        if (needSrc) {
          audio.src = recitation.audioUrl
          loadedKeyRef.current = sourceKey
          await new Promise<void>((resolve, reject) => {
            const onCan = () => {
              cleanup()
              resolve()
            }
            const onErr = () => {
              cleanup()
              reject(new Error('audio-error'))
            }
            const cleanup = () => {
              audio.removeEventListener('canplay', onCan)
              audio.removeEventListener('error', onErr)
            }
            audio.addEventListener('canplay', onCan)
            audio.addEventListener('error', onErr)
            audio.load()
          })
        }
        if (gen !== loadGenRef.current) return

        await seekToAyah(opts.ayah, true)
      } catch {
        if (gen !== loadGenRef.current) return
        setPlaying(false)
        setError('load-failed')
      } finally {
        if (gen === loadGenRef.current) setLoading(false)
      }
    },
    [seekToAyah],
  )

  const openAndPlay = useCallback(
    (opts: { surah: number; ayah?: number }) => {
      const start =
        opts.ayah ?? readLastAyah(opts.surah) ?? 1
      void loadAndPlay({
        surah: opts.surah,
        ayah: start,
        reciter: reciterId,
      })
    },
    [loadAndPlay, reciterId],
  )

  const retry = useCallback(() => {
    const t = targetRef.current
    if (!t) return
    void loadAndPlay({ surah: t.surah, ayah: t.ayah, reciter: reciterId })
  }, [loadAndPlay, reciterId])

  const togglePause = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !visible) return
    if (audio.paused) {
      void audio
        .play()
        .then(() => {
          setPlaying(true)
          setError(null)
        })
        .catch(() => {
          setPlaying(false)
          setError('play-failed')
        })
    } else {
      audio.pause()
      setPlaying(false)
    }
  }, [visible])

  const nextAyah = useCallback(() => {
    const timestamps = timestampsRef.current
    if (!ayah || timestamps.length === 0) return
    const idx = timestamps.findIndex((t) => t.ayah === ayah)
    if (idx < 0 || idx >= timestamps.length - 1) return
    void seekToAyah(timestamps[idx + 1].ayah, true)
  }, [ayah, seekToAyah])

  const prevAyah = useCallback(() => {
    const timestamps = timestampsRef.current
    if (!ayah || timestamps.length === 0) return
    const idx = timestamps.findIndex((t) => t.ayah === ayah)
    if (idx <= 0) return
    void seekToAyah(timestamps[idx - 1].ayah, true)
  }, [ayah, seekToAyah])

  const setReciter = useCallback(
    (id: number) => {
      const reciter = getReciter(id)
      setReciterIdState(reciter.id)
      writeReciterId(reciter.id)
      const t = targetRef.current
      if (visible && t) {
        void loadAndPlay({ surah: t.surah, ayah: t.ayah, reciter: reciter.id })
      }
    },
    [loadAndPlay, visible],
  )

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTime = () => {
      const timestamps = timestampsRef.current
      if (timestamps.length === 0) return
      const tMs = audio.currentTime * 1000
      const idx = findAyahIndexByTime(timestamps, tMs)
      const row = timestamps[idx]
      if (!row) return

      setAyah((prev) => {
        if (prev !== row.ayah) {
          const s = targetRef.current?.surah
          if (s != null) writeLastAyah(s, row.ayah)
          const el = document.getElementById(`a${row.ayah}`)
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          return row.ayah
        }
        return prev
      })

      setActiveWordIndex(findActiveWordIndex(row.segments, tMs))
      const span = Math.max(1, row.toMs - row.fromMs)
      setProgress(Math.min(1, Math.max(0, (tMs - row.fromMs) / span)))

      const last = timestamps[timestamps.length - 1]
      if (row.ayah === last.ayah && tMs >= last.toMs - 40) {
        audio.pause()
        setPlaying(false)
        setProgress(1)
        setActiveWordIndex(null)
      }
    }

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => {
      setPlaying(false)
      setProgress(1)
      setActiveWordIndex(null)
    }
    const onError = () => {
      setPlaying(false)
      setError('load-failed')
    }

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [])

  const value = useMemo<QuranAudioApi>(
    () => ({
      visible,
      playing,
      loading,
      error,
      reciterId: hydrated ? reciterId : DEFAULT_RECITER_ID,
      surah,
      ayah,
      activeWordIndex,
      progress,
      wordsByAyah,
      openAndPlay,
      togglePause,
      pause,
      close,
      nextAyah,
      prevAyah,
      setReciter,
      retry,
    }),
    [
      visible,
      playing,
      loading,
      error,
      hydrated,
      reciterId,
      surah,
      ayah,
      activeWordIndex,
      progress,
      wordsByAyah,
      openAndPlay,
      togglePause,
      pause,
      close,
      nextAyah,
      prevAyah,
      setReciter,
      retry,
    ],
  )

  return (
    <QuranAudioContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" />
    </QuranAudioContext.Provider>
  )
}

export function useQuranAudio(): QuranAudioApi {
  const ctx = useContext(QuranAudioContext)
  if (!ctx) {
    throw new Error('useQuranAudio must be used within QuranAudioProvider')
  }
  return ctx
}
