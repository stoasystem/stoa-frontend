/**
 * The answer to a `grid_drawing` exercise (stoa-backend#594, #744): the grid
 * the backend describes, with the figure already given on it, and the
 * student's points, segments and polygons drawn over it.
 *
 * - Point: a tap puts a point on the nearest grid point, labelled with the
 *   next name the exercise asks for (`grid.labels`), then A, B, C ...
 * - Segment: two taps join two points; a tap on an empty grid point puts a
 *   point there first. The given figure's points can be joined too.
 * - Polygon: taps go round the corners; a tap on the first corner again (or
 *   "Close polygon") closes it.
 * - Undo takes back the last change, each drawn thing has its own delete in
 *   the list under the grid, and Clear empties the drawing.
 *
 * A tap anywhere snaps to the nearest grid point, so each point's target is
 * its whole cell. The keyboard moves a cursor from grid point to grid point
 * (arrows), acts there (Enter, Space), stops a segment or polygon half drawn
 * (Escape) and deletes the student's point under the cursor (Delete).
 *
 * The grid is drawn here rather than taken from the exercise's `figure` (the
 * same grid as an SVG): the taps have to land on its grid points. It scales
 * with the column and never scrolls sideways (#735).
 *
 * Paper is white with dark ink in the dark sky too, like `ExerciseFigure`.
 */
import { Check, Dot, Pentagon, Slash, Trash2, Undo2, X } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  addPoint,
  addPolygon,
  addSegment,
  allPoints,
  canAddPoint,
  canAddPolygon,
  canAddSegment,
  coordinateAt,
  drawingOf,
  emptyDrawing,
  givenOf,
  gridSize,
  hasSegment,
  pointAt,
  removePoint,
  removePolygon,
  removeSegment,
  snap,
} from '@/features/chapter/gridDrawing'
import { cn } from '@/lib/utils'
import type { GridDrawing, GridPoint, GridSpec } from '@/types/practice'

type Mode = 'point' | 'segment' | 'polygon'

/** Viewbox units per grid step, and the margin the axis numbers stand in. */
const CELL = 40
const PAD = 30

const INK = '#1D1D1F'
const RULE = '#D3D8E1'
const AXIS = '#5A6170'
/** The student's own drawing: 5.9:1 on the white paper. */
const OWN = '#1F5FD1'
/** A segment or polygon being drawn: 4.6:1 on white. */
const PENDING = '#B4530A'
const RIGHT = '#1E7B45'
const WRONG = '#C62828'

function frame(grid: GridSpec) {
  const { columns, rows } = gridSize(grid)
  const width = (columns - 1) * CELL + PAD * 2
  const height = (rows - 1) * CELL + PAD * 2
  const toX = (x: number) => PAD + ((x - grid.xMin) / grid.step) * CELL
  const toY = (y: number) => PAD + ((grid.yMax - y) / grid.step) * CELL
  return { columns, rows, width, height, toX, toY }
}

/** "(1|2)", the way the exercises write a point, with the reader's decimal comma. */
export function useCoordinates() {
  const { i18n } = useTranslation()
  return useMemo(() => {
    const number = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 })
    return (x: number, y: number) => `(${number.format(x)}|${number.format(y)})`
  }, [i18n.language])
}

/**
 * The grid, the given figure and a drawing on it, as one SVG. Not
 * interactive: the input and the review's right drawing both draw with it.
 */
function GridCanvas({
  grid,
  drawing,
  pending = [],
  cursor = null,
}: {
  grid: GridSpec
  drawing: GridDrawing
  pending?: string[]
  cursor?: { x: number; y: number } | null
}) {
  const { columns, rows, width, height, toX, toY } = frame(grid)
  const given = givenOf(grid)
  const points = new Map(allPoints(grid, drawing).map((point) => [point.label, point]))
  const own = new Set(drawing.points.map((point) => point.label))
  const corners = (labels: string[]) =>
    labels
      .map((label) => points.get(label))
      .filter((point): point is GridPoint => point !== undefined)
      .map((point) => `${toX(point.x)},${toY(point.y)}`)
      .join(' ')
  const segment = (labels: string[], key: string, stroke: string, strokeWidth: number) => {
    const [a, b] = labels.map((label) => points.get(label))
    if (!a || !b) return null
    return <line key={key} x1={toX(a.x)} y1={toY(a.y)} x2={toX(b.x)} y2={toY(b.y)} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
  }
  const whole = (value: number) => Number.isInteger(value)
  const xAxis = grid.axes && grid.yMin <= 0 && grid.yMax >= 0
  const yAxis = grid.axes && grid.xMin <= 0 && grid.xMax >= 0

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden="true"
      className="block h-auto w-full max-w-full select-none"
      style={{ maxWidth: width }}
    >
      <g stroke={RULE} strokeWidth={1}>
        {Array.from({ length: columns }, (_, column) => {
          const x = PAD + column * CELL
          return <line key={`c${column}`} x1={x} y1={PAD} x2={x} y2={height - PAD} />
        })}
        {Array.from({ length: rows }, (_, row) => {
          const y = PAD + row * CELL
          return <line key={`r${row}`} x1={PAD} y1={y} x2={width - PAD} y2={y} />
        })}
      </g>
      {xAxis && <line x1={PAD - 8} y1={toY(0)} x2={width - PAD + 10} y2={toY(0)} stroke={AXIS} strokeWidth={1.5} />}
      {yAxis && <line x1={toX(0)} y1={height - PAD + 8} x2={toX(0)} y2={PAD - 10} stroke={AXIS} strokeWidth={1.5} />}
      {grid.axisLabels && (
        <g fill={AXIS} fontSize={12}>
          {Array.from({ length: columns }, (_, column) => coordinateAt(grid.xMin, grid.step, column))
            .filter(whole)
            // The origin is numbered once, below and left of it.
            .filter((x) => !(x === 0 && xAxis && yAxis))
            .map((x) => (
              <text key={`x${x}`} x={toX(x)} y={(xAxis ? toY(0) : height - PAD) + 16} textAnchor="middle">
                {x}
              </text>
            ))}
          {Array.from({ length: rows }, (_, row) => coordinateAt(grid.yMin, grid.step, row))
            .filter(whole)
            .map((y) => (
              <text
                key={`y${y}`}
                x={(yAxis ? toX(0) : PAD) - 8}
                y={y === 0 && xAxis && yAxis ? toY(0) + 16 : toY(y) + 4}
                textAnchor="end"
              >
                {y}
              </text>
            ))}
        </g>
      )}

      {/* The given figure, in ink. */}
      {given.polygons.map((polygon, index) => (
        <polygon key={`gp${index}`} points={corners(polygon)} fill="rgba(29, 29, 31, 0.08)" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      ))}
      {given.segments.map((labels, index) => segment(labels, `gs${index}`, INK, 2))}

      {/* The student's drawing. */}
      {drawing.polygons.map((polygon, index) => (
        <polygon key={`p${index}`} data-grid-polygon={polygon.join('')} points={corners(polygon)} fill="rgba(31, 95, 209, 0.14)" stroke={OWN} strokeWidth={2.5} strokeLinejoin="round" />
      ))}
      {drawing.segments.map((labels, index) => segment(labels, `s${index}`, OWN, 2.5))}
      {pending.length > 1 && (
        <polyline points={corners(pending)} fill="none" stroke={PENDING} strokeWidth={2.5} strokeDasharray="6 4" strokeLinejoin="round" />
      )}

      {[...points.values()].map((point) => {
        const mine = own.has(point.label)
        const chosen = pending.includes(point.label)
        const colour = chosen ? PENDING : mine ? OWN : INK
        return (
          <g key={point.label} data-grid-point={point.label} data-grid-point-own={mine ? '' : undefined}>
            {chosen && <circle cx={toX(point.x)} cy={toY(point.y)} r={11} fill="none" stroke={PENDING} strokeWidth={2} />}
            <circle cx={toX(point.x)} cy={toY(point.y)} r={mine ? 6 : 5} fill={colour} />
            <text x={toX(point.x) + 8} y={toY(point.y) - 8} fontSize={15} fontWeight={600} fill={colour} paintOrder="stroke" stroke="#FFFFFF" strokeWidth={3}>
              {point.label}
            </text>
          </g>
        )
      })}

      {cursor && (
        <circle
          data-grid-cursor=""
          cx={toX(cursor.x)}
          cy={toY(cursor.y)}
          r={14}
          fill="none"
          stroke={INK}
          strokeWidth={2}
          strokeDasharray="4 3"
        />
      )}
    </svg>
  )
}

/** One drawing on its grid, to look at: the review's right drawing (#744). */
export function GridDrawingFigure({ grid, drawing, label }: { grid: GridSpec; drawing: GridDrawing; label: string }) {
  const at = useCoordinates()
  const { t } = useTranslation('chapter')
  const read = [
    ...drawing.points.map((point) => `${point.label}${at(point.x, point.y)}`),
    ...drawing.segments.map((segment) => t('stage.grid.segmentName', { name: segment.join('') })),
    ...drawing.polygons.map((polygon) => t('stage.grid.polygonName', { name: polygon.join('') })),
  ].join(', ')
  return (
    <span
      role="img"
      aria-label={`${label}: ${read}`}
      data-grid-figure=""
      className="flex min-w-0 max-w-full justify-center overflow-hidden rounded-[12px] bg-white p-2 text-[#1D1D1F]"
    >
      <GridCanvas grid={grid} drawing={drawingOf(drawing)} />
    </span>
  )
}

/** Focus that came by keyboard, where the browser can tell; otherwise taken to be. */
function focusVisible(element: Element) {
  try {
    return element.matches(':focus-visible')
  } catch {
    return true
  }
}

const tool =
  'inline-flex min-h-11 items-center gap-1.5 rounded-[12px] border px-3 text-[15px] font-medium text-on-sky focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-40'
const resting = 'border-[color:var(--on-sky-field-rule)] bg-white/[0.06]'

export function GridDrawingInput({
  grid,
  answer,
  onChange,
  verdict = null,
  disabled,
}: {
  grid: GridSpec
  /** The answer as it stands: a drawing, or anything else for none yet. */
  answer: unknown
  onChange: (drawing: GridDrawing) => void
  verdict?: 'right' | 'wrong' | null
  disabled: boolean
}) {
  const { t } = useTranslation('chapter')
  const at = useCoordinates()
  const helpId = useId()
  const drawing = useMemo(() => drawingOf(answer), [answer])
  const [mode, setMode] = useState<Mode>('point')
  // The corners chosen so far of a segment or polygon not yet drawn.
  const [pending, setPending] = useState<string[]>([])
  const [history, setHistory] = useState<GridDrawing[]>([])
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  const [focused, setFocused] = useState(false)
  // The cursor is the keyboard's: a tap shows where it landed by its point.
  const [keyed, setKeyed] = useState(false)
  const [said, setSaid] = useState('')
  const surface = useRef<HTMLDivElement>(null)

  // What this control last handed out. Anything else arriving -- a new
  // exercise, Try again emptying the answer -- starts clean.
  const emitted = useRef<unknown>(answer)
  useEffect(() => {
    if (answer === emitted.current) return
    emitted.current = answer
    setHistory([])
    setPending([])
  }, [answer])

  const commit = (next: GridDrawing, message: string) => {
    if (next === drawing) return false
    setHistory((list) => [...list, drawing])
    emitted.current = next
    onChange(next)
    setSaid(message)
    return true
  }

  const name = (point: GridPoint) => `${point.label}${at(point.x, point.y)}`

  /** The point to use at (x, y) for a segment or polygon: the one there, or a new one put there. */
  const pointFor = (x: number, y: number): { label: string; drawing: GridDrawing } | null => {
    const there = pointAt(grid, drawing, x, y)
    if (there) return { label: there.label, drawing }
    if (!canAddPoint(grid, drawing)) {
      setSaid(t('stage.grid.limitPoints', { count: grid.limits.points }))
      return null
    }
    const next = addPoint(grid, drawing, x, y)
    const placed = next.points[next.points.length - 1]
    commit(next, t('stage.grid.placed', { name: name(placed) }))
    return { label: placed.label, drawing: next }
  }

  const act = (x: number, y: number) => {
    if (disabled) return
    if (mode === 'point') {
      const there = pointAt(grid, drawing, x, y)
      if (there) {
        setSaid(t('stage.grid.occupied', { name: there.label }))
        return
      }
      if (!canAddPoint(grid, drawing)) {
        setSaid(t('stage.grid.limitPoints', { count: grid.limits.points }))
        return
      }
      const next = addPoint(grid, drawing, x, y)
      commit(next, t('stage.grid.placed', { name: name(next.points[next.points.length - 1]) }))
      return
    }
    if (mode === 'segment') {
      if (pending.length === 0 && !canAddSegment(grid, drawing)) {
        setSaid(t('stage.grid.limitSegments', { count: grid.limits.segments }))
        return
      }
      const found = pointFor(x, y)
      if (!found) return
      if (pending.length === 0) {
        setPending([found.label])
        setSaid(t('stage.grid.segmentFrom', { label: found.label }))
        return
      }
      const [from] = pending
      setPending([])
      if (from === found.label) return
      if (hasSegment(found.drawing, from, found.label)) {
        setSaid(t('stage.grid.segmentThere', { name: from + found.label }))
        return
      }
      const next = addSegment(grid, found.drawing, from, found.label)
      if (next !== found.drawing) {
        setHistory((list) => (found.drawing === drawing ? [...list, drawing] : list))
        emitted.current = next
        onChange(next)
        setSaid(t('stage.grid.segmentDrawn', { name: from + found.label }))
      }
      return
    }
    // A polygon.
    if (pending.length === 0 && !canAddPolygon(grid, drawing)) {
      setSaid(t('stage.grid.limitPolygons', { count: grid.limits.polygons }))
      return
    }
    const there = pointAt(grid, drawing, x, y)
    if (there && pending.includes(there.label)) {
      if (there.label === pending[0] && pending.length >= 3) closePolygon(pending, drawing)
      return
    }
    if (pending.length >= 12) return
    const found = pointFor(x, y)
    if (!found) return
    const corners = [...pending, found.label]
    setPending(corners)
    setSaid(
      corners.length >= 3
        ? t('stage.grid.polygonOpen', { corners: corners.join(''), first: corners[0] })
        : t('stage.grid.polygonCorner', { label: found.label }),
    )
  }

  const closePolygon = (corners: string[], base: GridDrawing) => {
    const next = addPolygon(grid, base, corners)
    setPending([])
    if (next === base) return
    commit(next, t('stage.grid.polygonDrawn', { name: corners.join('') }))
  }

  const undo = () => {
    const previous = history[history.length - 1]
    if (!previous || disabled) return
    setHistory((list) => list.slice(0, -1))
    setPending([])
    emitted.current = previous
    onChange(previous)
    setSaid(t('stage.grid.undone'))
  }

  const clear = () => {
    setPending([])
    commit(emptyDrawing(), t('stage.grid.cleared'))
  }

  const choose = (next: Mode) => {
    setMode(next)
    setPending([])
  }

  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    const svg = surface.current?.querySelector('svg')
    if (!svg || disabled) return
    const box = svg.getBoundingClientRect()
    if (box.width === 0 || box.height === 0) return
    const { width, height } = frame(grid)
    const vx = ((event.clientX - box.left) / box.width) * width
    const vy = ((event.clientY - box.top) / box.height) * height
    const x = grid.xMin + ((vx - PAD) / CELL) * grid.step
    const y = grid.yMax - ((vy - PAD) / CELL) * grid.step
    const point = snap(grid, x, y)
    setCursor(point)
    setKeyed(false)
    act(point.x, point.y)
  }

  const start = () => {
    const first = allPoints(grid, drawing)[0]
    return first ? { x: first.x, y: first.y } : snap(grid, (grid.xMin + grid.xMax) / 2, (grid.yMin + grid.yMax) / 2)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    setKeyed(true)
    const moves: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }
    const here = cursor ?? start()
    if (event.key in moves) {
      event.preventDefault()
      const [dx, dy] = moves[event.key]
      const next = snap(grid, here.x + dx * grid.step, here.y + dy * grid.step)
      setCursor(next)
      const there = pointAt(grid, drawing, next.x, next.y)
      setSaid(there ? `${at(next.x, next.y)}, ${there.label}` : at(next.x, next.y))
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setCursor(here)
      act(here.x, here.y)
      return
    }
    if (event.key === 'Escape' && pending.length > 0) {
      event.preventDefault()
      event.stopPropagation()
      setPending([])
      setSaid(t('stage.grid.cancelled'))
      return
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      const there = drawing.points.find((point) => point.x === here.x && point.y === here.y)
      if (!there) return
      event.preventDefault()
      setPending([])
      commit(removePoint(drawing, there.label), t('stage.grid.removed', { name: t('stage.grid.pointName', { name: there.label }) }))
    }
  }

  const hint =
    mode === 'point'
      ? t('stage.grid.hintPoint')
      : mode === 'segment'
        ? pending.length > 0
          ? t('stage.grid.segmentFrom', { label: pending[0] })
          : t('stage.grid.hintSegment')
        : pending.length >= 3
          ? t('stage.grid.polygonOpen', { corners: pending.join(''), first: pending[0] })
          : t('stage.grid.hintPolygon')

  const modes: { id: Mode; label: string; icon: typeof Dot }[] = [
    { id: 'point', label: t('stage.grid.point'), icon: Dot },
    { id: 'segment', label: t('stage.grid.segment'), icon: Slash },
    { id: 'polygon', label: t('stage.grid.polygon'), icon: Pentagon },
  ]
  const items = [
    ...drawing.points.map((point) => ({
      key: `p-${point.label}`,
      text: name(point),
      what: t('stage.grid.pointName', { name: point.label }),
      remove: () => removePoint(drawing, point.label),
    })),
    ...drawing.segments.map((segment, index) => ({
      key: `s-${index}`,
      text: t('stage.grid.segmentName', { name: segment.join('') }),
      what: t('stage.grid.segmentName', { name: segment.join('') }),
      remove: () => removeSegment(drawing, index),
    })),
    ...drawing.polygons.map((polygon, index) => ({
      key: `g-${index}`,
      text: t('stage.grid.polygonName', { name: polygon.join('') }),
      what: t('stage.grid.polygonName', { name: polygon.join('') }),
      remove: () => removePolygon(drawing, index),
    })),
  ]

  return (
    <div data-grid-drawing className="flex min-w-0 flex-col gap-3">
      <div role="group" aria-label={t('stage.grid.tools')} className="flex flex-wrap items-center gap-2">
        {modes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            data-grid-mode={id}
            aria-pressed={mode === id}
            disabled={disabled}
            onClick={() => choose(id)}
            className={cn(tool, mode === id ? 'border-lit bg-lit/16' : resting)}
          >
            <Icon size={18} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <div
        ref={surface}
        role="application"
        tabIndex={disabled ? -1 : 0}
        aria-label={t('stage.grid.label')}
        aria-describedby={helpId}
        aria-disabled={disabled || undefined}
        data-grid-surface=""
        data-grid-verdict={verdict ?? undefined}
        onClick={onClick}
        onKeyDown={onKeyDown}
        onFocus={(event) => {
          setFocused(true)
          setKeyed(focusVisible(event.currentTarget))
          if (!cursor) setCursor(start())
        }}
        onBlur={() => setFocused(false)}
        className={cn(
          'flex min-w-0 max-w-full touch-manipulation justify-center overflow-hidden rounded-[12px] border-2 bg-white p-2 text-[#1D1D1F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          disabled ? 'cursor-default' : 'cursor-crosshair',
        )}
        style={{ borderColor: verdict === 'right' ? RIGHT : verdict === 'wrong' ? WRONG : 'transparent' }}
      >
        <GridCanvas grid={grid} drawing={drawing} pending={pending} cursor={focused && keyed && !disabled ? cursor : null} />
      </div>
      <p id={helpId} className="sr-only">
        {t('stage.grid.keys')}
      </p>
      <p role="status" aria-live="polite" className="sr-only">
        {said}
      </p>

      {!disabled && (
        <p data-grid-hint className="m-0 text-[13px] text-[color:var(--on-sky-text-body)]">
          {hint}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {mode === 'polygon' && pending.length >= 3 && (
          <button type="button" data-grid-close disabled={disabled} onClick={() => closePolygon(pending, drawing)} className={cn(tool, 'border-lit bg-lit/16')}>
            <Check size={18} aria-hidden="true" />
            {t('stage.grid.closePolygon')}
          </button>
        )}
        {pending.length > 0 && (
          <button type="button" data-grid-cancel disabled={disabled} onClick={() => setPending([])} className={cn(tool, resting)}>
            {t('stage.grid.cancel')}
          </button>
        )}
        <button type="button" data-grid-undo disabled={disabled || history.length === 0} onClick={undo} className={cn(tool, resting)}>
          <Undo2 size={18} aria-hidden="true" />
          {t('stage.grid.undo')}
        </button>
        <button
          type="button"
          data-grid-clear
          disabled={disabled || items.length === 0}
          onClick={clear}
          className={cn(tool, resting)}
        >
          <Trash2 size={18} aria-hidden="true" />
          {t('stage.grid.clear')}
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="m-0 text-[13px] font-semibold text-[color:var(--on-sky-text-body)]">{t('stage.grid.drawn')}</p>
        {items.length === 0 ? (
          <p className="m-0 text-[15px] text-[color:var(--on-sky-text-body)]">{t('stage.grid.empty')}</p>
        ) : (
          <ul data-grid-items className="m-0 flex list-none flex-wrap gap-2 p-0">
            {items.map((item) => (
              <li
                key={item.key}
                className="inline-flex min-h-11 items-center gap-1 rounded-[12px] border border-[color:var(--on-sky-field-rule)] bg-white/[0.06] pl-3 text-[15px] text-on-sky"
              >
                <span>{item.text}</span>
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={t('stage.grid.remove', { name: item.what })}
                  onClick={() => {
                    setPending([])
                    commit(item.remove(), t('stage.grid.removed', { name: item.what }))
                  }}
                  className="inline-flex size-11 items-center justify-center rounded-[12px] text-[color:var(--on-sky-text-body)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-40"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
