/*
 * The lighting moment (#51): when a knowledge point is lit for the first
 * time, the star map celebrates it once, on that star.
 *
 *   - The signal is the lighting event source (`lightingEvents.ts`): lit
 *     points this student has not acknowledged. Only `observed` ones are
 *     celebrated; the backfill's never are. A point waits until the map it
 *     is on is open and draws it lit.
 *   - The animation (`flare.ts`) runs on this layer's own canvas, above the
 *     map's, following the star while the map settles. With reduced motion
 *     there is none: the star simply is lit.
 *   - Either way an `aria-live` region says "<name> is lit".
 *   - Once shown, the point is acknowledged to the source, so a reload does
 *     not replay it, and the moment is handed to Ask as a card
 *     (`store/litMomentsStore.ts`).
 *
 * `data-lighting` on the root says `idle`, `playing` or `done` (at least one
 * moment shown), for the design preview's screenshots.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { animationFrameScheduler, type FrameScheduler, type StarOnScreen } from '@/features/starmap/engine/starMapEngine'
import { drawFlare, flareBase, FLARE_MS } from '@/features/starmap/lighting/flare'
import { isCelebrated, useLightingEventSource, type LitEvent } from '@/features/starmap/lighting/lightingEvents'
import type { Star, StarMap } from '@/features/starmap/model/starMap'
import { usePrefersReducedMotion } from '@/features/starmap/motion/usePrefersReducedMotion'
import { useAuthStore } from '@/store/authStore'
import { useLitMomentsStore } from '@/store/litMomentsStore'

/** Time for the map to finish arriving (a layer flight) before the flare starts. */
export const SETTLE_MS = 450
/** How long to wait for the star to be on screen before letting the animation go. */
const FIND_STAR_MS = 4000

type Moment = { event: LitEvent; star: Star }

export type LightingOverlayProps = {
  map: StarMap
  /** Where a star is drawn now, from the map's engine. */
  locate: (unitId: string) => StarOnScreen | null
  /** For tests: the frame clock. */
  scheduler?: FrameScheduler
}

export function LightingOverlay({ map, locate, scheduler = animationFrameScheduler }: LightingOverlayProps) {
  const { t } = useTranslation('starmap')
  const source = useLightingEventSource()
  const reducedMotion = usePrefersReducedMotion()
  const ownerId = useAuthStore((state) => state.user?.id)
  const addMoment = useLitMomentsStore((state) => state.add)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const captionRef = useRef<HTMLParagraphElement>(null)
  const handled = useRef(new Set<string>())
  const [pending, setPending] = useState<LitEvent[]>([])
  const [current, setCurrent] = useState<Moment | null>(null)
  const [shown, setShown] = useState(0)
  const [announcement, setAnnouncement] = useState('')

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

  // The next moment: a point seen lit, on this map, drawn lit, not shown yet.
  useEffect(() => {
    if (current) return
    for (const event of pending) {
      const star = starsById.get(event.unitId)
      if (!isCelebrated(event) || handled.current.has(event.unitId) || star?.state !== 'lit') continue
      handled.current.add(event.unitId)
      setAnnouncement(t('lighting.announce', { name: star.name }))
      source.acknowledge([event.unitId]).catch(() => {})
      if (ownerId) {
        addMoment(ownerId, { unitId: star.unitId, name: star.name, subjectId: map.subject.subjectId, nebulaId: star.nebulaId, litAt: event.litAt })
      }
      if (reducedMotion) setShown((count) => count + 1)
      else setCurrent({ event, star })
      return
    }
  }, [pending, starsById, current, reducedMotion, source, ownerId, addMoment, map.subject.subjectId, t])

  // The flare, frame by frame, wherever the star is drawn now.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!current || !canvas) return
    const ctx = canvas.getContext('2d')
    const colors = {
      lit: getComputedStyle(canvas).getPropertyValue('--lit').trim() || '#F2C572',
      core: getComputedStyle(canvas).getPropertyValue('--lit-core').trim() || '#FFF8EA',
    }
    const now = scheduler.now ?? (() => performance.now())
    const askedAt = now()
    let startAt: number | null = null
    let handle: number | null = null
    let finished = false

    const finish = () => {
      if (finished) return
      finished = true
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
      if (captionRef.current) captionRef.current.style.opacity = '0'
      setCurrent(null)
      setShown((count) => count + 1)
    }

    const frame = (at: number) => {
      handle = null
      const spot = locate(current.star.unitId)
      if (startAt === null) {
        // Wait until the star is on screen and the map has settled; give up after a while.
        if (spot && !document.hidden) startAt = at + SETTLE_MS
        else if (at - askedAt > FIND_STAR_MS) return finish()
      }
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const ratio = Math.min(2, window.devicePixelRatio || 1)
      if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
        canvas.width = Math.round(width * ratio)
        canvas.height = Math.round(height * ratio)
      }
      const elapsed = startAt === null ? -1 : at - startAt
      if (ctx) {
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
        ctx.clearRect(0, 0, width, height)
        if (spot) drawFlare(ctx, elapsed, spot.x, spot.y, flareBase(spot.size), colors)
      }
      const caption = captionRef.current
      if (caption && spot) {
        const base = flareBase(spot.size)
        const below = Math.min(height - 48, spot.y + base * 1.6 + 12)
        caption.style.transform = `translate(${Math.round(spot.x)}px, ${Math.round(below)}px) translateX(-50%)`
        caption.style.opacity = String(captionOpacity(elapsed))
      }
      if (elapsed >= FLARE_MS + 600) return finish()
      handle = scheduler.request(frame)
    }
    handle = scheduler.request(frame)
    return () => {
      if (handle !== null) scheduler.cancel(handle)
    }
  }, [current, locate, scheduler])

  const phase = current ? 'playing' : shown > 0 ? 'done' : 'idle'
  return (
    <div data-lighting={phase} className="pointer-events-none absolute inset-0">
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />
      {current && (
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
      <p role="status" aria-live="polite" data-lighting-announcer className="sr-only">
        {announcement}
      </p>
    </div>
  )
}

/** The caption comes in with the ignition and leaves after the flare. */
function captionOpacity(elapsed: number): number {
  if (elapsed < 600) return 0
  if (elapsed < 900) return (elapsed - 600) / 300
  if (elapsed < FLARE_MS) return 1
  return Math.max(0, 1 - (elapsed - FLARE_MS) / 600)
}
