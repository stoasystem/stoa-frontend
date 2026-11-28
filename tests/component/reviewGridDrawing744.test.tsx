/**
 * #744: a drawing on a grid in the review. The grid is the answer's own (the
 * backend's figure of it is not drawn as well), the drawing goes to the
 * backend as a drawing, and a right answer shows, under the student's own
 * drawing, the drawing the exercise keeps as right. A wrong one does not:
 * the student tries again first, as with the explanation.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', async () => {
  const files: Record<string, Record<string, unknown>> = {
    practice: (await import('@/i18n/locales/en/practice.json')).default as Record<string, unknown>,
    chapter: (await import('@/i18n/locales/en/chapter.json')).default as Record<string, unknown>,
  }

  function lookup(namespace: string, key: string): string {
    const value = key
      .split('.')
      .reduce<unknown>(
        (node, part) => (node as Record<string, unknown>)?.[part],
        files[namespace] ?? {},
      )
    return typeof value === 'string' ? value : key
  }

  return {
    useTranslation: (namespace = 'practice') => ({
      t: (key: string, options?: Record<string, unknown>) => {
        const count = options?.count
        const plural =
          typeof count === 'number'
            ? lookup(namespace, `${key}_${count === 1 ? 'one' : 'other'}`)
            : key
        const template =
          typeof count === 'number' && !plural.startsWith(key) ? plural : lookup(namespace, key)
        return Object.entries(options ?? {}).reduce(
          (text, [name, value]) => text.split(`{{${name}}}`).join(String(value)),
          template,
        )
      },
      i18n: { language: 'en' },
    }),
  }
})

vi.mock('@/services/practice/practiceApi', () => ({
  getDueReview: vi.fn(),
  getReviewSummary: vi.fn(),
  submitChallengeAnswer: vi.fn(),
}))

import { getDueReview, submitChallengeAnswer } from '@/services/practice/practiceApi'
import { ReviewSession } from '@/components/practice/ReviewSession'
import type { GridSpec, ReviewCard } from '@/types/practice'

const mockedDue = vi.mocked(getDueReview)
const mockedAnswer = vi.mocked(submitChallengeAnswer)

const GRID: GridSpec = {
  xMin: 0,
  xMax: 10,
  yMin: 0,
  yMax: 8,
  step: 1,
  axes: true,
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
  limits: { points: 26, segments: 30, polygons: 6 },
}

const SOLUTION = {
  points: [
    { label: "A'", x: 8, y: 0 },
    { label: "B'", x: 8, y: 3 },
    { label: "C'", x: 6, y: 0 },
  ],
  segments: [],
  polygons: [["A'", "B'", "C'"]],
}

function card(overrides: Partial<ReviewCard> = {}): ReviewCard {
  return {
    challengeId: 'grid-q3',
    lessonId: 'grid-lesson',
    subjectId: 'math',
    topicId: 'geometrie',
    prompt: "Drehe das Dreieck ABC um 90° um Z. Zeichne A'B'C'.",
    options: [],
    type: 'grid_drawing',
    grid: GRID,
    figure: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>',
    dueAt: '2026-11-28T09:00:00+00:00',
    lapses: 0,
    reps: 1,
    ...overrides,
  }
}

function renderSession() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
  return render(<ReviewSession />, { wrapper: Wrapper })
}

/** Lays the grid out at 1 px a viewbox unit (40 a step, 30 margin) and taps (x, y). */
function tap(x: number, y: number) {
  const surface = document.querySelector<HTMLElement>('[data-grid-surface]')!
  const svg = surface.querySelector('svg')!
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 460, height: 380, right: 460, bottom: 380, x: 0, y: 0, toJSON: () => ({}) })
  fireEvent.click(surface, { clientX: 30 + x * 40, clientY: 30 + (8 - y) * 40 })
}

async function drawTheImage() {
  const user = userEvent.setup()
  await screen.findByText(/Drehe das Dreieck/)
  // The grid is the answer's; the figure the backend drew of it is not shown as well.
  expect(document.querySelector('[data-exercise-figure]')).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Polygon' }))
  tap(8, 0)
  tap(8, 3)
  tap(6, 0)
  tap(8, 0)
  await user.click(screen.getByRole('button', { name: 'Check answer' }))
  return user
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('a drawing on a grid in the review', () => {
  it('sends the drawing and, once it is right, shows a right drawing beside it', async () => {
    mockedDue.mockResolvedValue({ items: [card()], dueCount: 1, generatedAt: '2026-11-28T09:00:00+00:00' })
    mockedAnswer.mockResolvedValue({ challengeId: 'grid-q3', correct: true, feedback: 'Richtig.', attemptsRemaining: 0, standardDrawing: SOLUTION })
    renderSession()
    await drawTheImage()

    expect(mockedAnswer).toHaveBeenCalledWith('grid-q3', { answer: SOLUTION })
    const standard = await screen.findByText('A right drawing')
    const block = standard.closest<HTMLElement>('[data-review-standard-drawing]')!
    expect(within(block).getByRole('img', { name: /^A right drawing: A'\(8\|0\), B'\(8\|3\), C'\(6\|0\), Polygon A'B'C'$/ })).toBeInTheDocument()
    expect(within(block).getByText('Other drawings can be right too.')).toBeInTheDocument()
    // The student's own drawing stays in the grid, locked.
    expect(screen.getByRole('application')).toHaveAttribute('data-grid-verdict', 'right')
    expect(screen.getByRole('button', { name: 'Point' })).toBeDisabled()
  })

  it('holds the right drawing back from a wrong answer, and Try again starts a fresh drawing', async () => {
    mockedDue.mockResolvedValue({ items: [card()], dueCount: 1, generatedAt: '2026-11-28T09:00:00+00:00' })
    mockedAnswer.mockResolvedValue({ challengeId: 'grid-q3', correct: false, feedback: 'Noch nicht.', attemptsRemaining: 2, standardDrawing: SOLUTION })
    renderSession()
    const user = await drawTheImage()

    await screen.findByText('Noch nicht.')
    expect(document.querySelector('[data-review-standard-drawing]')).toBeNull()
    expect(screen.getByRole('application')).toHaveAttribute('data-grid-verdict', 'wrong')
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(screen.getByText('Nothing drawn yet.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeDisabled()
  })

  it('sends a card that came without its grid back to its lesson', async () => {
    mockedDue.mockResolvedValue({ items: [card({ grid: null })], dueCount: 1, generatedAt: '2026-11-28T09:00:00+00:00' })
    renderSession()
    await screen.findByText(/Drehe das Dreieck/)
    expect(screen.getByText('This question cannot be answered here. Open it in its lesson.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Check answer' })).toBeNull()
  })
})
