/*
 * One star cluster's learning route (#747): its stars left to right
 * along a bright main line, side paths forking off it as parallel tracks
 * (at most three beside it in any column), and one entrance chip per cluster
 * the route builds on, stacked on the left. Laid out by `routeLayout.ts`,
 * drawn by `routeGeometry.ts`.
 *
 * Quiet by default, like a metro map: the main line and one line into each
 * side star, from its anchor. A star picked out -- selected, focused or under
 * the pointer -- brings its whole context forward: every prerequisite into
 * it, dashed lines from the entrances it needs, every star it unlocks; the
 * rest dims.
 *
 * The route scrolls sideways (a mouse can drag it) and opens on the star to
 * go on with, or on the star asked for. Every star and entrance is a button in
 * route order, so Tab follows the route; Enter opens its card, Escape closes it.
 *
 * It fills the box it is given (`ClusterScene` lays it over the star map);
 * the card sits at the bottom of that box.
 */
import { ArrowRight, ChevronLeft, LogIn, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/base'
import { StarGlyph } from '@/features/starmap/components/StarGlyph'
import { starLook, type Star, type StarMap } from '@/features/starmap/model/starMap'
import { clusterOfStar, type StarCluster } from '@/features/starmap/route/clusters'
import { COMPACT, contextOf, curve, NARROW_NAME, routeGeometry, WIDE } from '@/features/starmap/route/routeGeometry'
import type { RouteEntranceNode } from '@/features/starmap/route/routeLayout'
import '@/features/starmap/route/clusterRoute.css'

/** Narrow screens: tighter columns and lanes, the route still scrolls sideways. */
function useCompact() {
  const query = '(max-width: 560px)'
  const [compact, setCompact] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(query).matches)
  useEffect(() => {
    const list = window.matchMedia?.(query)
    if (!list) return
    const change = () => setCompact(list.matches)
    list.addEventListener('change', change)
    return () => list.removeEventListener('change', change)
  }, [])
  return compact
}

/** Scroll the route sideways to `left`, smoothly where the browser can. */
function glide(el: HTMLElement, left: number) {
  const to = Math.max(0, left)
  if (typeof el.scrollTo === 'function') el.scrollTo({ left: to, behavior: 'smooth' })
  else el.scrollLeft = to
}

/** A mouse drags the route sideways; a drag is not a click. Touch scrolls natively. */
function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null)
  const [dragging, setDragging] = useState(false)
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || !ref.current) return
    drag.current = { x: event.clientX, left: ref.current.scrollLeft, moved: false }
  }
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || !ref.current) return
    const dx = event.clientX - d.x
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true
      setDragging(true)
      ref.current.setPointerCapture(event.pointerId)
    }
    if (d.moved) ref.current.scrollLeft = d.left - dx
  }
  const end = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    drag.current = null
    if (d?.moved) {
      setDragging(false)
      ref.current?.releasePointerCapture?.(event.pointerId)
      // Swallow the click that ends a drag.
      const swallow = (click: MouseEvent) => {
        click.stopPropagation()
        click.preventDefault()
      }
      window.addEventListener('click', swallow, { capture: true, once: true })
      window.setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0)
    }
  }
  return { ref, dragging, handlers: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end } }
}

export function ClusterRouteView({
  map,
  clusters,
  cluster,
  focusUnitId,
  onBack,
  onGo,
  onPractise,
}: {
  map: Pick<StarMap, 'stars'>
  clusters: readonly StarCluster[]
  cluster: StarCluster
  /** A star to open on, with its card (an entrance from another cluster leads here). */
  focusUnitId: string | null
  onBack: () => void
  /** Go to a star, in this cluster or another. */
  onGo: (clusterId: string, unitId: string) => void
  onPractise: (unitId: string) => void
}) {
  const { t } = useTranslation('starmap')
  const compact = useCompact()
  const g = compact ? COMPACT : WIDE
  const { route } = cluster
  const starById = useMemo(() => new Map(map.stars.map((s) => [s.unitId, s])), [map.stars])
  const nextId = cluster.next?.unitId ?? null
  const [selected, setSelected] = useState<string | null>(focusUnitId)
  const [pointed, setPointed] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>())
  const cardRef = useRef<HTMLDivElement>(null)
  const { ref: scroller, dragging, handlers } = useDragScroll()

  const geometry = useMemo(() => routeGeometry(route, g, (unitId) => starById.get(unitId)?.name ?? ''), [route, g, starById])
  const { width, height, position, labelSide } = geometry
  // The star or chip whose context is drawn: under the pointer, else with focus, else selected.
  const active = pointed ?? focused ?? selected
  const context = useMemo(() => contextOf(route, active), [route, active])
  const nodeById = new Map(route.nodes.map((n) => [n.id, n]))
  const lit = (id: string) => starById.get(id)?.state === 'lit'

  // Open on the star asked for, else the one to go on with.
  const target = focusUnitId ?? nextId
  const titleRef = useRef<HTMLHeadingElement>(null)
  useLayoutEffect(() => {
    const el = scroller.current
    const p = target ? position.get(target) : undefined
    if (el && p) el.scrollLeft = Math.max(0, p.x - el.clientWidth / 2)
    // Focus comes along from the map: to the star asked for, else to the cluster's name, so Tab walks the route from the start.
    if (focusUnitId) nodeRefs.current.get(focusUnitId)?.focus({ preventScroll: true })
    else titleRef.current?.focus({ preventScroll: true })
    // Only when the cluster, the star asked for or the screen width changes.
  }, [cluster.clusterId, focusUnitId, compact])

  const close = () => {
    const was = selected
    setSelected(null)
    if (was) nodeRefs.current.get(was)?.focus({ preventScroll: true })
  }
  useEffect(() => {
    if (!selected) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const open = (id: string) => {
    setSelected(id)
    const el = scroller.current
    const p = position.get(id)
    if (el && p && (p.x < el.scrollLeft + 40 || p.x > el.scrollLeft + el.clientWidth - 40)) {
      glide(el, p.x - el.clientWidth / 2)
    }
    requestAnimationFrame(() => cardRef.current?.focus({ preventScroll: true }))
  }

  const go = (unitId: string) => {
    const other = clusterOfStar(clusters, unitId)
    if (!other) return
    if (other.clusterId === cluster.clusterId) {
      const el = scroller.current
      const p = position.get(unitId)
      if (el && p) glide(el, p.x - el.clientWidth / 2)
      nodeRefs.current.get(unitId)?.focus({ preventScroll: true })
      setSelected(unitId)
      return
    }
    onGo(other.clusterId, unitId)
  }

  const clusterName = (unitId: string) => clusterOfStar(clusters, unitId)?.name ?? ''
  const lookLabel = (star: Star) => {
    const look = starLook(star)
    return look === 'waiting' ? t('legend.waiting') : t(`state.${look}`)
  }
  const entranceClusters = (n: RouteEntranceNode) => [...new Set(n.sources.map((s) => clusters.find((c) => c.clusterId === s.clusterId)?.name ?? s.clusterId))]

  const selectedNode = selected ? nodeById.get(selected) : undefined

  return (
    <section data-surface="sky" data-cluster-route={cluster.clusterId} aria-labelledby="cluster-route-title" className="cluster-page relative flex h-full min-h-0 flex-col pb-4">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pb-3 pt-5 sm:px-8">
        <Button variant="onSkyPlain" size="small" onClick={onBack} data-cluster-back className="-ml-2">
          <ChevronLeft size={18} aria-hidden="true" />
          {t('nav.backToMap')}
        </Button>
        <div className="flex min-w-0 flex-1 basis-full flex-col sm:basis-auto">
          <h1 ref={titleRef} id="cluster-route-title" tabIndex={-1} className="text-[24px] font-semibold leading-tight outline-none sm:text-[28px]">
            {cluster.name}
          </h1>
          <p className="text-[14px]" style={{ color: 'var(--on-sky-text-body)' }}>
            {t('summary.lit', { lit: cluster.lit, total: cluster.total })}
          </p>
        </div>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]" style={{ color: 'var(--on-sky-text-caption)' }} aria-label={t('legend.label')}>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-[4px] w-6 rounded-full" style={{ background: 'var(--lit)' }} />
            {t('clusters.legendMain')}
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-[1.5px] w-6" style={{ background: 'rgba(255,255,255,0.55)' }} />
            {t('clusters.legendBranch')}
          </li>
          <li className="flex items-center gap-1.5">
            <LogIn size={14} aria-hidden="true" style={{ color: 'var(--starmap-ice)' }} />
            {t('clusters.legendEntrance')}
          </li>
        </ul>
      </header>

      <p className="px-4 pb-1 text-[12.5px] sm:px-8" style={{ color: 'var(--on-sky-text-caption)' }}>
        {t('clusters.dragHint')}
      </p>

      <div
        ref={scroller}
        className="route-scroller flex min-h-0 flex-1"
        data-dragging={dragging ? '' : undefined}
        role="region"
        aria-label={t('clusters.routeLabel', { name: cluster.name })}
        {...handlers}
      >
        <div className="relative my-auto shrink-0" style={{ width, height }}>
          <svg width={width} height={height} className="absolute left-0 top-0" aria-hidden="true" focusable="false">
            {/* A faint track the main line runs along, end to end. */}
            {route.mainline.length > 0 && (
              <line
                x1={position.get(route.mainline[0])!.x - g.colW / 2}
                x2={width - g.padX / 2}
                y1={geometry.mainY}
                y2={geometry.mainY}
                stroke="var(--lit)"
                strokeOpacity={0.08}
                strokeWidth={10}
                strokeLinecap="round"
              />
            )}
            {route.edges
              .filter((e) => e.kind === 'branch')
              .map((e) => {
                const quiet = active !== null && !context.nodes.has(e.to)
                return (
                  <path
                    key={`${e.from}>${e.to}`}
                    data-route-line="branch"
                    d={geometry.line(e.from, e.to).d}
                    fill="none"
                    stroke={lit(e.from) ? 'var(--lit)' : 'var(--on-sky-text)'}
                    strokeOpacity={quiet ? 0.1 : lit(e.from) ? 0.5 : 0.32}
                    strokeWidth={1.5}
                  />
                )
              })}
            {route.stubs.map((unitId) => {
              const p = position.get(unitId)!
              return (
                <line
                  key={`stub:${unitId}`}
                  data-route-line="stub"
                  x1={p.x - 40}
                  x2={p.x - 16}
                  y1={p.y}
                  y2={p.y}
                  stroke="var(--starmap-ice)"
                  strokeOpacity={active !== null && !context.nodes.has(unitId) ? 0.1 : 0.55}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
              )
            })}
            {route.edges
              .filter((e) => e.kind === 'main')
              .map((e) => {
                const a = position.get(e.from)!
                const b = position.get(e.to)!
                const done = lit(e.from) && lit(e.to)
                const quiet = active !== null && !(context.nodes.has(e.from) && context.nodes.has(e.to))
                return (
                  <g key={`${e.from}>${e.to}`} data-route-line="main" opacity={quiet ? 0.45 : 1}>
                    <path d={curve(a, b)} fill="none" stroke="var(--lit)" strokeOpacity={done ? 0.25 : 0.1} strokeWidth={12} strokeLinecap="round" />
                    <path d={curve(a, b)} fill="none" stroke="var(--lit)" strokeOpacity={done ? 1 : 0.55} strokeWidth={done ? 4 : 3} strokeLinecap="round" />
                  </g>
                )
              })}
            {/* The picked-out star's context, over the quiet map. */}
            {context.edges
              .filter((e) => e.kind !== 'main')
              .map((e) => {
                const a = position.get(e.from)!
                const b = position.get(e.to)!
                const entrance = e.kind === 'entrance'
                return (
                  <path
                    key={`context:${e.from}>${e.to}`}
                    data-route-line="context"
                    d={entrance ? curve(a, b) : geometry.line(e.from, e.to).d}
                    fill="none"
                    stroke={entrance ? 'var(--starmap-ice)' : 'var(--lit)'}
                    strokeOpacity={0.9}
                    strokeWidth={2}
                    strokeDasharray={entrance ? '4 5' : undefined}
                  />
                )
              })}
          </svg>

          {route.nodes.map((n) => {
            const p = position.get(n.id)!
            if (n.kind === 'entrance') {
              const names = entranceClusters(n)
              const label = t('clusters.entranceLabel', { clusters: names.join(' · ') })
              const count = t('clusters.entranceCount', { count: n.sources.length })
              return (
                <button
                  key={n.id}
                  type="button"
                  ref={(el) => {
                    if (el) nodeRefs.current.set(n.id, el)
                    else nodeRefs.current.delete(n.id)
                  }}
                  className="route-entrance px-3 py-1.5"
                  style={{ left: p.x, top: p.y, width: g.chipW, opacity: active !== null && !context.nodes.has(n.id) ? 0.4 : 1 }}
                  data-route-entrance={n.id}
                  onPointerEnter={() => setPointed(n.id)}
                  onPointerLeave={() => setPointed(null)}
                  onFocus={() => setFocused(n.id)}
                  onBlur={() => setFocused(null)}
                  data-selected={selected === n.id ? '' : undefined}
                  aria-label={`${label}, ${count}`}
                  aria-expanded={selected === n.id}
                  onClick={() => (selected === n.id ? close() : open(n.id))}
                >
                  <LogIn size={compact ? 14 : 16} aria-hidden="true" className="shrink-0" />
                  <span className="flex min-w-0 flex-col">
                    <span className="route-entrance-name text-[12px] font-semibold">{names.join(' · ')}</span>
                    <span className="text-[11px] opacity-80">{count}</span>
                  </span>
                </button>
              )
            }
            const star = starById.get(n.unitId)
            if (!star) return null
            const size = geometry.glyph(n)
            const isNext = n.unitId === nextId
            const above = labelSide.get(n.id) === 'above'
            const align = geometry.labelAlign.get(n.id) ?? 'center'
            return (
              <button
                key={n.id}
                type="button"
                ref={(el) => {
                  if (el) nodeRefs.current.set(n.id, el)
                  else nodeRefs.current.delete(n.id)
                }}
                className="route-node"
                // The name on the side of the glyph no line meets (`routeGeometry`): below it, or above it.
                style={{
                  left: p.x,
                  width: g.colW - 12,
                  opacity: active !== null && !context.nodes.has(n.id) ? 0.35 : 1,
                  ...(above ? { bottom: height - (p.y + size / 2), flexDirection: 'column-reverse' } : { top: p.y - size / 2 }),
                }}
                data-unit={n.unitId}
                data-label={above ? 'above' : 'below'}
                onPointerEnter={() => setPointed(n.id)}
                onPointerLeave={() => setPointed(null)}
                onFocus={() => setFocused(n.id)}
                onBlur={() => setFocused(null)}
                data-main={n.main ? '' : undefined}
                data-next={isNext ? '' : undefined}
                data-selected={selected === n.id ? '' : undefined}
                aria-label={t('announce.star', { name: star.name, state: lookLabel(star) })}
                aria-expanded={selected === n.id}
                onClick={() => (selected === n.id ? close() : open(n.id))}
              >
                <span className="route-node-glyph">
                  <StarGlyph state={starLook(star)} size={size} progress={star.progress} recommended={isNext} breathe={isNext} />
                </span>
                <span
                  className="route-node-label"
                  data-align={align}
                  style={{
                    // Out of the way of a line bending to this side (`routeGeometry`): ending at the glyph's right edge, or starting at its left.
                    ...(align === 'center'
                      ? {}
                      : align === 'narrow'
                        ? { maxWidth: `${NARROW_NAME.share * 100}%`, WebkitLineClamp: NARROW_NAME.lines }
                        : { width: '100%', textAlign: align === 'end' ? 'right' : 'left', transform: `translateX(${(align === 'end' ? -1 : 1) * ((g.colW - 12) / 2 - size / 2)}px)` }),
                    fontSize: n.main ? (compact ? 12 : 13) : compact ? 11 : 12,
                    fontWeight: n.main || isNext ? 600 : 400,
                    color: n.main || isNext ? 'var(--on-sky-text)' : 'var(--on-sky-text-caption)',
                  }}
                >
                  {star.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {selectedNode && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-3 sm:justify-end sm:p-5">
          <div
            ref={cardRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="false"
            aria-labelledby="route-card-title"
            data-route-card
            className="route-card pointer-events-auto relative max-h-[55dvh] w-full max-w-[460px] overflow-y-auto p-4 sm:p-5"
          >
            <button
              type="button"
              onClick={close}
              aria-label={t('clusters.close')}
              className="cluster-focus absolute right-3 top-3 rounded-full p-1.5"
              style={{ color: 'var(--on-sky-text-body)' }}
            >
              <X size={18} aria-hidden="true" />
            </button>
            {selectedNode.kind === 'star' ? (
              <StarCardBody
                star={starById.get(selectedNode.unitId)!}
                isNext={selectedNode.unitId === nextId}
                stateLabel={lookLabel(starById.get(selectedNode.unitId)!)}
                prerequisites={starById.get(selectedNode.unitId)!.unlitPrerequisiteIds.map((id) => starById.get(id)).filter((s): s is Star => Boolean(s))}
                clusterNameOf={(id) => {
                  const c = clusterOfStar(clusters, id)
                  return c && c.clusterId !== cluster.clusterId ? c.name : null
                }}
                onGo={go}
                onPractise={onPractise}
              />
            ) : (
              <EntranceCardBody
                entrance={selectedNode}
                starById={starById}
                clusterName={clusterName}
                onGo={go}
              />
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function StarCardBody({
  star,
  isNext,
  stateLabel,
  prerequisites,
  clusterNameOf,
  onGo,
  onPractise,
}: {
  star: Star
  isNext: boolean
  stateLabel: string
  prerequisites: Star[]
  clusterNameOf: (unitId: string) => string | null
  onGo: (unitId: string) => void
  onPractise: (unitId: string) => void
}) {
  const { t } = useTranslation('starmap')
  const action = star.state === 'lit' ? t('star.open') : star.state === 'in_progress' ? t('star.continue') : t('clusters.practise')
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3 pr-8">
        <StarGlyph state={starLook(star)} size={40} progress={star.progress} recommended={isNext} />
        <div className="min-w-0">
          <h2 id="route-card-title" className="text-[18px] font-semibold leading-snug">
            {star.name}
          </h2>
          <p className="text-[13.5px]" style={{ color: 'var(--on-sky-text-body)' }}>
            {stateLabel}
          </p>
          {isNext && (
            <p className="mt-1 text-[13px] font-medium" style={{ color: 'var(--lit)' }}>
              {t('clusters.recommended')}
            </p>
          )}
        </div>
      </div>
      {prerequisites.length > 0 && (
        <div>
          <p className="mb-1 text-[13px] font-medium" style={{ color: 'var(--on-sky-text-caption)' }}>
            {t('star.prerequisites')}
          </p>
          <ul className="flex flex-col gap-1">
            {prerequisites.map((p) => {
              const other = clusterNameOf(p.unitId)
              return (
                <li key={p.unitId}>
                  <button
                    type="button"
                    onClick={() => onGo(p.unitId)}
                    className="cluster-focus flex w-full items-center gap-2 rounded-[10px] px-2 py-1.5 text-left text-[14px] hover:bg-[rgba(255,255,255,0.06)]"
                  >
                    <StarGlyph state={starLook(p)} size={20} progress={p.progress} />
                    <span className="min-w-0 flex-1">
                      {p.name}
                      {other && (
                        <span className="block text-[12px]" style={{ color: 'var(--starmap-ice)' }}>
                          {t('clusters.inCluster', { cluster: other })}
                        </span>
                      )}
                    </span>
                    <ArrowRight size={15} aria-hidden="true" style={{ color: 'var(--on-sky-text-caption)' }} />
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="mt-1 text-[12.5px]" style={{ color: 'var(--on-sky-text-caption)' }}>
            {t('star.stillOpen')}
          </p>
        </div>
      )}
      <Button variant="onSky" lift onClick={() => onPractise(star.unitId)} data-route-practise>
        {action}
      </Button>
    </div>
  )
}

function EntranceCardBody({
  entrance,
  starById,
  clusterName,
  onGo,
}: {
  entrance: RouteEntranceNode
  starById: ReadonlyMap<string, Star>
  clusterName: (unitId: string) => string
  onGo: (unitId: string) => void
}) {
  const { t } = useTranslation('starmap')
  const targets = entrance.targets.map((id) => starById.get(id)?.name).filter(Boolean)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3 pr-8">
        <LogIn size={26} aria-hidden="true" style={{ color: 'var(--starmap-ice)' }} className="mt-0.5 shrink-0" />
        <div className="min-w-0">
          <h2 id="route-card-title" className="text-[18px] font-semibold leading-snug">
            {t('clusters.entranceTitle')}
          </h2>
          <p className="text-[13.5px]" style={{ color: 'var(--on-sky-text-body)' }}>
            {t('clusters.neededFor', { names: targets.join(', ') })}
          </p>
        </div>
      </div>
      <ul className="flex flex-col gap-1">
        {entrance.sources.map(({ unitId }) => {
          const star = starById.get(unitId)
          if (!star) return null
          return (
            <li key={unitId}>
              <button
                type="button"
                onClick={() => onGo(unitId)}
                data-entrance-source={unitId}
                className="cluster-focus flex w-full items-center gap-2 rounded-[10px] px-2 py-1.5 text-left text-[14px] hover:bg-[rgba(255,255,255,0.06)]"
              >
                <StarGlyph state={starLook(star)} size={22} progress={star.progress} />
                <span className="min-w-0 flex-1">
                  {star.name}
                  <span className="block text-[12px]" style={{ color: 'var(--starmap-ice)' }}>
                    {t('clusters.inCluster', { cluster: clusterName(unitId) })}
                  </span>
                </span>
                <ArrowRight size={15} aria-hidden="true" style={{ color: 'var(--on-sky-text-caption)' }} />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
