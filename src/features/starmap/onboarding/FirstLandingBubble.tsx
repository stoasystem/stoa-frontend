/*
 * Murmi beside the recommended star on a newcomer's first landing
 * (`firstLanding.ts`): one line on what a star is, one way in -- the star's
 * chapter, by the jump from where the star is drawn -- and one way out.
 *
 * Not a modal: focus stays where it is, the map behind still moves, and the
 * recommended star stays the Tab stop it always is. The bubble follows its
 * star while the map moves and draws nothing while the map is still: it
 * follows frame by frame from an input on the map until the star has stopped
 * moving, then waits for the next one (#330 M4). It arrives once the star is
 * on screen and the camera has come to rest there -- never mid-flight, where
 * it would chase its star across the sky -- and goes with a short fade when
 * waved away; with reduced motion it fades in and out, nothing moves.
 *
 * The same bubble closes the first landing after the student's first star is
 * lit (`next`): beside the star recommended now, it says what lighting did
 * and leads to that star's card.
 */
import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/base'
import { Murmi } from '@/components/brand/Murmi'
import { cn } from '@/lib/utils'
import type { JumpState } from '@/features/chapter/jump'
import { animationFrameScheduler, type FrameScheduler, type StarOnScreen } from '@/features/starmap/engine/starMapEngine'
import { placeBesideStar, type LabelSide, type Rect } from '@/features/starmap/lighting/labelPlace'
import type { Star } from '@/features/starmap/model/starMap'
import { usePrefersReducedMotion } from '@/features/starmap/motion/usePrefersReducedMotion'

/** Frames the star must stay put before the bubble stops following it. */
const STILL_FRAMES = 12
/** Frames the star must stay put before the bubble first arrives: the camera has landed. */
const SETTLE_FRAMES = 4
/** The fade out when waved away, ms (`starmap.css`; reduced motion: `--motion-reduced`). */
export const BUBBLE_EXIT_MS = 160
const REDUCED_EXIT_MS = 200
/** Narrower than this, the bubble does not fit beside its star: it docks across the map instead. */
const DOCK_BELOW_PX = 560
/** The gutter a docked bubble keeps from the map's edges and its controls, CSS px. */
const GUTTER_PX = 16

/**
 * On a phone: across the map, just above the controls along its bottom (zoom,
 * help) -- or, where that would cover the star, just under the ones along
 * its top (the switcher, the way back).
 */
export function dockedPlace(spot: StarOnScreen, box: { height: number }, layer: { width: number; height: number }, controls: readonly Rect[]) {
  // Along the bottom: below 60% of the map; along the top: above 40%. Between them (Ask's button
  // on the edge) a control is beside the bubble, which stops short of it.
  const floor = Math.min(layer.height, ...controls.filter((rect) => rect.y0 > 0.6 * layer.height).map((rect) => rect.y0)) - GUTTER_PX
  const ceiling = Math.max(0, ...controls.filter((rect) => rect.y1 < 0.4 * layer.height).map((rect) => rect.y1)) + GUTTER_PX
  const low = floor - box.height
  const coversStar = spot.y + spot.size / 2 + GUTTER_PX > low
  const y = coversStar ? ceiling : low
  const beside = controls.filter((rect) => rect.y0 < y + box.height && rect.y1 > y && rect.x0 > layer.width / 2)
  const right = Math.min(layer.width, ...beside.map((rect) => rect.x0)) - GUTTER_PX / 2
  const width = Math.min(layer.width - GUTTER_PX, right) - GUTTER_PX
  return { x: GUTTER_PX, y, width, side: coversStar ? ('docked-top' as const) : ('docked-bottom' as const) }
}

/**
 * The map's own controls over the canvas (the switcher, the way back, zoom,
 * help) and Ask's button on the map's edge, in the layer's CSS px: the
 * bubble keeps clear of them, or on a phone it lands under the switcher.
 */
function controlsOver(root: HTMLElement, own: HTMLElement): Rect[] {
  const stage = root.parentElement
  if (!stage) return []
  const origin = root.getBoundingClientRect()
  const rects: Rect[] = []
  const controls = [...stage.querySelectorAll<HTMLElement>('[data-starmap-overlay]'), ...document.querySelectorAll<HTMLElement>('[data-ask-reopen]')]
  for (const control of controls) {
    if (control === own || own.contains(control) || control.contains(own)) continue
    const box = control.getBoundingClientRect()
    if (box.width === 0 || box.height === 0) continue
    rects.push({ x0: box.left - origin.left, y0: box.top - origin.top, x1: box.right - origin.left, y1: box.bottom - origin.top })
  }
  return rects
}

export type FirstLandingBubbleProps = {
  star: Star
  /** After the first lighting: the route of `star`, the next one, which the bubble leads to. */
  next?: string
  /** Whether `star` has a chapter to start: not the design preview's placeholder stars (as the star's card). */
  startable?: boolean
  /** Where a star is drawn now, from the map's engine. */
  locate: (unitId: string) => StarOnScreen | null
  /** Calls `listener` when the map comes to rest; returns the way to stop. */
  watch?: (listener: () => void) => () => void
  onDismiss: () => void
  /** For tests: the frame clock. */
  scheduler?: FrameScheduler
}

export function FirstLandingBubble({ star, next, startable = true, locate, watch, onDismiss, scheduler = animationFrameScheduler }: FirstLandingBubbleProps) {
  const { t } = useTranslation('starmap')
  const navigate = useNavigate()
  const titleId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLElement>(null)
  const [placed, setPlaced] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const reducedMotion = usePrefersReducedMotion()
  const chapterTo = `/chapter/${encodeURIComponent(star.unitId)}`

  useEffect(() => {
    const root = rootRef.current
    const box = boxRef.current
    if (!root || !box) return
    let handle: number | null = null
    let still = 0
    let last: StarOnScreen | null = null
    let side: LabelSide | undefined
    let arrived = false

    const frame = () => {
      handle = null
      const spot = locate(star.unitId)
      const width = root.clientWidth
      const height = root.clientHeight
      const inside = spot !== null && spot.x >= 0 && spot.x <= width && spot.y >= 0 && spot.y <= height
      still = last && spot && last.x === spot.x && last.y === spot.y ? still + 1 : 0
      last = spot
      // The first time, only once the camera has landed: the bubble does not chase a flight.
      arrived ||= inside && still >= SETTLE_FRAMES
      box.style.visibility = inside && arrived ? 'visible' : 'hidden'
      if (spot && inside && arrived) {
        const controls = controlsOver(root, box)
        const docked = width < DOCK_BELOW_PX
        if (!docked) box.style.width = ''
        const size = { width: box.offsetWidth, height: box.offsetHeight }
        let at: { x: number; y: number; side: string }
        if (docked) {
          // Its height follows its width, so the next frame settles what this one measures.
          const dock = dockedPlace(spot, size, { width, height }, controls)
          box.style.width = `${dock.width}px`
          at = dock
        } else {
          const beside = placeBesideStar(spot, size, spot.size / 2 + 30, { width, height }, [...(spot.keepClear ?? []), ...controls], side)
          side = beside.side
          at = beside
        }
        box.style.transform = `translate(${at.x}px, ${at.y}px)`
        box.dataset.side = at.side
        setPlaced(true)
      }
      if (!arrived || still < STILL_FRAMES) handle = scheduler.request(frame)
    }
    const follow = () => {
      still = 0
      if (handle === null) handle = scheduler.request(frame)
    }

    follow()
    const stage = root.parentElement
    const inputs = ['pointerdown', 'pointermove', 'wheel', 'keydown'] as const
    for (const type of inputs) stage?.addEventListener(type, follow, { passive: true })
    window.addEventListener('resize', follow)
    const unwatch = watch?.(follow)
    return () => {
      if (handle !== null) scheduler.cancel(handle)
      for (const type of inputs) stage?.removeEventListener(type, follow)
      window.removeEventListener('resize', follow)
      unwatch?.()
    }
  }, [star.unitId, locate, watch, scheduler])

  // Into the chapter by the jump, from where the star is drawn (#50 point 5), as the star's card does.
  function start(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const spot = locate(star.unitId)
    const rect = rootRef.current?.getBoundingClientRect()
    if (!spot || !rect) return
    event.preventDefault()
    const state: JumpState = { jump: { x: rect.left + spot.x, y: rect.top + spot.y } }
    navigate(chapterTo, { state })
  }

  // Waved away: a short fade, then gone.
  const dismissRef = useRef(onDismiss)
  useEffect(() => {
    dismissRef.current = onDismiss
  }, [onDismiss])
  useEffect(() => {
    if (!leaving) return
    const timer = window.setTimeout(() => dismissRef.current(), reducedMotion ? REDUCED_EXIT_MS : BUBBLE_EXIT_MS)
    return () => window.clearTimeout(timer)
  }, [leaving, reducedMotion])
  const leave = () => setLeaving(true)

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Escape') return
    event.stopPropagation()
    leave()
  }

  return (
    <div ref={rootRef} data-first-landing={star.unitId} className="pointer-events-none absolute inset-0">
      <aside
        ref={boxRef}
        data-starmap-overlay
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        className={cn('absolute left-0 top-0 w-[min(320px,calc(100%-32px))]', leaving ? 'pointer-events-none' : 'pointer-events-auto')}
        style={{ visibility: 'hidden' }}
      >
        <div
          className="starmap-first-landing space-y-2 rounded-[var(--corner-card)] border border-solid border-[color:var(--sky-glass-border)] px-4 py-3 text-on-sky"
          data-shown={placed || undefined}
          data-leaving={leaving || undefined}
          style={{ background: 'var(--sky-glass)', backdropFilter: 'blur(var(--sky-glass-blur))', WebkitBackdropFilter: 'blur(var(--sky-glass-blur))' }}
        >
          <div className="flex items-center gap-2">
            <Murmi mood="watching" size={32} />
            <h2 id={titleId} className="m-0 min-w-0 text-[15px] font-semibold text-[color:var(--on-sky-text)]">
              {next ? t('firstReveal.title') : t('firstLanding.title', { name: star.name })}
            </h2>
          </div>
          <p className="m-0 text-[13px] leading-5 text-[color:var(--on-sky-text-body)]">
            {next ? t('firstReveal.body', { name: star.name }) : t('firstLanding.body')}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5">
            {next ? (
              <Button asChild lift variant="onSky" size="small">
                <Link to={next}>{t('firstReveal.show')}</Link>
              </Button>
            ) : (
              startable && (
                <Button asChild lift variant="onSky" size="small">
                  <Link to={chapterTo} onClick={start}>
                    {t('firstLanding.start')}
                  </Link>
                </Button>
              )
            )}
            <Button variant="onSkyPlain" size="small" onClick={leave}>
              {next ? t('firstReveal.later') : t('firstLanding.later')}
            </Button>
          </div>
        </div>
      </aside>
    </div>
  )
}
