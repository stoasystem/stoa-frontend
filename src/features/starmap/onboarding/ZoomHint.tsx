/*
 * The zoom hint (#756): one line beside the zoom buttons that says what a tap
 * does at the zoom the student is at, because the rule changes with it
 * (`StarMapEngine.choose`).
 *
 *   - From far out, stars too small to pick one by one: a tap on a cluster
 *     goes into it. On the whole view of a sky of clusters that is its
 *     learning route (#747); a little further in, a flight into it. The
 *     wheel or a pinch gets there too.
 *   - Up close, stars pickable: any star opens with a tap (the gold route
 *     only suggests, ADR 0004), and zooming out goes back to the whole sky.
 *
 * Each line goes for good once the student has done what it says: gone into
 * a cluster with a tap, opened a star. Remembered per account on this browser
 * (`shownOnce.ts`); storage refused, it still goes for the rest of the visit.
 * It says one thing at a time and never over Murmi or a first-run screen: the
 * page holds `guide` back then (`StarMapRoute`), and the line is not drawn with a star chosen,
 * where its card or sheet has the stage.
 *
 * It fades in and out (`--motion-panel`, 200 ms linear under reduced motion)
 * and never moves.
 */
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ZoomState } from '@/features/starmap/engine/starMapEngine'
import { usePrefersReducedMotion } from '@/features/starmap/motion/usePrefersReducedMotion'
import { markShown, shownBefore } from '@/features/starmap/onboarding/shownOnce'
import type { LayerTarget } from '@/features/starmap/view/layers'
import { TOUCH_QUERY, useMediaQuery } from '@/hooks/layout/useMediaQuery'
import { cn } from '@/lib/utils'

/** Which of the two lines the student still has to be told. */
export type ZoomGuide = { far: boolean; near: boolean }

/** The line shown: far out on the whole view (a cluster opens its route), far out past it (a flight in), up close. */
export type ZoomHintLine = 'cluster' | 'far' | 'near'

/**
 * The line for this zoom and choice, or null. Far out only with nothing
 * chosen (a nebula chosen and zoomed out of is the student's own doing); up
 * close on the whole map or in a nebula; never with a star chosen.
 */
export function zoomHintLine(
  zoom: Pick<ZoomState, 'pickable' | 'wholeView'>,
  layer: LayerTarget['layer'],
  clustersOpen: boolean,
  guide: ZoomGuide | null | undefined,
): ZoomHintLine | null {
  if (!guide || layer === 'star') return null
  if (zoom.pickable) return guide.near ? 'near' : null
  if (layer !== 'map' || !guide.far) return null
  return zoom.wholeView && clustersOpen ? 'cluster' : 'far'
}

export type ZoomHint = {
  /** The lines still to give, or null once both are done. The page holds it back while Murmi or a first-run screen is up. */
  guide: ZoomGuide | null
  /** A cluster was gone into by a tap (its route scene opened from the whole view). */
  wentIn: () => void
  /** A choice made on the map, and the route it was made from: a cluster flown into, a star opened. */
  chose: (next: LayerTarget, from: LayerTarget) => void
}

export function useZoomHint(ownerId: string): ZoomHint {
  const read = (id: string) => ({ ownerId: id, far: shownBefore('zoomHintFar', id), near: shownBefore('zoomHintNear', id) })
  const [done, setDone] = useState(() => read(ownerId))
  if (done.ownerId !== ownerId) setDone(read(ownerId))
  const wentIn = useCallback(() => {
    markShown('zoomHintFar', ownerId)
    setDone((old) => (old.far ? old : { ...old, far: true }))
  }, [ownerId])
  const openedStar = useCallback(() => {
    markShown('zoomHintNear', ownerId)
    setDone((old) => (old.near ? old : { ...old, near: true }))
  }, [ownerId])
  const chose = useCallback(
    (next: LayerTarget, from: LayerTarget) => {
      if (next.layer === 'star') openedStar()
      // A star's card closed back onto its own nebula is a choice let go, not a way in.
      else if (next.layer === 'nebula' && !(from.layer !== 'map' && from.nebulaId === next.nebulaId)) wentIn()
    },
    [openedStar, wentIn],
  )
  const guide = useMemo(() => (done.far && done.near ? null : { far: !done.far, near: !done.near }), [done.far, done.near])
  return { guide, wentIn, chose }
}

const GLASS = {
  background: 'var(--sky-glass)',
  backdropFilter: 'blur(var(--sky-glass-blur))',
  WebkitBackdropFilter: 'blur(var(--sky-glass-blur))',
} as const

/**
 * The line on screen. Wide: left of the zoom pair, level with its lower
 * button. Phone: along the bottom between the help star and the zoom
 * buttons' corner (`REVEAL.phoneZoomCorner`), wrapping to two lines if it
 * must; the line is never drawn with a star chosen, so never over its sheet.
 */
export function ZoomHintText({ line, wide }: { line: ZoomHintLine | null; wide: boolean }) {
  const { t } = useTranslation('starmap')
  const touch = useMediaQuery(TOUCH_QUERY)
  const reducedMotion = usePrefersReducedMotion()
  // The words stay while the line fades out.
  const [said, setSaid] = useState(line)
  if (line !== null && line !== said) setSaid(line)
  if (said === null) return null
  const key = `zoomHint.${said}${touch ? 'Touch' : ''}` as const
  return (
    <div
      data-starmap-overlay
      aria-hidden={line === null ? true : undefined}
      className={cn(
        'pointer-events-none absolute flex',
        wide
          ? 'right-[76px] bottom-[calc(1.5rem+4px+var(--page-bottom-inset,0px))] max-w-[min(560px,calc(100%-140px))] justify-end'
          : 'right-[66px] bottom-[calc(1rem+4px+var(--page-bottom-inset,0px))] left-[56px] justify-center',
      )}
    >
      <p
        data-zoom-hint={line ?? undefined}
        className={cn(
          'm-0 rounded-[14px] border border-solid border-[color:var(--sky-glass-border)] px-3 py-1.5 text-[color:var(--on-sky-text-body)] transition-opacity starting:opacity-0',
          // Wide: one line where it fits, else two. Phone: two lines at most in the map's bottom band (`controlBands`).
          wide ? 'text-right text-[13px] leading-snug' : 'text-center text-[12px] leading-tight',
          line === null ? 'opacity-0' : 'opacity-100',
          reducedMotion ? 'duration-200 ease-linear' : 'duration-[var(--motion-panel)] ease-[var(--ease-out)]',
        )}
        style={GLASS}
      >
        {t(key)}
      </p>
    </div>
  )
}
