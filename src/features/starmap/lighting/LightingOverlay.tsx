/*
 * The lighting moment (#51): when a knowledge point is lit for the first
 * time, the star map celebrates it once, on that star.
 *
 *   - The signal is the lighting event source (`lightingEvents.ts`): lit
 *     points this student has not acknowledged. Only `observed` ones are
 *     celebrated; the backfill's never are. A point waits until the map it
 *     is on is open and draws it lit.
 *   - It waits until the star is on screen: in the galaxy in focus, inside
 *     the map's frame. Then the animation (`flare.ts`) runs on this layer's
 *     own canvas, above the map's, following the star while the map
 *     settles. With reduced motion there is none: the star simply is lit,
 *     and a small still label beside it says "<name> is lit" for
 *     `STILL_LABEL_MS`, then goes -- at once, without fading (#140 F3).
 *   - The star turns lit gold under the flare's brightest moment, not before
 *     (#140 F1): until then the map draws it as it was (`useLightingStage.ts`),
 *     and this layer says when (`onReveal`) -- with reduced motion, as it
 *     is shown.
 *   - Either way an `aria-live` region says "<name> is lit" at that moment.
 *   - Only once shown (the flare played to its end, or with reduced motion
 *     announced) is the point acknowledged to the source, so a reload does
 *     not replay it, and the moment handed to Ask as a card
 *     (`store/litMomentsStore.ts`). A star never brought on screen, or a map
 *     left mid-flare, is not acknowledged: it comes back next time.
 *
 * `data-lighting` on the root says `idle`, `playing` or `done` (at least one
 * moment shown), for the design preview's screenshots.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { animationFrameScheduler, type FrameScheduler, type StarOnScreen } from '@/features/starmap/engine/starMapEngine'
import { drawFlare, flareBase, FLARE_MS, FLARE_PEAK_MS } from '@/features/starmap/lighting/flare'
import { isCelebrated, useLightingEventSource, type LitEvent } from '@/features/starmap/lighting/lightingEvents'
import { subjectOfNebula, type Star, type StarMap } from '@/features/starmap/model/starMap'
import { usePrefersReducedMotion } from '@/features/starmap/motion/usePrefersReducedMotion'
import { useAuthStore } from '@/store/authStore'
import { useLitMomentsStore } from '@/store/litMomentsStore'

/** Time for the map to finish arriving (a layer flight) before the flare starts. */
export const SETTLE_MS = 450

/** With reduced motion, how long the still "<name> is lit" label stays beside the star (#140 F3). */
export const STILL_LABEL_MS = 4000

type Moment = { event: LitEvent; star: Star; subjectId: string }

export type LightingOverlayProps = {
  map: StarMap
  /** Where a star is drawn now, from the map's engine. */
  locate: (unitId: string) => StarOnScreen | null
  /** The star may be drawn lit now: the flare's brightest moment, or the moment shown without one (#140). */
  onReveal?: (unitId: string) => void
  /** For tests: the frame clock. */
  scheduler?: FrameScheduler
}

export function LightingOverlay({ map, locate, onReveal, scheduler = animationFrameScheduler }: LightingOverlayProps) {
  const { t } = useTranslation('starmap')
  const source = useLightingEventSource()
  const reducedMotion = usePrefersReducedMotion()
  const ownerId = useAuthStore((state) => state.user?.id)
  const addMoment = useLitMomentsStore((state) => state.add)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const captionRef = useRef<HTMLParagraphElement>(null)
  const stillRef = useRef<HTMLParagraphElement>(null)
  const revealRef = useRef(onReveal)
  useEffect(() => {
    revealRef.current = onReveal
  }, [onReveal])
  const handled = useRef(new Set<string>())
  const [pending, setPending] = useState<LitEvent[]>([])
  const [current, setCurrent] = useState<Moment | null>(null)
  const [playing, setPlaying] = useState(false)
  const [shown, setShown] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  /** With reduced motion: the still label, while it stays. */
  const [still, setStill] = useState<{ unitId: string; text: string } | null>(null)

  // Read the source on arrival, and again whenever it says it changed.
  useEffect(() => {
    let alive = true
    const read = () => {
      source.unacknowledged().then(
        (events) => alive && setPending(events),
        () => {},
      )
    }
    read()
    const unsubscribe = source.subscribe?.(read)
    return () => {
      alive = false
      unsubscribe?.()
    }
  }, [source])

  const starsById = useMemo(() => new Map(map.stars.map((star) => [star.unitId, star])), [map])

  // The galaxy in focus now, for the frame loop: a moment still waiting for its star goes back
  // to the queue when the student flies to another galaxy.
  const focus = map.subject.subjectId
  const focusRef = useRef(focus)
  useEffect(() => {
    focusRef.current = focus
  }, [focus])

  // The next moment: a point seen lit, in the galaxy in focus, drawn lit, not shown yet. The map
  // holds the whole sky (#119), so another galaxy's star is on it too; it waits for its own.
  useEffect(() => {
    if (current) return
    for (const event of pending) {
      const star = starsById.get(event.unitId)
      if (!isCelebrated(event) || handled.current.has(event.unitId) || star?.state !== 'lit') continue
      const subjectId = subjectOfNebula(map, star.nebulaId)
      if (subjectId !== map.subject.subjectId) continue
      handled.current.add(event.unitId)
      setCurrent({ event, star, subjectId })
      return
    }
  }, [pending, starsById, current, map])

  // The moment, frame by frame: wait until the star is on screen, then play the flare there (or,
  // with reduced motion, only say it). Acknowledged once it has been shown, never before: a star
  // panned away, a map left mid-flare or another galaxy flown to leaves it for next time.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!current || !canvas) return
    const ctx = canvas.getContext('2d')
    const colors = {
      lit: getComputedStyle(canvas).getPropertyValue('--lit').trim() || '#F2C572',
      core: getComputedStyle(canvas).getPropertyValue('--lit-core').trim() || '#FFF8EA',
    }
    const { event, star, subjectId } = current
    let startAt: number | null = null
    let handle: number | null = null
    let finished = false
    let revealed = false
    const reveal = () => {
      if (revealed) return
      revealed = true
      revealRef.current?.(star.unitId)
    }

    const onScreen = (spot: StarOnScreen | null): spot is StarOnScreen => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      return spot !== null && !document.hidden && width > 0 && height > 0 && spot.x >= 0 && spot.x <= width && spot.y >= 0 && spot.y <= height
    }

    const end = (seen: boolean) => {
      if (finished) return
      finished = true
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
      if (captionRef.current) captionRef.current.style.opacity = '0'
      if (seen) {
        reveal()
        source.acknowledge([event.unitId]).catch(() => {})
        if (ownerId) addMoment(ownerId, { unitId: star.unitId, name: star.name, subjectId, nebulaId: star.nebulaId, litAt: event.litAt })
        setShown((count) => count + 1)
      } else {
        handled.current.delete(event.unitId)
      }
      setPlaying(false)
      setCurrent(null)
    }

    const frame = (at: number) => {
      handle = null
      const spot = locate(star.unitId)
      if (startAt === null) {
        if (focusRef.current !== subjectId) return end(false)
        if (!onScreen(spot)) {
          // Not on screen yet: keep looking, draw nothing.
          handle = scheduler.request(frame)
          return
        }
        setAnnouncement(t('lighting.announce', { name: star.name }))
        if (reducedMotion) {
          setStill({ unitId: star.unitId, text: t('lighting.announce', { name: star.name }) })
          return end(true)
        }
        startAt = at + SETTLE_MS
        setPlaying(true)
      }
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const ratio = Math.min(2, window.devicePixelRatio || 1)
      if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
        canvas.width = Math.round(width * ratio)
        canvas.height = Math.round(height * ratio)
      }
      const elapsed = at - startAt
      // Under the bloom at its fullest, the star turns gold.
      if (elapsed >= FLARE_PEAK_MS) reveal()
      if (ctx) {
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
        ctx.clearRect(0, 0, width, height)
        if (spot) drawFlare(ctx, elapsed, spot.x, spot.y, flareBase(spot.size), colors)
      }
      const caption = captionRef.current
      if (caption && spot) {
        placeBelow(caption, spot, flareBase(spot.size) * 1.6 + 12, width, height)
        caption.style.opacity = String(captionOpacity(elapsed))
      }
      if (elapsed >= FLARE_MS + 600) return end(true)
      handle = scheduler.request(frame)
    }
    handle = scheduler.request(frame)
    return () => {
      if (handle !== null) scheduler.cancel(handle)
      // Left before it was shown: not acknowledged, so it comes back.
      if (!finished) handled.current.delete(event.unitId)
    }
  }, [current, locate, scheduler, reducedMotion, source, ownerId, addMoment, t])

  // The still label (reduced motion): beside its star while the star is on screen -- it moves
  // only when the map is moved -- and gone after STILL_LABEL_MS, at once.
  useEffect(() => {
    if (!still) return
    let shownAt: number | null = null
    let handle: number | null = null
    const frame = (at: number) => {
      handle = null
      shownAt ??= at
      if (at - shownAt >= STILL_LABEL_MS) {
        setStill(null)
        return
      }
      const label = stillRef.current
      const box = label?.parentElement
      const spot = locate(still.unitId)
      if (label && box) {
        const width = box.clientWidth
        const height = box.clientHeight
        const inside = spot !== null && spot.x >= 0 && spot.x <= width && spot.y >= 0 && spot.y <= height
        label.style.visibility = inside ? 'visible' : 'hidden'
        if (spot && inside) placeBelow(label, spot, flareBase(spot.size) * 0.6 + 10, width, height)
      }
      handle = scheduler.request(frame)
    }
    handle = scheduler.request(frame)
    return () => {
      if (handle !== null) scheduler.cancel(handle)
    }
  }, [still, locate, scheduler])

  const phase = playing ? 'playing' : shown > 0 ? 'done' : 'idle'
  return (
    <div data-lighting={phase} className="pointer-events-none absolute inset-0">
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />
      {playing && current && (
        // Seen, not read: the live region below says it.
        <p
          ref={captionRef}
          aria-hidden="true"
          data-lighting-caption
          className="absolute left-0 top-0 m-0 whitespace-nowrap rounded-full border border-solid border-[color:var(--sky-glass-border)] px-3 py-1 text-[13px] font-semibold text-on-sky"
          style={{ opacity: 0, background: 'var(--sky-glass)', backdropFilter: 'blur(var(--sky-glass-blur))', WebkitBackdropFilter: 'blur(var(--sky-glass-blur))' }}
        >
          {t('lighting.announce', { name: current.star.name })}
        </p>
      )}
      {still && (
        // Seen, not read: the live region below says it. No transition: it comes and goes at once.
        <p
          ref={stillRef}
          aria-hidden="true"
          data-lighting-label={still.unitId}
          className="absolute left-0 top-0 m-0 whitespace-nowrap rounded-full border border-solid border-[color:var(--sky-glass-border)] px-3 py-1 text-[13px] font-semibold text-on-sky"
          style={{ visibility: 'hidden', background: 'var(--sky-glass)', backdropFilter: 'blur(var(--sky-glass-blur))', WebkitBackdropFilter: 'blur(var(--sky-glass-blur))' }}
        >
          {still.text}
        </p>
      )}
      <p role="status" aria-live="polite" data-lighting-announcer className="sr-only">
        {announcement}
      </p>
    </div>
  )
}

/** A caption or label `gap` px below its star, kept inside the layer's `width` x `height`. */
function placeBelow(element: HTMLElement, spot: StarOnScreen, gap: number, width: number, height: number) {
  const half = element.offsetWidth / 2
  const x = half > 0 && width > 2 * (8 + half) ? Math.max(8 + half, Math.min(width - 8 - half, spot.x)) : spot.x
  const y = Math.min(height - 48, spot.y + gap)
  element.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translateX(-50%)`
}

/** The caption comes in with the ignition and leaves after the flare. */
function captionOpacity(elapsed: number): number {
  if (elapsed < 600) return 0
  if (elapsed < 900) return (elapsed - 600) / 300
  if (elapsed < FLARE_MS) return 1
  return Math.max(0, 1 - (elapsed - FLARE_MS) / 600)
}
