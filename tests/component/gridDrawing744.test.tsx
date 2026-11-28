/**
 * #744: the answer to a `grid_drawing` exercise (stoa-backend#594). Points snap
 * to grid points and are labelled in order, segments and polygons join them,
 * undo / delete / clear work, the keyboard can do all of it, and what is
 * handed on as the answer is the drawing on screen, in the backend's shape.
 */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  answerFilled,
  initialPracticeLessonState,
  practiceLessonReducer,
  sameAnswer,
} from '@/components/practice/practiceLessonReducer'
import { AnswerInput, drawnOnGrid, type AnswerValue } from '@/features/chapter/answerControls'
import {
  addPoint,
  addPolygon,
  addSegment,
  emptyDrawing,
  nextLabel,
  removePoint,
  snap,
} from '@/features/chapter/gridDrawing'
import i18n from '@/i18n'
import type { GridDrawing, GridSpec } from '@/types/practice'

const LIMITS = { points: 26, segments: 30, polygons: 6 }

/** stoa-backend#594's samples, as the student projection sends their grids. */
const PLOT: GridSpec = { xMin: 0, xMax: 8, yMin: 0, yMax: 6, step: 1, axes: true, axisLabels: true, labels: ['A', 'B', 'C'], given: { points: [], segments: [], polygons: [] }, limits: LIMITS }
const RECTANGLE: GridSpec = { xMin: 0, xMax: 10, yMin: 0, yMax: 8, step: 1, axes: false, axisLabels: false, labels: [], given: { points: [], segments: [], polygons: [] }, limits: LIMITS }
const ROTATION: GridSpec = {
  xMin: 0,
  xMax: 10,
  yMin: 0,
  yMax: 8,
  step: 1,
  axes: true,
  axisLabels: false,
  labels: ["A'", "B'", "C'"],
  given: {
    points: [
      { label: 'A', x: 1, y: 1 },
      { label: 'B', x: 4, y: 1 },
      { label: 'C', x: 1, y: 3 },
      { label: 'Z', x: 5, y: 4 },
    ],
    segments: [],
    polygons: [['A', 'B', 'C']],
  },
  limits: LIMITS,
}

/** The viewbox the control draws: 40 units a step, a 30-unit margin. */
const CELL = 40
const PAD = 30

beforeEach(async () => {
  await i18n.changeLanguage('en')
})
afterEach(cleanup)

describe('a drawing, kept one the backend takes', () => {
  it('labels points with the names the exercise asks for, then A, B, C, never a given label', () => {
    let drawing = emptyDrawing()
    expect(nextLabel(ROTATION, drawing)).toBe("A'")
    drawing = addPoint(ROTATION, drawing, 8, 0)
    drawing = addPoint(ROTATION, drawing, 8, 3)
    drawing = addPoint(ROTATION, drawing, 6, 0)
    expect(drawing.points.map((point) => point.label)).toEqual(["A'", "B'", "C'"])
    // Past the asked names: A, B and C are the given triangle's, so D.
    expect(nextLabel(ROTATION, drawing)).toBe('D')
    expect(nextLabel(RECTANGLE, emptyDrawing())).toBe('A')
  })

  it('puts a point only on a free grid point inside the grid, and no more than the limit', () => {
    const drawing = addPoint(PLOT, emptyDrawing(), 1, 2)
    expect(addPoint(PLOT, drawing, 1, 2)).toBe(drawing)
    expect(addPoint(PLOT, drawing, 9, 2)).toBe(drawing)
    expect(addPoint(PLOT, drawing, 1.5, 2)).toBe(drawing)
    // A given point's grid point is taken too.
    expect(addPoint(ROTATION, emptyDrawing(), 5, 4).points).toEqual([])
    const full = { ...PLOT, limits: { ...LIMITS, points: 1 } }
    expect(addPoint(full, drawing, 2, 2)).toBe(drawing)
  })

  it('snaps to the nearest grid point, halves on a half-step grid', () => {
    expect(snap(PLOT, 1.4, 2.6)).toEqual({ x: 1, y: 3 })
    expect(snap(PLOT, -3, 99)).toEqual({ x: 0, y: 6 })
    expect(snap({ ...PLOT, step: 0.5 }, 1.3, 2.2)).toEqual({ x: 1.5, y: 2 })
  })

  it('draws a segment once, either way round, and a polygon round 3 to 12 different points', () => {
    let drawing = addPoint(RECTANGLE, addPoint(RECTANGLE, emptyDrawing(), 1, 1), 5, 1)
    drawing = addSegment(RECTANGLE, drawing, 'A', 'B')
    expect(addSegment(RECTANGLE, drawing, 'B', 'A')).toBe(drawing)
    expect(addSegment(RECTANGLE, drawing, 'A', 'A')).toBe(drawing)
    expect(addPolygon(RECTANGLE, drawing, ['A', 'B'])).toBe(drawing)
    expect(addPolygon(RECTANGLE, drawing, ['A', 'B', 'A'])).toBe(drawing)
    // The given figure's points can be joined.
    expect(addSegment(ROTATION, emptyDrawing(), 'A', 'Z').segments).toEqual([['A', 'Z']])
  })

  it('takes away every segment and polygon through a deleted point', () => {
    let drawing: GridDrawing = emptyDrawing()
    for (const [x, y] of [[1, 1], [5, 1], [5, 4]]) drawing = addPoint(RECTANGLE, drawing, x, y)
    drawing = addPolygon(RECTANGLE, addSegment(RECTANGLE, drawing, 'A', 'B'), ['A', 'B', 'C'])
    expect(removePoint(drawing, 'B')).toEqual({ points: [drawing.points[0], drawing.points[2]], segments: [], polygons: [] })
  })

  it('counts a drawing as an answer once something is drawn, and compares drawings piece for piece', () => {
    expect(answerFilled(emptyDrawing())).toBe(false)
    const drawing = addPoint(PLOT, emptyDrawing(), 1, 2)
    expect(answerFilled(drawing)).toBe(true)
    expect(sameAnswer(drawing, { ...drawing, points: [...drawing.points] })).toBe(true)
    expect(sameAnswer(drawing, emptyDrawing())).toBe(false)
    expect(sameAnswer(drawing, 'A')).toBe(false)
    // Try again empties the drawing, as it empties a typed answer.
    const tried = practiceLessonReducer({ ...initialPracticeLessonState, answer: drawing }, { type: 'retry' })
    expect(tried.answer).toEqual(emptyDrawing())
  })

  it('shows the grid in the answer, not the backend’s figure of it as well', () => {
    expect(drawnOnGrid({ type: 'grid_drawing', grid: PLOT })).toBe(true)
    expect(drawnOnGrid({ type: 'grid_drawing', grid: null })).toBe(false)
    expect(drawnOnGrid({ type: 'multiple_choice' })).toBe(false)
  })
})

function Harness({ grid, disabled = false }: { grid: GridSpec; disabled?: boolean }) {
  const [value, setValue] = useState<AnswerValue>('')
  return (
    <I18nextProvider i18n={i18n}>
      <AnswerInput challenge={{ challengeId: 'grid-q1', type: 'grid_drawing', grid }} value={value} onChange={setValue} disabled={disabled} />
      <output data-answer>{JSON.stringify(value)}</output>
    </I18nextProvider>
  )
}

const answer = (): GridDrawing | string => JSON.parse(document.querySelector('[data-answer]')!.textContent!)

/** The surface laid out at 1 px a viewbox unit, so a grid point is where the drawing puts it. */
function layOut(grid: GridSpec) {
  const svg = document.querySelector('[data-grid-surface] svg')!
  const width = ((grid.xMax - grid.xMin) / grid.step) * CELL + PAD * 2
  const height = ((grid.yMax - grid.yMin) / grid.step) * CELL + PAD * 2
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width, height, right: width, bottom: height, x: 0, y: 0, toJSON: () => ({}) })
}

/** A tap near (x, y): a few pixels off, as a finger lands. */
function tap(grid: GridSpec, x: number, y: number) {
  const surface = document.querySelector<HTMLElement>('[data-grid-surface]')!
  fireEvent.click(surface, {
    clientX: PAD + ((x - grid.xMin) / grid.step) * CELL + 7,
    clientY: PAD + ((grid.yMax - y) / grid.step) * CELL - 9,
  })
}

describe('drawing by touch', () => {
  it('plots the points the plotting sample asks for and hands on exactly that drawing', () => {
    render(<Harness grid={PLOT} />)
    layOut(PLOT)
    tap(PLOT, 1, 2)
    tap(PLOT, 4, 5)
    tap(PLOT, 7, 1)
    // A second tap on a point does not put another there.
    tap(PLOT, 7, 1)
    // A tap shows where it landed by its point, not by the keyboard's cursor.
    expect(document.querySelector('[data-grid-cursor]')).toBeNull()
    expect(answer()).toEqual({
      points: [
        { label: 'A', x: 1, y: 2 },
        { label: 'B', x: 4, y: 5 },
        { label: 'C', x: 7, y: 1 },
      ],
      segments: [],
      polygons: [],
    })
    const items = within(document.querySelector<HTMLElement>('[data-grid-items]')!)
    expect(items.getByText('A(1|2)')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-grid-point-own]')).toHaveLength(3)
  })

  it('draws a rectangle as a polygon, putting its corners as it goes, closed on its first corner', async () => {
    const user = userEvent.setup()
    render(<Harness grid={RECTANGLE} />)
    layOut(RECTANGLE)
    await user.click(screen.getByRole('button', { name: 'Polygon' }))
    tap(RECTANGLE, 1, 1)
    tap(RECTANGLE, 5, 1)
    tap(RECTANGLE, 5, 4)
    tap(RECTANGLE, 1, 4)
    expect(document.querySelector('[data-grid-hint]')).toHaveTextContent('Polygon ABCD: tap A to close it.')
    tap(RECTANGLE, 1, 1)
    expect(answer()).toEqual({
      points: [
        { label: 'A', x: 1, y: 1 },
        { label: 'B', x: 5, y: 1 },
        { label: 'C', x: 5, y: 4 },
        { label: 'D', x: 1, y: 4 },
      ],
      segments: [],
      polygons: [['A', 'B', 'C', 'D']],
    })
    expect(document.querySelector('[data-grid-polygon="ABCD"]')).not.toBeNull()
  })

  it('draws the image triangle on the given figure’s grid, with the names the exercise asks for', async () => {
    const user = userEvent.setup()
    render(<Harness grid={ROTATION} />)
    layOut(ROTATION)
    await user.click(screen.getByRole('button', { name: 'Polygon' }))
    tap(ROTATION, 8, 0)
    tap(ROTATION, 8, 3)
    tap(ROTATION, 6, 0)
    await user.click(screen.getByRole('button', { name: 'Close polygon' }))
    expect(answer()).toEqual({
      points: [
        { label: "A'", x: 8, y: 0 },
        { label: "B'", x: 8, y: 3 },
        { label: "C'", x: 6, y: 0 },
      ],
      segments: [],
      polygons: [["A'", "B'", "C'"]],
    })
    // The given figure is drawn, and not handed on.
    expect(document.querySelector('[data-grid-point="Z"]')).not.toBeNull()
  })

  it('joins two points with a segment, a given one included', async () => {
    const user = userEvent.setup()
    render(<Harness grid={ROTATION} />)
    layOut(ROTATION)
    await user.click(screen.getByRole('button', { name: 'Segment' }))
    tap(ROTATION, 5, 4) // Z, given
    expect(document.querySelector('[data-grid-hint]')).toHaveTextContent('Segment from Z: tap the second point.')
    expect(within(document.querySelector<HTMLElement>('[data-grid-drawing]')!).getByRole('status')).toHaveTextContent('Segment from Z: tap the second point.')
    tap(ROTATION, 8, 0) // empty: a point goes there first
    expect(answer()).toEqual({ points: [{ label: "A'", x: 8, y: 0 }], segments: [['Z', "A'"]], polygons: [] })
  })
})

describe('undo, delete and clear', () => {
  it('undoes the last change, deletes one thing, and clears the lot', async () => {
    const user = userEvent.setup()
    render(<Harness grid={RECTANGLE} />)
    layOut(RECTANGLE)
    tap(RECTANGLE, 1, 1)
    tap(RECTANGLE, 2, 2)
    tap(RECTANGLE, 3, 3)
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect((answer() as GridDrawing).points.map((point) => point.label)).toEqual(['A', 'B'])

    await user.click(screen.getByRole('button', { name: 'Segment' }))
    tap(RECTANGLE, 1, 1)
    tap(RECTANGLE, 2, 2)
    expect((answer() as GridDrawing).segments).toEqual([['A', 'B']])
    await user.click(screen.getByRole('button', { name: 'Delete Segment AB' }))
    expect((answer() as GridDrawing).segments).toEqual([])

    await user.click(screen.getByRole('button', { name: 'Delete Point A' }))
    expect((answer() as GridDrawing).points.map((point) => point.label)).toEqual(['B'])

    await user.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(answer()).toEqual(emptyDrawing())
    expect(screen.getByText('Nothing drawn yet.')).toBeInTheDocument()
    // Clearing is a change like any other: undone, the point is back.
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect((answer() as GridDrawing).points.map((point) => point.label)).toEqual(['B'])
  })

  it('changes nothing once the answer is locked', () => {
    render(<Harness grid={PLOT} disabled />)
    layOut(PLOT)
    tap(PLOT, 1, 2)
    expect(answer()).toBe('')
    expect(screen.getByRole('button', { name: 'Point' })).toBeDisabled()
    expect(screen.getByRole('application')).toHaveAttribute('tabindex', '-1')
  })
})

describe('drawing by keyboard', () => {
  it('moves a cursor from grid point to grid point and puts, joins and deletes points', async () => {
    const user = userEvent.setup()
    render(<Harness grid={PLOT} />)
    const surface = screen.getByRole('application', { name: 'Coordinate grid' })
    act(() => surface.focus())
    // An empty grid starts the cursor in its middle, (4|3); the keyboard shows it.
    await user.keyboard('{ArrowLeft}')
    expect(document.querySelector('[data-grid-cursor]')).not.toBeNull()
    await user.keyboard('{ArrowLeft}{ArrowLeft}{ArrowDown}{Enter}')
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowUp}{ArrowUp}{ArrowUp} ')
    expect(answer()).toEqual({
      points: [
        { label: 'A', x: 1, y: 2 },
        { label: 'B', x: 4, y: 5 },
      ],
      segments: [],
      polygons: [],
    })

    await user.click(screen.getByRole('button', { name: 'Segment' }))
    act(() => surface.focus())
    await user.keyboard('{Enter}')
    // Escape stops a segment half drawn.
    await user.keyboard('{Escape}')
    expect(document.querySelector('[data-grid-cancel]')).toBeNull()
    await user.keyboard('{Enter}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowDown}{ArrowDown}{ArrowDown}{Enter}')
    expect((answer() as GridDrawing).segments).toEqual([['B', 'A']])

    // Delete takes away the student's point under the cursor, and its segment.
    await user.keyboard('{Delete}')
    expect(answer()).toEqual({ points: [{ label: 'B', x: 4, y: 5 }], segments: [], polygons: [] })
  })
})
