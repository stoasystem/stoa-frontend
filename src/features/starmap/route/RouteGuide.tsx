/*
 * Murmi in a star cluster's route scene (#747).
 *
 *   - `SceneLandingBubble`: a newcomer's first landing opens the scene on
 *     the recommended star, its card open (`useFirstLanding`); Murmi says
 *     start here, and that the card's "Start practising" begins, and keeps
 *     the landing's "Find my own star" (#586). Beside the card on a wide
 *     screen, above it on a phone.
 *   - `RouteTour`: the first visit to a scene (once per account,
 *     `shownOnce.ts`; not on the newcomer's landing visit, which has Murmi
 *     already) walks through how to read it in up to three steps -- the main
 *     line, a chapter header, an entrance from another cluster when there
 *     is one -- each picked out by a ring. "Next" goes on, "Got it" on the
 *     last step, ✕ and Escape close it. Focus moves to each step's card and,
 *     closed, back to where it was. Not modal: the route behind stays
 *     usable. Under reduced motion nothing slides or fades. The scene's
 *     header replays it ("How to read this map").
 */
import { X } from 'lucide-react'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/base'
import { Murmi } from '@/components/brand/Murmi'
import { usePrefersReducedMotion } from '@/features/starmap/motion/usePrefersReducedMotion'

const GLASS = { background: 'var(--sky-glass)', backdropFilter: 'blur(var(--sky-glass-blur))', WebkitBackdropFilter: 'blur(var(--sky-glass-blur))' }

export function SceneLandingBubble({ name, cluster, onFindOwn, onDismiss }: { name: string; cluster: string; onFindOwn?: () => void; onDismiss: () => void }) {
  const { t } = useTranslation('starmap')
  const titleId = useId()
  return (
    <aside
      data-scene-landing
      aria-labelledby={titleId}
      className="pointer-events-auto w-full max-w-[360px] space-y-2 rounded-[var(--corner-card)] border border-solid border-[color:var(--sky-glass-border)] px-4 py-3 text-on-sky"
      style={GLASS}
    >
      <p role="status" className="sr-only">
        {t('clusterGuide.landingTitle', { name })}
      </p>
      <div className="flex items-center gap-2">
        <Murmi mood="pointing" size={32} facing="right" animated />
        <h2 id={titleId} className="m-0 min-w-0 flex-1 text-[15px] font-semibold text-[color:var(--on-sky-text)]">
          {t('clusterGuide.landingTitle', { name })}
        </h2>
        <CloseButton label={t('clusterGuide.close')} onClick={onDismiss} />
      </div>
      <p className="m-0 text-[13px] leading-5 text-[color:var(--on-sky-text-body)]">
        {t('clusterGuide.landingBody', { cluster, action: t('clusters.practise') })}
      </p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5">
        {onFindOwn && (
          // Knows all this already (#586): Ask's docked composer offers what to say; Murmi goes.
          <Button
            lift
            variant="onSky"
            size="small"
            onClick={() => {
              onFindOwn()
              onDismiss()
            }}
          >
            {t('firstLanding.findOwn')}
          </Button>
        )}
        <Button variant="onSkyPlain" size="small" onClick={onDismiss}>
          {t('clusterGuide.gotIt')}
        </Button>
      </div>
    </aside>
  )
}

function CloseButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="-mr-2 -my-1 inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[8px] border-0 bg-transparent p-0 text-[color:var(--on-sky-plain)] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring"
    >
      <X size={18} strokeWidth={1.6} aria-hidden="true" />
    </button>
  )
}

/** One step of the tour: what it picks out (a selector inside the scene), and what Murmi says. */
export type TourStep = { id: 'main' | 'chapter' | 'entrance'; selector: string; title: string; body: string }

/** The tour's steps for a scene: the main line, a chapter header, and an entrance when the route has one. */
export function tourSteps(t: (key: string) => string, hasEntrance: boolean): TourStep[] {
  const steps: TourStep[] = [
    { id: 'main', selector: '[data-main]', title: t('clusterGuide.tourMainTitle'), body: t('clusterGuide.tourMainBody') },
    { id: 'chapter', selector: '[data-chapter-header]', title: t('clusterGuide.tourChapterTitle'), body: t('clusterGuide.tourChapterBody') },
  ]
  if (hasEntrance) steps.push({ id: 'entrance', selector: '[data-route-entrance]', title: t('clusterGuide.tourEntranceTitle'), body: t('clusterGuide.tourEntranceBody') })
  return steps
}

type Box = { left: number; top: number; width: number; height: number }

/** Room round the picked-out element, CSS px. */
const RING_PAD = 6
/** Narrower than this, the step's card docks along the scene's bottom. */
const DOCK_BELOW_PX = 560

/**
 * What a step picks out, in `root`'s px: the elements it selects that are in
 * view in `scroller` (the main line: every main-line star in view), cut to
 * the scroller's visible part; null if none is in view.
 */
function pickedOut(root: HTMLElement, scroller: HTMLElement | null, selector: string, all: boolean): Box | null {
  const view = (scroller ?? root).getBoundingClientRect()
  const origin = root.getBoundingClientRect()
  const inView = [...root.querySelectorAll<Element>(selector)]
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.right > view.left && r.left < view.right)
  const rects = all ? inView : inView.slice(0, 1)
  if (rects.length === 0) return null
  const left = Math.max(view.left, Math.min(...rects.map((r) => r.left))) - RING_PAD
  const right = Math.min(view.right, Math.max(...rects.map((r) => r.right))) + RING_PAD
  const top = Math.min(...rects.map((r) => r.top)) - RING_PAD
  const bottom = Math.max(...rects.map((r) => r.bottom)) + RING_PAD
  return { left: left - origin.left, top: top - origin.top, width: right - left, height: bottom - top }
}

export function RouteTour({
  steps,
  root,
  scroller,
  onClose,
}: {
  steps: readonly TourStep[]
  /** The scene: the tour is laid over it, in its px. */
  root: RefObject<HTMLElement | null>
  /** The route's scroller: a step's element is brought into it, and picked out where it shows. */
  scroller: RefObject<HTMLElement | null>
  onClose: () => void
}) {
  const { t } = useTranslation('starmap')
  const reducedMotion = usePrefersReducedMotion()
  const titleId = useId()
  const [index, setIndex] = useState(0)
  const [box, setBox] = useState<Box | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const cardRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  // Where focus was when the tour began: it goes back there.
  const [before] = useState(() => (document.activeElement instanceof HTMLElement ? document.activeElement : null))
  const step = steps[Math.min(index, steps.length - 1)]
  const last = index >= steps.length - 1

  const close = useCallback(() => {
    onClose()
    const back = before && before.isConnected && before !== document.body ? before : root.current?.querySelector<HTMLElement>('#cluster-route-title')
    back?.focus({ preventScroll: true })
  }, [before, onClose, root])

  // Each step: its element brought into the route's view, then picked out; followed as the route scrolls or the screen turns.
  useLayoutEffect(() => {
    const el = root.current?.querySelector<HTMLElement>(step.selector)
    const roll = scroller.current
    if (el && roll) {
      const r = el.getBoundingClientRect()
      const v = roll.getBoundingClientRect()
      if (r.left < v.left + 24 || r.right > v.right - 24) {
        const to = roll.scrollLeft + (r.left - v.left) - Math.max(24, (v.width - r.width) / 4)
        if (typeof roll.scrollTo === 'function') roll.scrollTo({ left: Math.max(0, to), behavior: reducedMotion ? 'auto' : 'smooth' })
        else roll.scrollLeft = Math.max(0, to)
      }
    }
    let frame = 0
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const host = root.current
        if (!host) return
        setBox(pickedOut(host, scroller.current, step.selector, step.id === 'main'))
        setSize({ width: host.clientWidth, height: host.clientHeight })
      })
    }
    measure()
    const rolled = scroller.current
    rolled?.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(frame)
      rolled?.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [step, root, scroller, reducedMotion])

  // Focus follows the steps, so a screen reader reads each one.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [index])

  // Escape closes the tour, and only the tour: a card open behind it stays.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      event.preventDefault()
      event.stopImmediatePropagation()
      close()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [close])

  const docked = size.width > 0 && size.width < DOCK_BELOW_PX
  const cardWidth = Math.min(340, Math.max(0, size.width - 32))
  const place = (() => {
    if (docked || !box) return null
    const below = box.top + box.height + 12
    const top = below + 200 < size.height ? below : Math.max(12, box.top - 12 - 200)
    const left = Math.min(Math.max(16, box.left), Math.max(16, size.width - cardWidth - 16))
    return { left, top }
  })()

  return (
    <div data-route-tour={step.id} className="pointer-events-none absolute inset-0 z-30">
      {box && (
        <div
          aria-hidden="true"
          data-tour-ring
          className="absolute rounded-[14px] border-2 border-solid"
          style={{
            left: box.left,
            top: box.top,
            width: box.width,
            height: box.height,
            borderColor: 'var(--starmap-recommended, rgba(242, 197, 114, 0.95))',
            boxShadow: '0 0 0 4px rgba(242, 197, 114, 0.18)',
            transition: reducedMotion ? 'none' : 'left 200ms ease, top 200ms ease, width 200ms ease, height 200ms ease',
          }}
        />
      )}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-label={t('clusterGuide.tourLabel')}
        aria-describedby={titleId}
        data-tour-card
        className={docked || !place ? 'pointer-events-auto absolute inset-x-3 bottom-3 space-y-2 rounded-[var(--corner-card)] border border-solid border-[color:var(--sky-glass-border)] px-4 py-3 text-on-sky' : 'pointer-events-auto absolute space-y-2 rounded-[var(--corner-card)] border border-solid border-[color:var(--sky-glass-border)] px-4 py-3 text-on-sky'}
        style={{ ...GLASS, ...(place ? { left: place.left, top: place.top, width: cardWidth } : {}) }}
      >
        <div className="flex items-center gap-2">
          <Murmi mood="pointing" size={32} facing="right" animated={!reducedMotion} />
          <h2 ref={headingRef} id={titleId} tabIndex={-1} className="m-0 min-w-0 flex-1 text-[15px] font-semibold text-[color:var(--on-sky-text)] outline-none">
            {step.title}
          </h2>
          <CloseButton label={t('clusterGuide.close')} onClick={close} />
        </div>
        <p className="m-0 text-[13px] leading-5 text-[color:var(--on-sky-text-body)]">{step.body}</p>
        <div className="flex items-center gap-2 pt-0.5">
          <span className="mr-auto text-[12px] text-[color:var(--on-sky-text-caption)]">
            {t('clusterGuide.tourStep', { step: index + 1, count: steps.length })}
          </span>
          {last ? (
            <Button variant="onSky" size="small" onClick={close} data-tour-done>
              {t('clusterGuide.gotIt')}
            </Button>
          ) : (
            <Button variant="onSky" size="small" onClick={() => setIndex((i) => i + 1)} data-tour-next>
              {t('clusterGuide.next')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
