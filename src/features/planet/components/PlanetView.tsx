/*
 * The planet on screen (#47): a canvas the engine draws, the parallel DOM a
 * screen reader and a keyboard use instead of it, and the controls around it.
 *
 * The canvas is hidden from assistive technology. Every point the current
 * layer shows is an `<a>` placed over its glyph, in the order region first,
 * then `(topic.order, unit.order)`; its text is the point's name, learning
 * state, progress and markers (#11 point 5). The third layer is plain HTML
 * and SVG: the point card.
 */
import { ChevronLeft, Minus, Plus } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PointCard } from '@/features/planet/components/PointCard'
import { PointGlyph } from '@/features/planet/components/PointGlyph'
import { pointLabel, regionCounts, regionLabel } from '@/features/planet/components/labels'
import { glyphSizeFor, PlanetEngine, type FrameScheduler, type VisiblePoint } from '@/features/planet/engine/planetEngine'
import { isWide, pathForTarget, type LayerTarget } from '@/features/planet/geo/zoom'
import { LEARNING_STATES, litCount, orderedPoints, orderedRegions, type KnowledgeMap } from '@/features/planet/model/knowledgeMap'
import { usePrefersReducedMotion } from '@/features/planet/motion/usePrefersReducedMotion'
import { createRenderer } from '@/features/planet/render/createRenderer'
import type { PlanetRenderer, PlanetTheme } from '@/features/planet/render/types'
import { cn } from '@/lib/utils'
import '@/features/planet/planet.css'

const THEME_FALLBACK: PlanetTheme = {
  sky: '#0A1020',
  sphere0: '#2A3A64',
  sphere1: '#152040',
  sphere2: '#080C1A',
  atmosphere: 'rgba(120, 160, 255, 0.16)',
  lit: '#F2C572',
  litCore: '#FFF8EA',
  text: '#FFFFFF',
  textBody: 'rgba(255, 255, 255, 0.75)',
  textCaption: 'rgba(255, 255, 255, 0.65)',
  fontFamily: 'system-ui, sans-serif',
}

/** The sky tokens as the canvas needs them, read where `data-surface="sky"` defines them. */
function readTheme(element: Element): PlanetTheme {
  const style = getComputedStyle(element)
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback
  return {
    sky: read('--sky', THEME_FALLBACK.sky),
    sphere0: read('--sphere-0', THEME_FALLBACK.sphere0),
    sphere1: read('--sphere-1', THEME_FALLBACK.sphere1),
    sphere2: read('--sphere-2', THEME_FALLBACK.sphere2),
    atmosphere: read('--atmosphere', THEME_FALLBACK.atmosphere),
    lit: read('--lit', THEME_FALLBACK.lit),
    litCore: read('--lit-core', THEME_FALLBACK.litCore),
    text: read('--on-sky-text', THEME_FALLBACK.text),
    textBody: read('--on-sky-text-body', THEME_FALLBACK.textBody),
    textCaption: read('--on-sky-text-caption', THEME_FALLBACK.textCaption),
    fontFamily: read('--font-system', THEME_FALLBACK.fontFamily),
  }
}

export type PlanetViewProps = {
  map: KnowledgeMap
  target: LayerTarget
  /** Go to another layer's route. */
  onNavigate: (target: LayerTarget) => void
  /** The first frame with the planet on it is on screen. */
  onFirstFrame?: () => void
  /** For tests: the frame clock and the renderer. */
  scheduler?: FrameScheduler
  createRendererFor?: (canvas: HTMLCanvasElement) => PlanetRenderer
}

/** A link's box: the glyph, but never under 32 px, so the focus ring can be seen. */
function linkSize(glyph: number): number {
  return Math.round(Math.max(32, Math.min(56, glyph * 0.75)))
}

export function PlanetView({ map, target, onNavigate, onFirstFrame, scheduler, createRendererFor }: PlanetViewProps) {
  const { t, i18n } = useTranslation('planet')
  const reducedMotion = usePrefersReducedMotion()
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<PlanetEngine | null>(null)
  const [visible, setVisible] = useState<VisiblePoint[]>([])
  const [wide, setWide] = useState(true)
  const [announcement, setAnnouncement] = useState('')

  // Keep the latest callbacks without rebuilding the engine.
  const navigateRef = useRef(onNavigate)
  const firstFrameRef = useRef(onFirstFrame)
  useLayoutEffect(() => {
    navigateRef.current = onNavigate
    firstFrameRef.current = onFirstFrame
  })

  const points = useMemo(() => orderedPoints(map), [map])
  const regions = useMemo(() => orderedRegions(map), [map])
  const subjectId = map.subject.subjectId

  // The engine lives as long as the canvas.
  useEffect(() => {
    const canvas = canvasRef.current
    const stage = stageRef.current
    if (!canvas || !stage) return
    const engine = new PlanetEngine({
      renderer: createRendererFor ? createRendererFor(canvas) : createRenderer(canvas),
      theme: readTheme(stage),
      reducedMotion,
      scheduler,
      onRequestTarget: (next) => navigateRef.current(next),
      onVisibleChange: setVisible,
      onFirstFrame: () => firstFrameRef.current?.(),
    })
    engineRef.current = engine

    const measure = () => {
      const rect = stage.getBoundingClientRect()
      engine.setViewport(Math.round(rect.width), Math.round(rect.height), window.devicePixelRatio || 1)
      setWide(isWide({ width: rect.width, height: rect.height }))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(stage)

    const onWheel = (event: WheelEvent) => {
      const rect = stage.getBoundingClientRect()
      // Trackpad pinch arrives as a ctrl+wheel; both zoom the planet, not the page.
      event.preventDefault()
      engine.wheelBy(event.deltaY * (event.ctrlKey ? 10 : 1), event.clientX - rect.left, event.clientY - rect.top)
    }
    stage.addEventListener('wheel', onWheel, { passive: false })

    // Nothing moves by itself while the planet cannot be used: an ancestor is
    // `inert` (the phone's Ask sheet is open, #49) or the tab is hidden.
    const syncPaused = () => engine.setPaused(Boolean(stage.closest('[inert]')) || document.hidden)
    const inertWatch = new MutationObserver(syncPaused)
    for (let node: Element | null = stage; node; node = node.parentElement) {
      inertWatch.observe(node, { attributes: true, attributeFilter: ['inert'] })
    }
    document.addEventListener('visibilitychange', syncPaused)
    syncPaused()

    return () => {
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
    // A new planet starts from its own target; later targets animate.
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
    if (target.layer === 'planet') {
      setAnnouncement(t('announce.planet', { subject: map.subject.name, lit: litCount(points), total: points.length }))
    } else if (target.layer === 'region') {
      const region = regions.find((r) => r.topicId === target.regionId)
      if (region) setAnnouncement(t('announce.region', { region: region.name, ...regionCounts(points, region.topicId) }))
    } else {
      const point = points.find((p) => p.unitId === target.pointId)
      if (point) setAnnouncement(t('announce.point', { name: point.name, state: t(`state.${point.state}`) }))
    }
    // Announce on a change of layer or focus, not on a change of language.
  }, [target])

  const stagePoint = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return [event.clientX - rect.left, event.clientY - rect.top] as const
  }
  // Controls and the card over the canvas keep their own pointer events.
  const onOverlay = (event: PointerEvent<HTMLDivElement>) =>
    event.target instanceof Element && Boolean(event.target.closest('[data-planet-overlay]'))

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (onOverlay(event) || (event.pointerType === 'mouse' && event.button !== 0)) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    const [x, y] = stagePoint(event)
    engineRef.current?.pointerDown(event.pointerId, x, y)
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const [x, y] = stagePoint(event)
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
    } else if (event.key === 'Escape' && target.layer !== 'planet') {
      event.preventDefault()
      engineRef.current?.step('out')
    }
  }

  const focusPoint = useCallback((index: number) => engineRef.current?.setFocusPoint(index), [])

  // The links, grouped by region in keyboard order.
  const glyph = glyphSizeFor(engineRef.current?.currentView.k ?? 1, points.length)
  const size = linkSize(glyph)
  const visibleByRegion = useMemo(() => {
    const groups = new Map<string, VisiblePoint[]>()
    for (const entry of visible) {
      const point = points[entry.index]
      if (!point) continue
      const list = groups.get(point.regionId) ?? []
      list.push(entry)
      groups.set(point.regionId, list)
    }
    return groups
  }, [visible, points])

  const currentRegion = target.layer === 'planet' ? undefined : regions.find((r) => r.topicId === target.regionId)
  const currentPoint = target.layer === 'point' ? points.find((p) => p.unitId === target.pointId) : undefined
  const lit = litCount(points)
  const numberFormat = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language])
  const planetPath = pathForTarget(subjectId, { layer: 'planet' })

  return (
    <div
      ref={stageRef}
      className="relative min-h-[320px] flex-1 touch-none overflow-hidden select-none"
      data-planet-stage
      data-layer={target.layer}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onKeyDown={onKeyDown}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />

      {/* Where the student is: the subject, or Planet / region. */}
      <div data-planet-overlay className={cn('pointer-events-auto absolute flex items-center gap-2.5', wide ? 'left-6 top-5' : 'left-4 top-3')}>
        {target.layer === 'planet' ? (
          <div className="flex flex-col">
            <h1 className="m-0 text-[17px] font-bold leading-tight text-on-sky">{map.subject.name}</h1>
            <p className="m-0 text-[13px] text-[color:var(--on-sky-text-caption)]">
              {t('summary.lit', { lit, total: points.length })}
            </p>
          </div>
        ) : (
          <>
            <Link
              to={planetPath}
              aria-label={t('nav.backToPlanet')}
              className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-semibold text-on-sky hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <ChevronLeft size={18} strokeWidth={1.6} aria-hidden="true" />
              <span aria-hidden="true">{t('nav.planet')}</span>
            </Link>
            {currentRegion && (
              <>
                <span aria-hidden="true" className="text-[color:var(--on-sky-text-caption)]">
                  /
                </span>
                {target.layer === 'region' ? (
                  <h1 className="m-0 text-[17px] font-bold leading-tight text-on-sky">{currentRegion.name}</h1>
                ) : (
                  <Link
                    to={pathForTarget(subjectId, { layer: 'region', regionId: currentRegion.topicId })}
                    className="inline-flex min-h-11 items-center text-[17px] font-bold text-on-sky hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {currentRegion.name}
                  </Link>
                )}
                <span className="text-[13px] text-[color:var(--on-sky-text-caption)]">
                  · {t('summary.lit', regionCounts(points, currentRegion.topicId))}
                </span>
              </>
            )}
          </>
        )}
      </div>

      {/* Lit count, streak, points (canvas board: a glass chip, top right). */}
      {wide && (
        <div
          data-planet-overlay
          className="absolute right-6 top-5 flex items-center gap-5 rounded-[12px] border border-solid bg-white/10 px-3.5 py-2 text-[13px] backdrop-blur-[20px]"
          // index.css sets an unlayered `* { border-color }`, which beats a utility class.
          style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
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
      )}

      {/* The parallel DOM: one link per point on screen. */}
      {target.layer !== 'point' && (
        <nav aria-label={t('stage.label', { subject: map.subject.name })} className="pointer-events-none absolute inset-0">
          <h2 className="sr-only">{t('stage.regions')}</h2>
          <ul className="m-0 list-none p-0">
            {regions.map((region) => {
              const inRegion = visibleByRegion.get(region.topicId) ?? []
              const isCurrent = currentRegion?.topicId === region.topicId
              return (
                <li key={region.topicId} data-region={region.topicId}>
                  {isCurrent ? (
                    <span className="sr-only">{regionLabel(t, region, points)}</span>
                  ) : (
                    <Link
                      to={pathForTarget(subjectId, { layer: 'region', regionId: region.topicId })}
                      className="sr-only rounded-[10px] px-3 py-2 text-[15px] font-semibold text-on-sky focus-visible:not-sr-only focus-visible:absolute focus-visible:bottom-24 focus-visible:left-1/2 focus-visible:-translate-x-1/2 focus-visible:bg-[var(--sky-glass)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {regionLabel(t, region, points)}
                    </Link>
                  )}
                  {inRegion.length > 0 && (
                    <ul className="m-0 list-none p-0">
                      {inRegion.map((entry) => {
                        const point = points[entry.index]
                        return (
                          <li key={point.unitId}>
                            {/* A plain anchor, not a router Link: a thousand of these re-render at once. */}
                            <a
                              href={pathForTarget(subjectId, { layer: 'point', regionId: point.regionId, pointId: point.unitId })}
                              className="planet-link"
                              data-unit={point.unitId}
                              style={{
                                width: size,
                                height: size,
                                transform: `translate(${entry.x - size / 2}px, ${entry.y - size / 2}px)`,
                              }}
                              onClick={(event) => {
                                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
                                event.preventDefault()
                                navigateRef.current({ layer: 'point', regionId: point.regionId, pointId: point.unitId })
                              }}
                              onFocus={() => focusPoint(entry.index)}
                              onBlur={() => focusPoint(-1)}
                            >
                              <span className="sr-only">{pointLabel(t, point)}</span>
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

      {points.length === 0 && (
        <p className="absolute inset-x-4 top-1/2 m-0 -translate-y-1/2 text-center text-[15px] text-[color:var(--on-sky-text-body)]">
          {t('empty')}
        </p>
      )}

      {currentPoint && currentRegion && (
        <div data-planet-overlay>
          <PointCard map={map} point={currentPoint} region={currentRegion} wide={wide} reducedMotion={reducedMotion} />
        </div>
      )}

      {/* What the glyphs mean (wide screens, whole planet). */}
      {wide && target.layer === 'planet' && points.length > 0 && (
        <div data-planet-overlay className="absolute bottom-6 left-6 flex max-w-[560px] flex-col gap-2">
          <h2 className="sr-only">{t('legend.label')}</h2>
          <ul className="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0">
            {LEARNING_STATES.map((state) => (
              <li key={state} className="inline-flex items-center gap-1.5 text-[13px] text-[color:var(--on-sky-text-body)]">
                <PointGlyph state={state} size={18} progress={0.6} />
                {t(`state.${state}`)}
              </li>
            ))}
            <li className="inline-flex items-center gap-1.5 text-[13px] text-[color:var(--on-sky-text-body)]">
              <PointGlyph state="ready" size={18} recommended />
              {t('marker.recommended')}
            </li>
            <li className="inline-flex items-center gap-1.5 text-[13px] text-[color:var(--on-sky-text-body)]">
              <PointGlyph state="lit" size={18} reviewDue />
              {t('legend.reviewDue')}
            </li>
          </ul>
          <p className="m-0 text-[13px] text-[color:var(--on-sky-text-caption)]">{t('legend.hint')}</p>
        </div>
      )}

      {/* Zoom in and out (canvas board: a glass pair, bottom right). */}
      {points.length > 0 && (
        <div
          data-planet-overlay
          role="group"
          aria-label={t('zoom.group')}
          className={cn(
            'absolute flex flex-col gap-0.5 rounded-[11px] border border-solid bg-white/10 p-[3px] backdrop-blur-[20px]',
            wide ? 'bottom-6 right-6' : target.layer === 'point' ? 'right-4 top-3' : 'bottom-4 right-4',
          )}
          style={{ borderColor: 'rgba(255, 255, 255, 0.10)' }}
        >
          {(['in', 'out'] as const).map((direction) => (
            <button
              key={direction}
              type="button"
              aria-label={t(`zoom.${direction}`)}
              title={t(`zoom.${direction}`)}
              disabled={direction === 'in' ? target.layer === 'point' : target.layer === 'planet'}
              onClick={() => engineRef.current?.step(direction)}
              className={cn(
                'inline-flex cursor-pointer items-center justify-center rounded-[8px] border-0 bg-transparent p-0 text-[color:var(--on-sky-plain)]',
                'hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent',
                wide ? 'size-8' : 'size-11',
              )}
            >
              {direction === 'in' ? <Plus size={18} strokeWidth={1.6} aria-hidden="true" /> : <Minus size={18} strokeWidth={1.6} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}
