/*
 * The star map on screen (#47, #72): a canvas the engine draws, the parallel
 * DOM a screen reader and a keyboard use instead of it, and the controls
 * around it -- the subject switcher, where you are, zoom, the legend.
 *
 * The canvas is hidden from assistive technology. Every star the current
 * layer has on screen is an `<a>` placed over its glyph, blurred or not (the
 * blur is visual only), in the order nebula first, then
 * `(topic.order, unit.order)`; its text is the star's name, learning state,
 * progress and markers (#11 point 5). The star layer is plain HTML and SVG.
 */
import { ChevronLeft, Minus, Plus } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { SegmentedNav } from '@/components/base'
import { StarCard } from '@/features/starmap/components/StarCard'
import { StarGlyph } from '@/features/starmap/components/StarGlyph'
import { nebulaLabel, starLabel } from '@/features/starmap/components/labels'
import { nebulaLinks } from '@/features/starmap/model/links'
import { StarMapEngine, type FrameScheduler, type NebulaDiscOnScreen, type StarOnScreen, type VisibleStar } from '@/features/starmap/engine/starMapEngine'
import { LEARNING_STATES, nebulaCounts, orderedNebulae, orderedStars, subjectOfNebula, type StarMap } from '@/features/starmap/model/starMap'
import { usePrefersReducedMotion } from '@/features/starmap/motion/usePrefersReducedMotion'
import { createRenderer } from '@/features/starmap/render/createRenderer'
import type { StarMapRenderer, StarMapTheme } from '@/features/starmap/render/types'
import { isWide, nebulaFocusSpot, NEBULA_FOCUS_HEIGHT, pathForTarget, type LayerTarget } from '@/features/starmap/view/layers'
import { cn } from '@/lib/utils'
import '@/features/starmap/starmap.css'

const THEME_FALLBACK: StarMapTheme = {
  sky: '#0A1020',
  atmosphere: 'rgba(120, 160, 255, 0.16)',
  lit: '#F2C572',
  litCore: '#FFF8EA',
  text: '#FFFFFF',
  textBody: 'rgba(255, 255, 255, 0.75)',
  textCaption: 'rgba(255, 255, 255, 0.65)',
  fontFamily: 'system-ui, sans-serif',
}

/** The sky tokens as the canvas needs them, read where `data-surface="sky"` defines them. */
function readTheme(element: Element): StarMapTheme {
  const style = getComputedStyle(element)
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback
  return {
    sky: read('--sky', THEME_FALLBACK.sky),
    atmosphere: read('--atmosphere', THEME_FALLBACK.atmosphere),
    lit: read('--lit', THEME_FALLBACK.lit),
    litCore: read('--lit-core', THEME_FALLBACK.litCore),
    text: read('--on-sky-text', THEME_FALLBACK.text),
    textBody: read('--on-sky-text-body', THEME_FALLBACK.textBody),
    textCaption: read('--on-sky-text-caption', THEME_FALLBACK.textCaption),
    fontFamily: read('--font-system', THEME_FALLBACK.fontFamily),
  }
}

export type StarMapViewProps = {
  map: StarMap
  /** Fixture-backed route: label sample progress and keep chapter actions local. */
  demo?: boolean
  target: LayerTarget
  /** Go to another layer's route. */
  onNavigate: (target: LayerTarget) => void
  /** The first frame with the map on it is on screen. */
  onFirstFrame?: () => void
  /** One sky: at rest on the whole map, another galaxy is at the centre of the view (the header follows it). */
  onCentreGalaxy?: (subjectId: string) => void
  /** Foveated rendering; the phone bench switches it off (#44). Read once, when the canvas mounts. */
  foveate?: boolean
  /** For tests: the frame clock and the renderer. */
  scheduler?: FrameScheduler
  createRendererFor?: (canvas: HTMLCanvasElement) => StarMapRenderer
  /** Drawn above the canvas, below the controls: the lighting layer (#51), told where a star is drawn. */
  overlay?: (locate: (unitId: string) => StarOnScreen | null) => ReactNode
}

/**
 * The canvas's pixels per CSS pixel: the screen's, but never over 2. A 3x
 * phone would fill 2.25 times the pixels of 2x for detail nobody can see on
 * a map of soft glows, and pay for it in every frame.
 */
export const MAX_PIXEL_RATIO = 2

export function canvasPixelRatio(): number {
  return Math.min(MAX_PIXEL_RATIO, window.devicePixelRatio || 1)
}

/**
 * The bands the page keeps over the canvas for its own controls, CSS px: the
 * subject switcher and where-you-are line above; the legend (wide) or the zoom
 * buttons (phone) below. The whole map fits between them.
 */
export function controlBands(wide: boolean, bottomInset = 0, demo = false): { top: number; bottom: number } {
  const noticeHeight = demo ? 32 : 0
  return wide ? { top: 76 + noticeHeight, bottom: 164 + bottomInset } : { top: 112 + noticeHeight, bottom: 72 + bottomInset }
}

/** A link's box: the glyph, but never under 32 px, so the focus ring can be seen. */
function linkSize(glyph: number): number {
  return Math.round(Math.max(32, Math.min(56, glyph * 0.75)))
}

const OVERLAY_LINK =
  'inline-flex min-h-11 items-center text-on-sky hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

export function StarMapView({ map, demo = false, target, onNavigate, onFirstFrame, onCentreGalaxy, foveate, scheduler, createRendererFor, overlay }: StarMapViewProps) {
  const { t, i18n } = useTranslation('starmap')
  const reducedMotion = usePrefersReducedMotion()
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<StarMapEngine | null>(null)
  const [visible, setVisible] = useState<{ stars: VisibleStar[]; glyph: number; nebulae: NebulaDiscOnScreen[] }>({
    stars: [],
    glyph: 12,
    nebulae: [],
  })
  const [stageSize, setStageSize] = useState({ width: 0, height: 0, bottomInset: 0 })
  const [wide, setWide] = useState(true)
  const [announcement, setAnnouncement] = useState('')
  const [focusPill, setFocusPill] = useState<{ id: string; width: number; height: number } | null>(null)

  // Keep the latest callbacks without rebuilding the engine.
  const navigateRef = useRef(onNavigate)
  const firstFrameRef = useRef(onFirstFrame)
  const centreRef = useRef(onCentreGalaxy)
  useLayoutEffect(() => {
    navigateRef.current = onNavigate
    firstFrameRef.current = onFirstFrame
    centreRef.current = onCentreGalaxy
  })

  const stars = useMemo(() => orderedStars(map), [map])
  const nebulae = useMemo(() => orderedNebulae(map).filter((n) => stars.some((s) => s.nebulaId === n.topicId)), [map, stars])
  // The lines between nebulae carry meaning, so the parallel DOM says them too.
  const relatedTo = useMemo(() => {
    const names = new Map(nebulae.map((n) => [n.topicId, n.name]))
    const order = new Map(nebulae.map((n, i) => [n.topicId, i]))
    const related = new Map<string, string[]>()
    for (const link of nebulaLinks(map)) {
      related.set(link.a, [...(related.get(link.a) ?? []), link.b])
      related.set(link.b, [...(related.get(link.b) ?? []), link.a])
    }
    const byOrder = (a: string, b: string) => (order.get(a) ?? 0) - (order.get(b) ?? 0)
    return new Map([...related].map(([id, others]) => [id, others.sort(byOrder).map((other) => names.get(other) ?? other)]))
  }, [map, nebulae])
  const nebulaText = (nebula: (typeof nebulae)[number]) => {
    const related = relatedTo.get(nebula.topicId)
    const base = nebulaLabel(t, nebula, stars)
    return related?.length ? t('nebula.related', { base, list: related.join(', ') }) : base
  }
  const subjectId = map.subject.subjectId

  // The engine lives as long as the canvas.
  useEffect(() => {
    const canvas = canvasRef.current
    const stage = stageRef.current
    if (!canvas || !stage) return
    const engine = new StarMapEngine({
      renderer: createRendererFor ? createRendererFor(canvas) : createRenderer(canvas),
      theme: readTheme(stage),
      reducedMotion,
      foveate,
      // One sky (#119) whenever the map says which galaxy each nebula is in.
      galaxy: true,
      scheduler,
      onRequestTarget: (next) => navigateRef.current(next),
      onVisibleChange: (list, glyph, discs) => setVisible({ stars: list, glyph, nebulae: discs }),
      onFirstFrame: () => firstFrameRef.current?.(),
      onCentreGalaxy: (id) => centreRef.current?.(id),
    })
    engineRef.current = engine

    // Follow the page area's own size, not the window's: it narrows when the
    // Ask panel opens beside it (#49).
    const measure = () => {
      const rect = stage.getBoundingClientRect()
      const isWideNow = isWide({ width: rect.width, height: rect.height })
      const bottomInset = parseFloat(getComputedStyle(stage).getPropertyValue('--page-bottom-inset')) || 0
      engine.setViewport(Math.round(rect.width), Math.round(rect.height), canvasPixelRatio(), controlBands(isWideNow, bottomInset, demo))
      setWide(isWideNow)
      setStageSize({ width: Math.round(rect.width), height: Math.round(rect.height), bottomInset })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(stage)

    // The pixel ratio changes when the window moves to another screen or the
    // page is zoomed; a size observer does not see it. Watch the ratio itself.
    let ratioQuery: MediaQueryList | null = null
    const onRatio = () => {
      measure()
      watchRatio()
    }
    const watchRatio = () => {
      ratioQuery?.removeEventListener?.('change', onRatio)
      ratioQuery = typeof window.matchMedia === 'function' ? window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`) : null
      ratioQuery?.addEventListener?.('change', onRatio)
    }
    watchRatio()

    const onWheel = (event: WheelEvent) => {
      const rect = stage.getBoundingClientRect()
      // Trackpad pinch arrives as a ctrl+wheel; both zoom the map, not the page.
      event.preventDefault()
      engine.wheelBy(event.deltaY * (event.ctrlKey ? 10 : 1), event.clientX - rect.left, event.clientY - rect.top)
    }
    stage.addEventListener('wheel', onWheel, { passive: false })

    // Nothing moves by itself while the map cannot be used: an ancestor is
    // `inert` (the phone's Ask sheet is open, #49) or the tab is hidden.
    const syncPaused = () => engine.setPaused(Boolean(stage.closest('[inert]')) || document.hidden)
    const inertWatch = new MutationObserver(syncPaused)
    for (let node: Element | null = stage; node; node = node.parentElement) {
      inertWatch.observe(node, { attributes: true, attributeFilter: ['inert'] })
    }
    document.addEventListener('visibilitychange', syncPaused)
    syncPaused()

    return () => {
      ratioQuery?.removeEventListener?.('change', onRatio)
      document.removeEventListener('visibilitychange', syncPaused)
      inertWatch.disconnect()
      stage.removeEventListener('wheel', onWheel)
      observer.disconnect()
      engine.destroy()
      engineRef.current = null
    }
    // The engine is built once per canvas; data, target and motion arrive below.
  }, [])

  useEffect(() => {
    engineRef.current?.setData(map, target)
    // A new map starts from its own target; later targets animate.
  }, [map])

  useEffect(() => {
    engineRef.current?.setTarget(target)
  }, [target])

  useEffect(() => {
    engineRef.current?.setReducedMotion(reducedMotion)
  }, [reducedMotion])

  // Say where the student is now, after they move (not on arrival).
  const firstTarget = useRef(true)
  useEffect(() => {
    if (firstTarget.current) {
      firstTarget.current = false
      return
    }
    if (target.layer === 'map') {
      setAnnouncement(t('announce.map', { subject: map.subject.name, lit: map.summary.lit, total: map.summary.total }))
    } else if (target.layer === 'nebula') {
      const nebula = nebulae.find((n) => n.topicId === target.nebulaId)
      if (nebula) setAnnouncement(t('announce.nebula', { nebula: nebula.name, ...nebulaCounts(stars, nebula.topicId) }))
    } else {
      const star = stars.find((s) => s.unitId === target.unitId)
      if (star) setAnnouncement(t('announce.star', { name: star.name, state: t(`state.${star.state}`) }))
    }
    // Announce on a change of layer or focus, not on a change of language.
  }, [target])

  const stagePoint = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return [event.clientX - rect.left, event.clientY - rect.top] as const
  }
  // Controls and the card over the canvas keep their own pointer events.
  const onOverlay = (event: PointerEvent<HTMLDivElement>) =>
    event.target instanceof Element && Boolean(event.target.closest('[data-starmap-overlay]'))

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (onOverlay(event) || (event.pointerType === 'mouse' && event.button !== 0)) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    const [x, y] = stagePoint(event)
    engineRef.current?.pointerDown(event.pointerId, x, y)
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const [x, y] = stagePoint(event)
    if (event.pointerType === 'mouse' && event.buttons === 0) {
      engineRef.current?.hoverAt(onOverlay(event) ? null : x, y)
    }
    engineRef.current?.pointerMove(event.pointerId, x, y)
  }
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const [x, y] = stagePoint(event)
    engineRef.current?.pointerUp(event.pointerId, x, y)
  }
  const onPointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    engineRef.current?.pointerCancel(event.pointerId)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.metaKey || event.ctrlKey) return
    if (event.key === '+' || event.key === '=') {
      event.preventDefault()
      engineRef.current?.step('in')
    } else if (event.key === '-' || event.key === '_') {
      event.preventDefault()
      engineRef.current?.step('out')
    } else if (event.key === 'Escape' && target.layer !== 'map') {
      event.preventDefault()
      engineRef.current?.step('out')
    }
  }

  const focusStar = useCallback((index: number) => engineRef.current?.setFocusStar(index), [])
  const locateStar = useCallback((unitId: string) => engineRef.current?.starOnScreen(unitId) ?? null, [])
  const focusNebula = useCallback((index: number) => engineRef.current?.setFocusNebula(index), [])

  // The links, grouped by nebula in keyboard order.
  const size = linkSize(visible.glyph)
  const visibleByNebula = useMemo(() => {
    const groups = new Map<string, VisibleStar[]>()
    for (const entry of visible.stars) {
      const star = stars[entry.index]
      if (!star) continue
      const list = groups.get(star.nebulaId) ?? []
      list.push(entry)
      groups.set(star.nebulaId, list)
    }
    return groups
  }, [visible, stars])

  const measureFocusPill = (element: HTMLElement) => {
    if (!element.offsetWidth) return
    const id = element.dataset.nebulaLink ?? ''
    const width = element.offsetWidth + 16 // 8 px of room for the focus ring at both edges.
    const height = Math.max(NEBULA_FOCUS_HEIGHT, element.scrollHeight)
    setFocusPill((old) => old?.id === id && old.width === width && old.height === height ? old : { id, width, height })
  }
  useLayoutEffect(() => {
    const focused = document.activeElement
    if (focused instanceof HTMLElement && focused.matches('[data-nebula-link]') && stageRef.current?.contains(focused)) measureFocusPill(focused)
  }, [visible, stageSize])

  const currentNebula = target.layer === 'map' ? undefined : nebulae.find((n) => n.topicId === target.nebulaId)
  const currentStar = target.layer === 'star' ? stars.find((s) => s.unitId === target.unitId) : undefined
  const numberFormat = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language])
  const mapPath = pathForTarget(subjectId, { layer: 'map' })
  const subjects = map.subjects
  const activeSubject = subjects.findIndex((subject) => subject.subjectId === subjectId)

  const whereYouAre = (
    <div className="flex min-w-0 items-center gap-2.5">
      {target.layer === 'map' ? (
        <div className="flex flex-col">
          <h1 className="m-0 text-[17px] font-bold leading-tight text-on-sky">{map.subject.name}</h1>
          <p className="m-0 text-[13px] text-[color:var(--on-sky-text-caption)]">{t('summary.lit', { lit: map.summary.lit, total: map.summary.total })}</p>
        </div>
      ) : (
        <>
          <Link to={mapPath} aria-label={t('nav.backToMap')} className={cn(OVERLAY_LINK, 'gap-1.5 text-[15px] font-semibold')}>
            <ChevronLeft size={18} strokeWidth={1.6} aria-hidden="true" />
            <span aria-hidden="true">{t('nav.map')}</span>
          </Link>
          {currentNebula && (
            <>
              <span aria-hidden="true" className="text-[color:var(--on-sky-text-caption)]">
                /
              </span>
              {target.layer === 'nebula' ? (
                <h1 className="m-0 truncate text-[17px] font-bold leading-tight text-on-sky">{currentNebula.name}</h1>
              ) : (
                <Link
                  to={pathForTarget(subjectOfNebula(map, currentNebula.topicId), { layer: 'nebula', nebulaId: currentNebula.topicId })}
                  className={cn(OVERLAY_LINK, 'truncate text-[17px] font-bold')}
                >
                  {currentNebula.name}
                </Link>
              )}
              <span className="shrink-0 text-[13px] text-[color:var(--on-sky-text-caption)]">
                · {t('summary.lit', nebulaCounts(stars, currentNebula.topicId))}
              </span>
            </>
          )}
        </>
      )}
    </div>
  )

  const switcher =
    subjects.length > 1 ? (
      <SegmentedNav
        label={t('subjects.label')}
        items={subjects.map((subject) => ({ to: pathForTarget(subject.subjectId, { layer: 'map' }), label: subject.name, key: subject.subjectId }))}
        activeIndex={activeSubject}
        hitHeight={wide ? undefined : 44}
      />
    ) : null

  return (
    // The map fills its container whatever the container's display: the frame
    // takes the parent's height (a flex column's remaining space, or a block
    // with a definite height, such as #66's Ask page area) and the stage sits
    // absolutely inside it, so it is never left at its 320 px minimum. The
    // stage's own size is what the engine measures.
    <div data-starmap-frame className="relative h-full min-h-[320px] w-full flex-1">
      <div
        ref={stageRef}
        className="absolute inset-0 touch-none overflow-hidden select-none"
        data-starmap-stage
        data-layer={target.layer}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={() => engineRef.current?.hoverAt(null)}
        onKeyDown={onKeyDown}
      >
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />
        {overlay?.(locateStar)}

        {demo && (
          <p className="absolute inset-x-0 top-0 m-0 flex h-8 items-center justify-center border-b border-white/10 px-2 text-[12px] text-[color:var(--on-sky-text-body)]">
            {t('demo.notice')}
          </p>
        )}

        {/* Top: where you are, the subject switcher (#72 point 7), and the tally. */}
        {wide ? (
          <div data-starmap-overlay className={cn('pointer-events-none absolute inset-x-6 grid grid-cols-[1fr_auto_1fr] items-start gap-4', demo ? 'top-[52px]' : 'top-5')}>
            <div className="pointer-events-auto min-w-0">{whereYouAre}</div>
            <div className="pointer-events-auto">{switcher}</div>
            <div
              className="pointer-events-auto flex items-center gap-5 justify-self-end rounded-[12px] border border-solid border-white/8 bg-white/10 px-3.5 py-2 text-[13px] backdrop-blur-[20px]"
            >
              <span className="inline-flex items-center gap-1.5 font-semibold text-on-sky">
                <span aria-hidden="true" className="inline-block size-2 rounded-full bg-lit" />
                {t('summary.lit', { lit: map.summary.lit, total: map.summary.total })}
              </span>
              <span className="text-[color:var(--on-sky-text-body)]">{t('summary.streak', { count: map.summary.streakDays })}</span>
              <span className="text-[color:var(--on-sky-text-body)]">
                {t('summary.score', { count: map.summary.score, formatted: numberFormat.format(map.summary.score) })}
              </span>
            </div>
          </div>
        ) : (
          <div data-starmap-overlay className={cn('absolute inset-x-4 flex flex-col items-start gap-1', demo ? 'top-10' : 'top-2')}>
            {switcher}
            {whereYouAre}
          </div>
        )}

        {/* The parallel DOM: one link per star on screen, blurred or not. */}
        {target.layer !== 'star' && (
          <nav aria-label={t('stage.label', { subject: map.subject.name })} className="pointer-events-none absolute inset-0">
            <h2 className="sr-only">{t('stage.nebulae')}</h2>
            <ul className="m-0 list-none p-0">
              {nebulae.map((nebula, nebulaIndex) => {
                const inNebula = visibleByNebula.get(nebula.topicId) ?? []
                const isCurrent = currentNebula?.topicId === nebula.topicId
                const disc = visible.nebulae[nebulaIndex]
                const pill = focusPill?.id === nebula.topicId ? focusPill : undefined
                const spot = disc ? nebulaFocusSpot(disc, stageSize, controlBands(wide, stageSize.bottomInset, demo), pill) : null
                return (
                  <li key={nebula.topicId} data-nebula={nebula.topicId}>
                    {isCurrent ? (
                      <span className="sr-only">{nebulaText(nebula)}</span>
                    ) : (
                      <Link
                        to={pathForTarget(subjectOfNebula(map, nebula.topicId), { layer: 'nebula', nebulaId: nebula.topicId })}
                        className="starmap-nebula-link"
                        data-nebula-link={nebula.topicId}
                        // Shown on focus as a name pill by its own nebula, inside the band
                        // between the page's controls, never under the legend (WCAG 2.4.11).
                        style={spot ? { transform: `translate(${spot.x}px, ${spot.y}px) translateX(-50%)`, height: pill?.height ?? NEBULA_FOCUS_HEIGHT, maxWidth: Math.max(32, stageSize.width - 32) } : undefined}
                        data-focus-top={spot?.y}
                        onFocus={(event) => { measureFocusPill(event.currentTarget); focusNebula(nebulaIndex) }}
                        onBlur={() => focusNebula(-1)}
                      >
                        <span aria-hidden="true">{nebula.name}</span>
                        <span className="sr-only">{nebulaText(nebula)}</span>
                      </Link>
                    )}
                    {inNebula.length > 0 && (
                      <ul className="m-0 list-none p-0">
                        {inNebula.map((entry) => {
                          const star = stars[entry.index]
                          const to: LayerTarget = { layer: 'star', nebulaId: star.nebulaId, unitId: star.unitId }
                          // Tab reaches a star once its nebula is open; on the whole map, Tab
                          // goes nebula by nebula (and to the recommended star), and a screen
                          // reader still reads every star.
                          // The recommended star stays a Tab stop everywhere: it is the way in.
                          const tabbable = isCurrent || Boolean(star.recommendation)
                          return (
                            <li key={star.unitId}>
                              {/* A plain anchor, not a router Link: a thousand of these re-render at once. */}
                              <a
                                href={pathForTarget(subjectOfNebula(map, star.nebulaId), to)}
                                className="starmap-link"
                                data-unit={star.unitId}
                                data-index={entry.index}
                                tabIndex={tabbable ? undefined : -1}
                                style={{
                                  width: size,
                                  height: size,
                                  transform: `translate(${entry.x - size / 2}px, ${entry.y - size / 2}px)`,
                                }}
                                onClick={(event) => {
                                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
                                  event.preventDefault()
                                  navigateRef.current(to)
                                }}
                                onFocus={() => focusStar(entry.index)}
                                onBlur={() => focusStar(-1)}
                              >
                                <span className="sr-only">{starLabel(t, star)}</span>
                              </a>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>
        )}

        {stars.length === 0 && (
          <p className="absolute inset-x-4 top-1/2 m-0 -translate-y-1/2 text-center text-[15px] text-[color:var(--on-sky-text-body)]">
            {t('empty')}
          </p>
        )}

        {currentStar && currentNebula && (
          <div data-starmap-overlay>
            <StarCard demo={demo} map={map} star={currentStar} nebula={currentNebula} wide={wide} reducedMotion={reducedMotion} />
          </div>
        )}

        {/* What the glyphs mean (wide screens, whole map). */}
        {wide && target.layer === 'map' && stars.length > 0 && (
          <div
            data-starmap-overlay
            className="absolute bottom-[calc(1.5rem+var(--page-bottom-inset,0px))] left-6 flex max-w-[560px] flex-col gap-2 rounded-[12px] border border-solid border-[color:var(--sky-glass-border)] px-3.5 py-2.5"
            // Glass over the sky: the legend's words keep 4.5:1 over any nebula behind them.
            style={{
              background: 'var(--sky-glass)',
              backdropFilter: 'blur(var(--sky-glass-blur))',
              WebkitBackdropFilter: 'blur(var(--sky-glass-blur))',
            }}
          >
            <h2 className="sr-only">{t('legend.label')}</h2>
            <ul className="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0">
              {LEARNING_STATES.map((state) => (
                <li key={state} className="inline-flex items-center gap-1.5 text-[13px] text-[color:var(--on-sky-text-body)]">
                  <StarGlyph state={state} size={18} progress={0.6} />
                  {t(`state.${state}`)}
                </li>
              ))}
              <li className="inline-flex items-center gap-1.5 text-[13px] text-[color:var(--on-sky-text-body)]">
                <StarGlyph state="ready" size={18} recommended />
                {t('marker.recommended')}
              </li>
              <li className="inline-flex items-center gap-1.5 text-[13px] text-[color:var(--on-sky-text-body)]">
                <StarGlyph state="lit" size={18} reviewDue />
                {t('legend.reviewDue')}
              </li>
            </ul>
            <p className="m-0 text-[13px] text-[color:var(--on-sky-text-body)]">{t('legend.hint')}</p>
          </div>
        )}

        {/* Zoom in and out (canvas board: a glass pair, bottom right). */}
        {stars.length > 0 && (
          <div
            data-starmap-overlay
            role="group"
            aria-label={t('zoom.group')}
            className={cn(
              'absolute flex flex-col gap-0.5 rounded-[11px] border border-solid border-white/10 bg-white/10 p-[3px] backdrop-blur-[20px]',
              wide ? 'bottom-[calc(1.5rem+var(--page-bottom-inset,0px))] right-6' : target.layer === 'star' ? 'right-4 top-2' : 'bottom-[calc(1rem+var(--page-bottom-inset,0px))] right-4',
            )}
          >
            {(['in', 'out'] as const).map((direction) => (
              <button
                key={direction}
                type="button"
                aria-label={t(`zoom.${direction}`)}
                title={t(`zoom.${direction}`)}
                disabled={direction === 'in' ? target.layer === 'star' : target.layer === 'map'}
                onClick={() => engineRef.current?.step(direction)}
                className={cn(
                  'inline-flex cursor-pointer items-center justify-center rounded-[8px] border-0 bg-transparent p-0 text-[color:var(--on-sky-plain)]',
                  'hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent',
                  wide ? 'size-8' : 'size-11',
                )}
              >
                {direction === 'in' ? (
                  <Plus size={18} strokeWidth={1.6} aria-hidden="true" />
                ) : (
                  <Minus size={18} strokeWidth={1.6} aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        )}

        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </div>
    </div>
  )
}
