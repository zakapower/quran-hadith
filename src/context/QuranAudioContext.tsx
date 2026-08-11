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
import {
  fetchChapterAudioPack,
  fetchChapterWords,
} from '@/api/quranAudio'
import { DEFAULT_RECITER_ID, getReciter } from '@/data/reciters'
import {
  findActiveWordIndex,
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

function sameAudioUrl(current: string, next: string) {
  if (!current) return false
  try {
    const a = new URL(current, window.location.origin)
    const b = new URL(next, window.location.origin)
    return a.pathname + a.search === b.pathname + b.search
  } catch {
    return current === next || current.endsWith(next)
  }
}

function loadAudioSrc(audio: HTMLAudioElement, url: string) {
  if (sameAudioUrl(audio.src, url) && audio.readyState >= 1) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    const onMeta = () => {
      cleanup()
      resolve()
    }
    const onErr = () => {
      cleanup()
      reject(new Error('audio-error'))
    }
    const timer = window.setTimeout(() => {
      cleanup()
      reject(new Error('audio-timeout'))
    }, 25000)
    const cleanup = () => {
      window.clearTimeout(timer)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('error', onErr)
    }

    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('error', onErr)
    audio.src = url
    audio.load()
  })
}

export function QuranAudioProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timestampsRef = useRef<AyahTiming[]>([])
  const audioByAyahRef = useRef<Map<number, string>>(new Map())
  const targetRef = useRef<PlayTarget | null>(null)
  const loadGenRef = useRef(0)
  const advancingRef = useRef(false)
  const ignoreErrorRef = useRef(false)

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
    if (audio) audio.pause()
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

  useEffect(() => {
    if (!visible) return

    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') return
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.closest('input, textarea, select, [contenteditable="true"]') ||
          target.isContentEditable)
      ) {
        return
      }
      e.preventDefault()
      e.stopPropagation()
      pause()
    }

    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [visible, pause])

  const playAyahFile = useCallback(async (ayahNumber: number, autoplay: boolean) => {
    const audio = audioRef.current
    const timestamps = timestampsRef.current
    if (!audio || timestamps.length === 0) return

    const clamped = clampAyah(ayahNumber, timestamps)
    const row = timestamps.find((t) => t.ayah === clamped) ?? timestamps[0]
    const url = audioByAyahRef.current.get(row.ayah)
    if (!url) throw new Error('missing-ayah-url')

    const surahNum = targetRef.current?.surah
    if (surahNum != null) {
      targetRef.current = { surah: surahNum, ayah: row.ayah }
      writeLastAyah(surahNum, row.ayah)
    }
    setAyah(row.ayah)
    setActiveWordIndex(null)
    setProgress(0)

    requestAnimationFrame(() => {
      document
        .getElementById(`a${row.ayah}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })

    ignoreErrorRef.current = true
    try {
      const needsLoad = !sameAudioUrl(audio.src, url)
      if (needsLoad) {
        audio.src = url
      }

      const seekStart = () => {
        try {
          if (audio.readyState >= 1) audio.currentTime = 0
        } catch {
          /* ignore */
        }
      }

      if (autoplay) {
        seekStart()
        // Call play() ASAP so sequential advance from `ended` keeps user-gesture chain.
        await audio.play()
        setPlaying(true)
        setError(null)
        const rowNow = timestampsRef.current.find((t) => t.ayah === row.ayah)
        if (rowNow) {
          setActiveWordIndex(
            findActiveWordIndex(rowNow.segments, audio.currentTime * 1000),
          )
        }
      } else if (needsLoad) {
        await loadAudioSrc(audio, url)
        seekStart()
      } else {
        seekStart()
      }
    } catch {
      setPlaying(false)
      setError('play-failed')
    } finally {
      ignoreErrorRef.current = false
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
        const pack = await fetchChapterAudioPack(opts.reciter, opts.surah)
        if (gen !== loadGenRef.current) return

        timestampsRef.current = pack.timestamps
        audioByAyahRef.current = pack.audioByAyah

        // Words are optional (karaoke); don't block playback.
        void fetchChapterWords(opts.surah)
          .then((words) => {
            if (gen === loadGenRef.current) setWordsByAyah(words)
          })
          .catch(() => {
            /* ignore */
          })

        await playAyahFile(opts.ayah, true)
      } catch {
        if (gen !== loadGenRef.current) return
        setPlaying(false)
        setError('load-failed')
      } finally {
        if (gen === loadGenRef.current) setLoading(false)
      }
    },
    [playAyahFile],
  )

  const openAndPlay = useCallback(
    (opts: { surah: number; ayah?: number }) => {
      const start =
        opts.ayah ??
        readLastAyah(opts.surah) ??
        (surah === opts.surah && ayah != null ? ayah : null) ??
        1

      // Already have this surah loaded — jump without full reload.
      if (
        surah === opts.surah &&
        timestampsRef.current.length > 0 &&
        audioByAyahRef.current.size > 0
      ) {
        setVisible(true)
        setError(null)
        // Explicit ayah (e.g. surah Play → 1, or ayah button) always restarts that file.
        void playAyahFile(start, true)
        return
      }

      void loadAndPlay({
        surah: opts.surah,
        ayah: start,
        reciter: reciterId,
      })
    },
    [ayah, loadAndPlay, playAyahFile, reciterId, surah],
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
    void playAyahFile(timestamps[idx + 1].ayah, true)
  }, [ayah, playAyahFile])

  const prevAyah = useCallback(() => {
    const timestamps = timestampsRef.current
    if (!ayah || timestamps.length === 0) return
    const idx = timestamps.findIndex((t) => t.ayah === ayah)
    if (idx <= 0) return
    void playAyahFile(timestamps[idx - 1].ayah, true)
  }, [ayah, playAyahFile])

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

  const advanceOrStop = useCallback(() => {
    if (advancingRef.current) return
    const timestamps = timestampsRef.current
    const current = targetRef.current?.ayah
    if (!current || timestamps.length === 0) return
    const idx = timestamps.findIndex((t) => t.ayah === current)
    const last = timestamps[timestamps.length - 1]
    if (idx < 0 || current === last.ayah || idx >= timestamps.length - 1) {
      setPlaying(false)
      setProgress(1)
      setActiveWordIndex(null)
      return
    }
    advancingRef.current = true
    void playAyahFile(timestamps[idx + 1].ayah, true).finally(() => {
      advancingRef.current = false
    })
  }, [playAyahFile])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const syncFromClock = () => {
      const timestamps = timestampsRef.current
      const currentAyah = targetRef.current?.ayah
      if (!currentAyah || timestamps.length === 0) return
      const row = timestamps.find((t) => t.ayah === currentAyah)
      if (!row) return

      const tMs = audio.currentTime * 1000
      setActiveWordIndex(findActiveWordIndex(row.segments, tMs))

      // Progress from real file duration — chapter toMs can disagree with everyayah mp3.
      const fileMs =
        Number.isFinite(audio.duration) && audio.duration > 0
          ? audio.duration * 1000
          : 0
      const durMs = fileMs > 0 ? fileMs : row.toMs > 0 ? row.toMs : 0
      if (durMs > 0) {
        setProgress(Math.min(1, Math.max(0, tMs / durMs)))
      }
    }

    let raf = 0
    const tick = () => {
      syncFromClock()
      raf = requestAnimationFrame(tick)
    }

    const onPlay = () => {
      setPlaying(true)
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(tick)
    }
    const onPause = () => {
      setPlaying(false)
      cancelAnimationFrame(raf)
      syncFromClock()
    }
    // Advance only when the ayah file truly ends — don't pause mid-file
    // (that breaks the autoplay chain for the next ayah).
    const onEnded = () => {
      advanceOrStop()
    }
    const onError = () => {
      if (ignoreErrorRef.current) return
      setPlaying(false)
      setError('load-failed')
    }

    if (!audio.paused) {
      raf = requestAnimationFrame(tick)
    }

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)
    return () => {
      cancelAnimationFrame(raf)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [advanceOrStop])

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
      <audio ref={audioRef} preload="metadata" playsInline />
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
