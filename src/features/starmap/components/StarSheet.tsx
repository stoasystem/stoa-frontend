/*
 * A star's card on a phone (#139, round two E2 of #123): a sheet along the
 * bottom of the map instead of a card over half of it. Collapsed -- as it
 * opens -- it shows one row: the star's glyph, its name and state, and its
 * main action ("Continue"); the map keeps the rest of the screen and frames
 * the star above it (`view/layers.ts`'s `starFrameY`). Pulled up, or the
 * name tapped, it opens to every detail the wide card shows, at most
 * `SHEET.expandedMax` of the map's height; pulled down, it collapses again.
 *
 * It is still the star's card: an `article` named by the star's name, the
 * same way back, the same action. The name is a button that says whether the
 * details are open (`aria-expanded`); keyboard focus moving into the details
 * opens them, so nothing focused is ever hidden. Escape, the way back, a tap
 * on empty map and zooming out past the card close it, as before (the
 * stage's rules, `StarMapView`).
 */
import { ChevronUp } from 'lucide-react'
import { useCallback, useId, useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/base'
import { STAR_TITLE_ID, StarCardBack, StarCardDetails, useStarCardAction, type StarCardProps } from '@/features/starmap/components/StarCard'
import { StarGlyph } from '@/features/starmap/components/StarGlyph'
import { SHEET } from '@/features/starmap/view/semanticZoom'

export type SheetState = 'collapsed' | 'expanded'

/**
 * Where a let-go drag settles (#139): a flick follows its direction; a slow
 * release settles at the nearer state. `height` is the sheet's height when
 * let go, `velocity` px/ms (positive: upwards, growing).
 */
export function settleSheet(height: number, velocity: number, collapsed: number, expanded: number): SheetState {
  if (velocity > SHEET.flickSpeed) return 'expanded'
  if (velocity < -SHEET.flickSpeed) return 'collapsed'
  return height - collapsed > (expanded - collapsed) / 2 ? 'expanded' : 'collapsed'
}

export function StarSheet({
  map,
  demo = false,
  star,
  nebula,
  reducedMotion,
  onRest,
}: StarCardProps & {
  /** The sheet came to rest, collapsed or expanded, this many px tall. */
  onRest?: (height: number, state: SheetState) => void
}) {
  const { t } = useTranslation('starmap')
  const glyph = useRef<HTMLDivElement>(null)
  const sheet = useRef<HTMLElement>(null)
  const details = useRef<HTMLDivElement>(null)
  const detailsId = useId()
  const hintId = useId()
  const { action, chapterTo, jump } = useStarCardAction(star, demo, glyph)
  const [state, setState] = useState<SheetState>('collapsed')
  // Expanded: the row and every detail, but never over `SHEET.expandedMax` of the map.
  const [expandedPx, setExpandedPx] = useState<number>(SHEET.collapsedPx)
  // While a finger or the mouse pulls the sheet: how far, px (positive: up).
  const [pull, setPull] = useState<number | null>(null)
  const press = useRef<{ id: number; y: number; at: number; moved: boolean; lastY: number; lastAt: number; velocity: number } | null>(null)
  const dragged = useRef(false)

  const measure = useCallback(() => {
    const element = sheet.current
    const content = details.current
    if (!element || !content) return
    const room = (element.offsetParent as HTMLElement | null)?.clientHeight ?? 0
    const natural = SHEET.collapsedPx + content.scrollHeight
    const most = room > 0 ? Math.max(SHEET.collapsedPx, Math.floor(room * SHEET.expandedMax)) : natural
    const next = Math.min(natural, most)
    setExpandedPx((old) => (old === next ? old : next))
  }, [])

  useLayoutEffect(() => {
    measure()
    const content = details.current
    if (!content || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(content)
    if (content.firstElementChild) observer.observe(content.firstElementChild)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  const restPx = state === 'expanded' ? expandedPx : SHEET.collapsedPx
  const height = pull === null ? restPx : Math.max(SHEET.collapsedPx, Math.min(expandedPx, restPx + pull))

  const restRef = useRef(onRest)
  useLayoutEffect(() => {
    restRef.current = onRest
  })
  useLayoutEffect(() => {
    restRef.current?.(restPx, state)
  }, [restPx, state])

  const toggle = () => setState((old) => (old === 'expanded' ? 'collapsed' : 'expanded'))

  // The head (grabber and row) is the handle: a drag up opens, down closes; a
  // tap on it (not on the action) toggles. The pointer is captured only once
  // it has moved, so a plain tap stays a click on whatever it was on.
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if ((event.target as Element).closest('a')) return
    press.current = { id: event.pointerId, y: event.clientY, at: event.timeStamp, moved: false, lastY: event.clientY, lastAt: event.timeStamp, velocity: 0 }
    dragged.current = false
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = press.current
    if (!current || current.id !== event.pointerId) return
    const up = current.y - event.clientY
    if (!current.moved) {
      if (Math.abs(up) < SHEET.tapSlopPx) return
      current.moved = true
      event.currentTarget.setPointerCapture?.(event.pointerId)
    }
    const elapsed = event.timeStamp - current.lastAt
    if (elapsed > 0) current.velocity = (current.lastY - event.clientY) / elapsed
    current.lastY = event.clientY
    current.lastAt = event.timeStamp
    setPull(up)
  }
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const current = press.current
    if (!current || current.id !== event.pointerId) return
    press.current = null
    if (!current.moved) return
    dragged.current = true
    // A pause before letting go is no flick.
    const velocity = event.timeStamp - current.lastAt > 80 ? 0 : current.velocity
    const up = current.y - event.clientY
    const heldAt = Math.max(SHEET.collapsedPx, Math.min(expandedPx, restPx + up))
    setState(settleSheet(heldAt, velocity, SHEET.collapsedPx, expandedPx))
    setPull(null)
  }
  const onPointerCancel = () => {
    press.current = null
    setPull(null)
  }
  // A tap on the head's empty space toggles too; the name's button and the action handle their own.
  const onHeadClick = (event: MouseEvent<HTMLDivElement>) => {
    if (dragged.current) {
      dragged.current = false
      return
    }
    if ((event.target as Element).closest('a, button')) return
    toggle()
  }
  const onTitleClick = () => {
    if (dragged.current) {
      dragged.current = false
      return
    }
    toggle()
  }

  return (
    <article
      ref={sheet}
      aria-labelledby={STAR_TITLE_ID}
      data-star-sheet={state}
      className="pointer-events-auto absolute inset-x-3 flex flex-col overflow-hidden rounded-[16px] border border-solid border-[color:var(--sky-glass-border)] text-on-sky"
      style={{
        bottom: `calc(${SHEET.marginPx}px + var(--page-bottom-inset, 0px))`,
        height,
        background: 'var(--sky-glass)',
        backdropFilter: 'blur(var(--sky-glass-blur))',
        WebkitBackdropFilter: 'blur(var(--sky-glass-blur))',
        boxShadow: 'var(--shadow-glass)',
        transition: pull !== null || reducedMotion ? 'none' : 'height var(--motion-sheet) var(--ease-standard)',
      }}
    >
      <div
        data-star-sheet-head
        className="flex shrink-0 cursor-grab touch-none flex-col"
        style={{ height: SHEET.collapsedPx - 2 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClick={onHeadClick}
      >
        <div className="flex justify-center pt-1.5 pb-1" aria-hidden="true">
          <span className="block h-[5px] w-9 rounded-[3px] bg-white/35" />
        </div>
        <div className="flex min-h-0 flex-1 items-center gap-2.5 px-3 pb-2">
          <div ref={glyph} className="shrink-0">
            <StarGlyph
              state={star.state}
              size={36}
              progress={star.progress}
              recommended={Boolean(star.recommendation)}
              reviewDue={star.reviewDue > 0}
              breathe={!reducedMotion && Boolean(star.recommendation)}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <h1 id={STAR_TITLE_ID} className="m-0 min-w-0 text-[17px] font-semibold leading-tight tracking-[-0.3px] text-on-sky">
              <button
                type="button"
                aria-expanded={state === 'expanded'}
                aria-controls={detailsId}
                aria-describedby={hintId}
                onClick={onTitleClick}
                // The name is short; its touch target is 44 px tall all the same (it reaches over the grabber and the state line).
                className="relative -mx-1 inline-flex max-w-full cursor-pointer items-center gap-1 rounded-[8px] border-0 bg-transparent px-1 py-0 text-left before:absolute before:inset-x-0 before:-inset-y-3 before:content-[''] font-[inherit] text-[length:inherit] leading-[inherit] text-[color:inherit] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring"
              >
                <span className="truncate">{star.name}</span>
                <ChevronUp
                  size={16}
                  strokeWidth={1.8}
                  aria-hidden="true"
                  className="shrink-0 text-[color:var(--on-sky-text-body)]"
                  style={{ transform: state === 'expanded' ? 'rotate(180deg)' : undefined, transition: reducedMotion ? undefined : 'transform var(--motion-sheet) var(--ease-standard)' }}
                />
              </button>
            </h1>
            <p className="m-0 truncate text-[13px] text-[color:var(--on-sky-text-body)]">
              {t('star.inNebula', { nebula: nebula.name, state: t(`state.${star.state}`) })}
            </p>
            <span id={hintId} hidden>
              {t('star.sheetDetails')}
            </span>
          </div>
          {action && (
            <Button asChild variant="onSky" size="regular" className="shrink-0">
              <Link to={chapterTo} onClick={jump}>{action}</Link>
            </Button>
          )}
        </div>
      </div>

      <div
        ref={details}
        id={detailsId}
        data-star-sheet-details
        // Keyboard focus moving into the details opens them: nothing focused is ever clipped away.
        onFocus={() => setState('expanded')}
        className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain"
      >
        <div className="flex flex-col gap-3 px-[18px] pt-1 pb-[18px]">
          <StarCardBack map={map} nebula={nebula} />
          <StarCardDetails map={map} demo={demo} star={star} />
        </div>
      </div>
    </article>
  )
}
