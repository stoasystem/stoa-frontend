/**
 * A drawing on a coordinate grid (stoa-backend#594), as the answer to a
 * `grid_drawing` exercise is put together: points on grid points, segments
 * between two points, polygons round three or more. Nothing is judged here;
 * these keep a drawing one the backend takes as an answer -- every point on a
 * grid point inside the grid, no two on the same one, labels of 1-3 letters,
 * digits or primes that repeat neither each other nor the given figure's, a
 * segment between two different points and not drawn twice, a polygon round
 * 3-12 different points, and no more of each than `grid.limits`.
 */
import type { GridDrawing, GridPoint, GridSpec } from '@/types/practice'

export const MAX_POLYGON_CORNERS = 12

export const emptyDrawing = (): GridDrawing => ({ points: [], segments: [], polygons: [] })

/** Whether an answer value is a drawing (the rest are text or a list of texts). */
export function isDrawing(value: unknown): value is GridDrawing {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && Array.isArray((value as GridDrawing).points)
}

/** The drawing an answer value holds; anything else (a fresh, empty answer) is an empty one. */
export function drawingOf(value: unknown): GridDrawing {
  if (!isDrawing(value)) return emptyDrawing()
  return { points: value.points, segments: value.segments ?? [], polygons: value.polygons ?? [] }
}

/** Not empty: the backend refuses an empty drawing. */
export function drawingFilled(drawing: GridDrawing) {
  return drawing.points.length > 0 || drawing.segments.length > 0 || drawing.polygons.length > 0
}

/** The same drawing, piece for piece. */
export function sameDrawing(a: GridDrawing, b: GridDrawing) {
  return JSON.stringify(drawingOf(a)) === JSON.stringify(drawingOf(b))
}

/** The given figure, never null. */
export function givenOf(grid: GridSpec): GridDrawing {
  return drawingOf(grid.given)
}

/** How many grid points each way, counting both ends. */
export function gridSize(grid: GridSpec) {
  return {
    columns: Math.round((grid.xMax - grid.xMin) / grid.step) + 1,
    rows: Math.round((grid.yMax - grid.yMin) / grid.step) + 1,
  }
}

/**
 * The coordinate of grid column or row `index`. A half is exact in binary, so
 * `xMin + index * 0.5` is the number the backend reads, never 2.4999...
 */
export const coordinateAt = (min: number, step: number, index: number) => min + index * step

/** The grid point nearest (x, y), inside the grid. */
export function snap(grid: GridSpec, x: number, y: number): { x: number; y: number } {
  const { columns, rows } = gridSize(grid)
  const column = Math.min(columns - 1, Math.max(0, Math.round((x - grid.xMin) / grid.step)))
  const row = Math.min(rows - 1, Math.max(0, Math.round((y - grid.yMin) / grid.step)))
  return { x: coordinateAt(grid.xMin, grid.step, column), y: coordinateAt(grid.yMin, grid.step, row) }
}

/** Every point on the grid, the given figure's first: what a segment or a polygon may join. */
export function allPoints(grid: GridSpec, drawing: GridDrawing): GridPoint[] {
  return [...givenOf(grid).points, ...drawing.points]
}

export function pointAt(grid: GridSpec, drawing: GridDrawing, x: number, y: number): GridPoint | undefined {
  return allPoints(grid, drawing).find((point) => point.x === x && point.y === y)
}

const LABEL = /^[A-Za-z0-9'′]{1,3}$/

/**
 * The label the next point gets: the next of the names the exercise asks for
 * (`grid.labels`), then A, B, C ... Z, A1, B1 ... -- never one already on
 * the grid, the given figure's included.
 */
export function nextLabel(grid: GridSpec, drawing: GridDrawing): string {
  const taken = new Set(allPoints(grid, drawing).map((point) => point.label))
  const asked = (grid.labels ?? []).find((label) => LABEL.test(label) && !taken.has(label))
  if (asked) return asked
  for (let round = 0; ; round += 1) {
    for (let letter = 0; letter < 26; letter += 1) {
      const label = String.fromCharCode(65 + letter) + (round === 0 ? '' : String(round))
      if (!taken.has(label)) return label
    }
  }
}

const limitOf = (grid: GridSpec, kind: keyof GridSpec['limits']) => grid.limits?.[kind] ?? Number.POSITIVE_INFINITY

export function canAddPoint(grid: GridSpec, drawing: GridDrawing) {
  return drawing.points.length < limitOf(grid, 'points')
}

export function canAddSegment(grid: GridSpec, drawing: GridDrawing) {
  return drawing.segments.length < limitOf(grid, 'segments')
}

export function canAddPolygon(grid: GridSpec, drawing: GridDrawing) {
  return drawing.polygons.length < limitOf(grid, 'polygons')
}

/**
 * A new point on the grid point (x, y), labelled `nextLabel`. Unchanged where
 * a point already stands there, off the grid, or at the limit.
 */
export function addPoint(grid: GridSpec, drawing: GridDrawing, x: number, y: number): GridDrawing {
  const at = snap(grid, x, y)
  if (at.x !== x || at.y !== y || pointAt(grid, drawing, x, y) || !canAddPoint(grid, drawing)) return drawing
  return { ...drawing, points: [...drawing.points, { label: nextLabel(grid, drawing), x, y }] }
}

const sameSegment = (segment: string[], a: string, b: string) =>
  (segment[0] === a && segment[1] === b) || (segment[0] === b && segment[1] === a)

export function hasSegment(drawing: GridDrawing, a: string, b: string) {
  return drawing.segments.some((segment) => sameSegment(segment, a, b))
}

/** A segment from a to b, either way round; unchanged where it is drawn already, a is b, or at the limit. */
export function addSegment(grid: GridSpec, drawing: GridDrawing, a: string, b: string): GridDrawing {
  const labels = new Set(allPoints(grid, drawing).map((point) => point.label))
  if (a === b || !labels.has(a) || !labels.has(b) || hasSegment(drawing, a, b) || !canAddSegment(grid, drawing)) return drawing
  return { ...drawing, segments: [...drawing.segments, [a, b]] }
}

/** A polygon round these points; unchanged unless they are 3-12 different points on the grid, or at the limit. */
export function addPolygon(grid: GridSpec, drawing: GridDrawing, corners: string[]): GridDrawing {
  const labels = new Set(allPoints(grid, drawing).map((point) => point.label))
  if (
    corners.length < 3 ||
    corners.length > MAX_POLYGON_CORNERS ||
    new Set(corners).size !== corners.length ||
    !corners.every((corner) => labels.has(corner)) ||
    !canAddPolygon(grid, drawing)
  ) {
    return drawing
  }
  return { ...drawing, polygons: [...drawing.polygons, [...corners]] }
}

/** The student's point gone, and every segment and polygon through it. A given point stays. */
export function removePoint(drawing: GridDrawing, label: string): GridDrawing {
  return {
    points: drawing.points.filter((point) => point.label !== label),
    segments: drawing.segments.filter((segment) => !segment.includes(label)),
    polygons: drawing.polygons.filter((polygon) => !polygon.includes(label)),
  }
}

export function removeSegment(drawing: GridDrawing, index: number): GridDrawing {
  return { ...drawing, segments: drawing.segments.filter((_, at) => at !== index) }
}

export function removePolygon(drawing: GridDrawing, index: number): GridDrawing {
  return { ...drawing, polygons: drawing.polygons.filter((_, at) => at !== index) }
}
