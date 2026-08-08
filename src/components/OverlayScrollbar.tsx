import { useEffect, useRef, useState } from 'react'
import './OverlayScrollbar.css'

const HIDE_DELAY_MS = 900
const MIN_THUMB = 36
const ARROW = 20
const STEP = 72

export function OverlayScrollbar() {
  const [needed, setNeeded] = useState(false)
  const [active, setActive] = useState(false)
  const [thumbTop, setThumbTop] = useState(ARROW)
  const [thumbHeight, setThumbHeight] = useState(MIN_THUMB)
  const hideTimer = useRef(0)
  const drag = useRef<{ startY: number; startTop: number } | null>(null)
  const hovering = useRef(false)
  const holdTimer = useRef(0)
  const holdInterval = useRef(0)
  const metrics = useRef({ view: 0, total: 0, thumbHeight: MIN_THUMB })

  useEffect(() => {
    const root = document.documentElement

    function measure() {
      const view = root.clientHeight
      const total = root.scrollHeight
      const canScroll = total > view + 1
      setNeeded(canScroll)
      metrics.current.view = view
      metrics.current.total = total

      if (!canScroll) {
        setActive(false)
        return
      }

      const track = Math.max(0, view - ARROW * 2)
      const ratio = view / total
      const height = Math.max(MIN_THUMB, Math.round(track * ratio))
      const maxTop = Math.max(0, track - height)
      const top =
        total === view
          ? ARROW
          : ARROW + Math.round((root.scrollTop / (total - view)) * maxTop)

      metrics.current.thumbHeight = height
      setThumbHeight(height)
      setThumbTop(Math.min(ARROW + maxTop, Math.max(ARROW, top)))
    }

    function scheduleHide() {
      window.clearTimeout(hideTimer.current)
      hideTimer.current = window.setTimeout(() => {
        if (!drag.current && !hovering.current) setActive(false)
      }, HIDE_DELAY_MS)
    }

    function show() {
      setActive(true)
      scheduleHide()
    }

    function onScroll() {
      measure()
      show()
    }

    measure()

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measure)
    const ro = new ResizeObserver(measure)
    ro.observe(document.body)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measure)
      ro.disconnect()
      window.clearTimeout(hideTimer.current)
      window.clearTimeout(holdTimer.current)
      window.clearInterval(holdInterval.current)
    }
  }, [])

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!drag.current) return
      const root = document.documentElement
      const { view, total } = metrics.current
      const height = metrics.current.thumbHeight
      const track = Math.max(0, view - ARROW * 2)
      const maxTop = Math.max(0, track - height)
      const nextTop = Math.min(
        ARROW + maxTop,
        Math.max(
          ARROW,
          drag.current.startTop + (e.clientY - drag.current.startY),
        ),
      )
      setThumbTop(nextTop)
      const maxScroll = total - view
      root.scrollTop =
        maxTop === 0 ? 0 : ((nextTop - ARROW) / maxTop) * maxScroll
    }

    function onUp() {
      if (!drag.current) return
      drag.current = null
      document.body.classList.remove('is-overlay-dragging')
      window.clearTimeout(hideTimer.current)
      hideTimer.current = window.setTimeout(() => {
        if (!hovering.current) setActive(false)
      }, HIDE_DELAY_MS)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [])

  function scrollByStep(delta: number) {
    document.documentElement.scrollBy({ top: delta, behavior: 'auto' })
    setActive(true)
  }

  function startHold(delta: number) {
    scrollByStep(delta)
    window.clearTimeout(holdTimer.current)
    window.clearInterval(holdInterval.current)
    holdTimer.current = window.setTimeout(() => {
      holdInterval.current = window.setInterval(() => scrollByStep(delta), 50)
    }, 320)
  }

  function stopHold() {
    window.clearTimeout(holdTimer.current)
    window.clearInterval(holdInterval.current)
    window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => {
      if (!hovering.current && !drag.current) setActive(false)
    }, HIDE_DELAY_MS)
  }

  if (!needed) return null

  return (
    <div
      className={
        active
          ? 'overlay-scrollbar overlay-scrollbar--active'
          : 'overlay-scrollbar'
      }
      aria-hidden="true"
      onPointerEnter={() => {
        hovering.current = true
        setActive(true)
        window.clearTimeout(hideTimer.current)
      }}
      onPointerLeave={() => {
        hovering.current = false
        if (drag.current) return
        window.clearTimeout(hideTimer.current)
        hideTimer.current = window.setTimeout(() => setActive(false), HIDE_DELAY_MS)
      }}
    >
      <button
        type="button"
        className="overlay-scrollbar__arrow overlay-scrollbar__arrow--up"
        tabIndex={-1}
        onPointerDown={(e) => {
          e.preventDefault()
          startHold(-STEP)
        }}
        onPointerUp={stopHold}
        onPointerCancel={stopHold}
      />
      <button
        type="button"
        className="overlay-scrollbar__thumb"
        style={{ top: thumbTop, height: thumbHeight }}
        tabIndex={-1}
        onPointerDown={(e) => {
          e.preventDefault()
          drag.current = { startY: e.clientY, startTop: thumbTop }
          document.body.classList.add('is-overlay-dragging')
          setActive(true)
          window.clearTimeout(hideTimer.current)
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
      />
      <button
        type="button"
        className="overlay-scrollbar__arrow overlay-scrollbar__arrow--down"
        tabIndex={-1}
        onPointerDown={(e) => {
          e.preventDefault()
          startHold(STEP)
        }}
        onPointerUp={stopHold}
        onPointerCancel={stopHold}
      />
    </div>
  )
}
