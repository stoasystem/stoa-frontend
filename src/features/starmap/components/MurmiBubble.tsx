/*
 * Murmi beside a star on the map: the one bubble the first landing
 * (`onboarding/FirstLandingBubble.tsx`) and finding a star
 * (`findStar/FindStarBubble.tsx`, #489) both say their line in. What it says,
 * its ways on and the star it stands by are the caller's; how it stands
 * there is this file's.
 *
 * Not a modal: focus stays where it is, the map behind still moves, and the
 * star stays the Tab stop it always is. The bubble follows its star while the
 * map moves and draws nothing while the map is still: it follows frame by
 * frame from an input on the map until the star has stopped moving, then
 * waits for the next one (#330 M4). It arrives once the star is on screen and
 * the camera has come to rest there -- never mid-flight, where it would chase
 * its star across the sky -- and goes with a short fade when waved away; with
 * reduced motion it fades in and out, nothing moves. Narrower than
 * `DOCK_BELOW_PX` it does not fit beside its star and docks across the map.
 *
 * Waved away by its own "later" (the caller's, through `leave`), by Escape
 * wherever focus is on the map, and -- where the caller asks -- by a ✕ and by
 * a tap on the map that is not a drag.
 */
import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Murmi } from '@/components/brand/Murmi'
import { cn } from '@/lib/utils'
import type { JumpState } from '@/features/chapter/jump'
import { animationFrameScheduler, type FrameScheduler, type StarOnScreen } from '@/features/starmap/engine/starMapEngine'
import { placeBesideStar, type LabelSide, type Rect } from '@/features/starmap/lighting/labelPlace'
import { usePrefersReducedMotion } from '@/features/starmap/motion/usePrefersReducedMotion'

/** Frames the star must stay put before the bubble stops following it. */
const STILL_FRAMES = 12
/** Frames the star must stay put before the bubble first arrives: the camera has landed. */
const SETTLE_FRAMES = 4
/** The fade out when waved away, ms (`starmap.css`; reduced motion: `--motion-reduced`). */
export const BUBBLE_EXIT_MS = 160
/** The same, with reduced motion: `--motion-reduced`. */
export const REDUCED_EXIT_MS = 200
/** Narrower than this, the bubble does not fit beside its star: it docks across the map instead. */
export const DOCK_BELOW_PX = 560
/** The gutter a docked bubble keeps from the map's edges and its controls, CSS px. */
const GUTTER_PX = 16
/** A press that moves less than this, CSS px, is a tap (the engine's own slop). */
const TAP_SLOP_PX = 5
/** Murmi's middle from the bubble's left edge, CSS px: the card's padding (`px-4`) and half its 32px. */
const MURMI_MIDDLE_PX = 32

/**
 * Which way Murmi points from the bubble at `bubbleX` (its left edge) to the
 * star at `starX`: Murmi is drawn pointing right, and stands at the bubble's
 * left end, so a bubble to the right of its star has Murmi turn round.
 */
export function murmiFacing(starX: number, bubbleX: number): 'left' | 'right' {
  return starX < bubbleX + MURMI_MIDDLE_PX ? 'left' : 'right'
}

/** Half the width a star's name takes under it, at least, CSS px: the name is wider than the glyph. */
const NAME_HALF_WIDTH_PX = 56
/** The name's line under a star's glyph, CSS px. */
const NAME_LINE_PX = 24

/** What another star on screen needs kept clear (#586): its glyph and its name underneath. */
export function starBox(spot: StarOnScreen): Rect {
  const half = Math.max(spot.size / 2, NAME_HALF_WIDTH_PX)
  return { x0: spot.x - half, y0: spot.y - spot.size / 2, x1: spot.x + half, y1: spot.y + spot.size / 2 + NAME_LINE_PX }
}

/**
 * Beside its star, clear of `controls` and of other stars (#586): `strict`
 * (the star Murmi names, say) and the `rest`. When no side clears every star,
 * a side that clears `strict` wins over one that covers less in all.
 */
export function placeAvoiding(
  spot: StarOnScreen,
  size: { width: number; height: number },
  layer: { width: number; height: number },
  controls: readonly Rect[],
  strict: Rect | null,
  rest: readonly Rect[] = [],
  was?: LabelSide,
) {
  const gap = spot.size / 2 + 30
  const edges = [...(spot.keepClear ?? []), ...controls]
  const all = placeBesideStar(spot, size, gap, layer, [...edges, ...(strict ? [strict] : []), ...rest], was)
  if (!strict || !covers(all, size, strict)) return all
  const kept = placeBesideStar(spot, size, gap, layer, [...edges, strict], was)
  return covers(kept, size, strict) ? all : kept
}

function covers(place: { x: number; y: number }, size: { width: number; height: number }, box: Rect): boolean {
  return place.x < box.x1 && place.x + size.width > box.x0 && place.y < box.y1 && place.y + size.height > box.y0
}

/**
 * On a phone: across the map, just above the controls along its bottom (zoom,
 * help) -- or, where that would cover the star, or `strict` (the star Murmi
 * names, #586), just under the ones along its top (the switcher,
 * the way back).
 */
export function dockedPlace(
  spot: StarOnScreen,
  box: { height: number },
  layer: { width: number; height: number },
  controls: readonly Rect[],
  strict: Rect | null = null,
) {
  // Along the bottom: below 60% of the map; along the top: above 40%. Between them (Ask's button
  // on the edge) a control is beside the bubble, which stops short of it.
  const floor = Math.min(layer.height, ...controls.filter((rect) => rect.y0 > 0.6 * layer.height).map((rect) => rect.y0)) - GUTTER_PX
  const ceiling = Math.max(0, ...controls.filter((rect) => rect.y1 < 0.4 * layer.height).map((rect) => rect.y1)) + GUTTER_PX
  const low = floor - box.height
  const coversStar = spot.y + spot.size / 2 + GUTTER_PX > low || (strict !== null && strict.y1 + GUTTER_PX > low && strict.y0 < floor)
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

/** What the bubble hands its ways on. */
export type MurmiBubbleWays = {
  /** Wave Murmi away: a short fade, then `onDismiss`. */
  leave: () => void
  /** Docked across the map (a phone): ways on stack. */
  docked: boolean
  /** A link's click that goes to `to` by the jump from where `unitId` is drawn (#50 point 5), as the star's card does. */
  jumpFrom: (unitId: string, to: string) => (event: MouseEvent<HTMLAnchorElement>) => void
}

export type MurmiBubbleProps = {
  /** The star Murmi stands beside, and that has the focus once Murmi goes. */
  unitId: string
  /**
   * Other stars the bubble keeps clear of, glyph and name (#586): the stars on
   * a path, say. The first is kept clear before the rest -- the star Murmi names.
   */
  avoid?: readonly string[]
  /** The layer's mark (`data-…`), for the design preview and tests. */
  marker: `data-${string}`
  title: string
  body?: string
  /** A quieter line under the body: an aside, not the point (#643). */
  note?: string
  /** Said once when Murmi arrives; the title when absent. */
  announce?: string
  /** The ways on, under the line. */
  ways: (ways: MurmiBubbleWays) => ReactNode
  /** Docked across the map, the ways on stack instead of sitting in a row. */
  stackDocked?: boolean
  /** A ✕ in the corner, with this label, that waves Murmi away. */
  closeLabel?: string
  /** A tap on the map (not a drag) waves Murmi away. */
  leaveOnTap?: boolean
  /** The bubble's width beside its star (a Tailwind width), docked it spans the map. */
  widthClass?: string
  /** Where a star is drawn now, from the map's engine. */
  locate: (unitId: string) => StarOnScreen | null
  /** Calls `listener` when the map comes to rest; returns the way to stop. */
  watch?: (listener: () => void) => () => void
  onDismiss: () => void
  /** For tests: the frame clock. */
  scheduler?: FrameScheduler
}

export function MurmiBubble({
  unitId,
  avoid,
  marker,
  title,
  body,
  note,
  announce,
  ways,
  stackDocked = false,
  closeLabel,
  leaveOnTap = false,
  widthClass = 'w-[min(320px,calc(100%-32px))]',
  locate,
  watch,
  onDismiss,
  scheduler = animationFrameScheduler,
}: MurmiBubbleProps) {
  const navigate = useNavigate()
  const titleId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLElement>(null)
  const [placed, setPlaced] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [docked, setDocked] = useState(false)
  const [facing, setFacing] = useState<'left' | 'right'>('right')
  const reducedMotion = usePrefersReducedMotion()
  // The stars to keep clear, by value: a new array of the same stars does not restart the following.
  const avoidKey = (avoid ?? []).join('\n')

  useEffect(() => {
    const avoiding = avoidKey ? avoidKey.split('\n') : []
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
      const spot = locate(unitId)
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
        // Other stars on screen, glyph and name; the first named is kept clear before the rest.
        const boxOf = (other: string) => {
          const at = other === unitId ? null : locate(other)
          return at && at.x >= 0 && at.x <= width && at.y >= 0 && at.y <= height ? starBox(at) : null
        }
        const [strict = null, ...rest] = avoiding.map(boxOf)
        const others = rest.filter((other): other is Rect => other !== null)
        const isDocked = width < DOCK_BELOW_PX
        setDocked(isDocked)
        if (!isDocked) box.style.width = ''
        const size = { width: box.offsetWidth, height: box.offsetHeight }
        let at: { x: number; y: number; side: string }
        if (isDocked) {
          // Its height follows its width, so the next frame settles what this one measures.
          const dock = dockedPlace(spot, size, { width, height }, controls, strict)
          box.style.width = `${dock.width}px`
          at = dock
        } else {
          const beside = placeAvoiding(spot, size, { width, height }, controls, strict, others, side)
          side = beside.side
          at = beside
        }
        box.style.transform = `translate(${at.x}px, ${at.y}px)`
        box.dataset.side = at.side
        setFacing(murmiFacing(spot.x, at.x))
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
  }, [unitId, avoidKey, locate, watch, scheduler])

  // Into a chapter by the jump, from where a star is drawn (#50 point 5), as the star's card does.
  const jumpFrom = (from: string, to: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const spot = locate(from)
    const rect = rootRef.current?.getBoundingClientRect()
    if (!spot || !rect) return
    event.preventDefault()
    const state: JumpState = { jump: { x: rect.left + spot.x, y: rect.top + spot.y } }
    navigate(to, { state })
  }

  // Waved away: a short fade, then gone.
  const dismissRef = useRef(onDismiss)
  useEffect(() => {
    dismissRef.current = onDismiss
  }, [onDismiss])
  useEffect(() => {
    if (!leaving) return
    const timer = window.setTimeout(() => {
      // Focus was on the bubble, or nowhere: hand it to the star the bubble pointed at, or the map.
      const root = rootRef.current
      const active = document.activeElement
      const lost = !active || active === document.body || (root !== null && root.contains(active))
      if (lost && root) {
        const stage = root.parentElement
        const link = [...(stage?.querySelectorAll<HTMLElement>('[data-unit]') ?? [])].find((candidate) => candidate.dataset.unit === unitId)
        ;(link ?? stage)?.focus({ preventScroll: true })
      }
      dismissRef.current()
    }, reducedMotion ? REDUCED_EXIT_MS : BUBBLE_EXIT_MS)
    return () => window.clearTimeout(timer)
  }, [leaving, reducedMotion, unitId])
  const leave = () => setLeaving(true)

  // Escape sends Murmi away wherever focus is on the map -- the bubble does not take focus -- and
  // only Murmi: the map's own Escape waits for the next press. Not while a dialog (Ask's sheet,
  // the help) is open over the map: that Escape is the dialog's.
  useEffect(() => {
    if (!placed || leaving) return
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return
      event.stopPropagation()
      setLeaving(true)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [placed, leaving])

  // A tap on the map -- pressed and let go without moving, not on a control -- sends Murmi away.
  useEffect(() => {
    const stage = rootRef.current?.parentElement
    if (!leaveOnTap || !placed || leaving || !stage) return
    const presses = new Map<number, { x: number; y: number }>()
    const onControl = (event: PointerEvent) => event.target instanceof Element && Boolean(event.target.closest('[data-starmap-overlay]'))
    const down = (event: PointerEvent) => {
      if (!onControl(event)) presses.set(event.pointerId, { x: event.clientX, y: event.clientY })
    }
    const up = (event: PointerEvent) => {
      const press = presses.get(event.pointerId)
      presses.delete(event.pointerId)
      if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) < TAP_SLOP_PX) setLeaving(true)
    }
    const cancel = (event: PointerEvent) => presses.delete(event.pointerId)
    stage.addEventListener('pointerdown', down)
    stage.addEventListener('pointerup', up)
    stage.addEventListener('pointercancel', cancel)
    return () => {
      stage.removeEventListener('pointerdown', down)
      stage.removeEventListener('pointerup', up)
      stage.removeEventListener('pointercancel', cancel)
    }
  }, [leaveOnTap, placed, leaving])

  return (
    <div ref={rootRef} {...{ [marker]: unitId }} className="pointer-events-none absolute inset-0">
      {/* Said once when Murmi arrives; the bubble itself is not a live region. */}
      <p role="status" className="sr-only">
        {placed && !leaving ? (announce ?? title) : ''}
      </p>
      <aside
        ref={boxRef}
        data-starmap-overlay
        aria-labelledby={titleId}
        className={cn('absolute left-0 top-0', widthClass, leaving ? 'pointer-events-none' : 'pointer-events-auto')}
        style={{ visibility: 'hidden' }}
      >
        <div
          className="starmap-first-landing space-y-2 rounded-[var(--corner-card)] border border-solid border-[color:var(--sky-glass-border)] px-4 py-3 text-on-sky"
          data-shown={placed || undefined}
          data-leaving={leaving || undefined}
          style={{ background: 'var(--sky-glass)', backdropFilter: 'blur(var(--sky-glass-blur))', WebkitBackdropFilter: 'blur(var(--sky-glass-blur))' }}
        >
          <div className="flex items-center gap-2">
            {/* Pointing at the star it stands beside, whichever side of it the bubble is on. */}
            <Murmi mood="pointing" size={32} facing={facing} animated />
            <h2 id={titleId} className={cn('m-0 min-w-0 text-[15px] font-semibold text-[color:var(--on-sky-text)]', closeLabel && 'flex-1')}>
              {title}
            </h2>
            {closeLabel && (
              <button
                type="button"
                aria-label={closeLabel}
                title={closeLabel}
                onClick={leave}
                className="-mr-2 -my-1 inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[8px] border-0 bg-transparent p-0 text-[color:var(--on-sky-plain)] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring"
              >
                <X size={18} strokeWidth={1.6} aria-hidden="true" />
              </button>
            )}
          </div>
          {body && <p className="m-0 text-[13px] leading-5 text-[color:var(--on-sky-text-body)]">{body}</p>}
          {note && <p data-bubble-note className="m-0 text-[12px] leading-4 text-[color:var(--on-sky-text-body)]">{note}</p>}
          <div
            data-bubble-ways={stackDocked && docked ? 'stacked' : 'row'}
            className={cn('flex gap-x-2 gap-y-1 pt-0.5', stackDocked && docked ? 'flex-col items-stretch' : 'flex-wrap items-center')}
          >
            {ways({ leave, docked, jumpFrom })}
          </div>
        </div>
      </aside>
    </div>
  )
}
