import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ConstellationPath } from '@/features/chapter/ConstellationPath'
import type { ChapterLesson } from '@/features/chapter/useChapter'

// A chapter is its lessons drawn as a constellation: the line behind the
// student is lit, the line ahead is not, and the end of the path is the
// knowledge point itself. The list it replaces was correct and read as a list
// — it never showed being partway along something.

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options && 'number' in options ? `${key}:${options.number}` : key,
    i18n: { resolvedLanguage: 'de', language: 'de' },
  }),
}))

function lesson(id: string, status: ChapterLesson['status'], order: number): ChapterLesson {
  return { id, title: `Lektion ${order}`, order, status, estimatedMinutes: 10, exerciseCount: 3 }
}

const LESSONS: ChapterLesson[] = [
  lesson('l1', 'completed', 1),
  lesson('l2', 'completed', 2),
  lesson('l3', 'available', 3),
  lesson('l4', 'available', 4),
  lesson('l5', 'review', 5),
  lesson('l6', 'locked', 6),
]

function draw(lessons = LESSONS, nextLessonId: string | null = 'l3') {
  return render(
    <MemoryRouter>
      <ConstellationPath unitId="u-1" lessons={lessons} nextLessonId={nextLessonId} />
    </MemoryRouter>,
  )
}

describe('the constellation a chapter is drawn as', () => {
  it('gives every lesson a node, in order', () => {
    const { container } = draw()

    const items = container.querySelectorAll('[data-constellation] > li')
    expect(items).toHaveLength(6)
    expect([...items].map((li) => li.getAttribute('data-lesson-status'))).toEqual([
      'completed',
      'completed',
      'available',
      'available',
      'review',
      'locked',
    ])
  })

  it('lights the line behind the student and leaves the line ahead dark', () => {
    // The whole point of the shape. A line lit the whole way, or not at all,
    // says nothing about where the student is.
    const { container } = draw()

    const lines = [...container.querySelectorAll('[data-constellation] span[aria-hidden="true"]')]
      .filter((node) => (node as HTMLElement).style.background)
      .map((node) => (node as HTMLElement).style.background)

    expect(lines[0]).toContain('--constellation-walked')
    expect(lines[1]).toContain('--constellation-walked')
    expect(lines[2]).toContain('--constellation-ahead')
  })

  it('draws no line after the last lesson', () => {
    const { container } = draw([lesson('only', 'available', 1)], 'only')

    const lines = [...container.querySelectorAll('span[aria-hidden="true"]')].filter(
      (node) => (node as HTMLElement).style.background,
    )
    expect(lines).toHaveLength(0)
  })

  it('rings the lesson in progress, and only that one', () => {
    const { container } = draw()

    expect(container.querySelectorAll('[data-constellation-pulse]')).toHaveLength(1)
  })

  it('tells a locked lesson apart without colour alone', () => {
    // Shape as well as hue: a reader who cannot separate the colours still
    // sees a padlock rather than a number.
    const { container } = draw()

    const locked = container.querySelector('[data-lesson-status="locked"]')!
    expect(within(locked as HTMLElement).queryByRole('link')).toBeNull()
    expect(locked.querySelector('svg')).not.toBeNull()
  })

  it('does not let a locked lesson be opened', () => {
    const { container } = draw()

    const links = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href'))
    expect(links).not.toContain('/chapter/u-1/l6')
    expect(links).toContain('/chapter/u-1/l3')
  })

  it('marks the lesson to go on with as the current step', () => {
    const { container } = draw()

    const current = container.querySelector('[aria-current="step"]')
    expect(current?.getAttribute('href')).toBe('/chapter/u-1/l3')
  })

  it('offers testing out of an open lesson, never of a locked or finished one', () => {
    const { container } = draw()

    const testOuts = [...container.querySelectorAll('[data-test-out]')].map((a) => a.getAttribute('href'))
    expect(testOuts).toEqual([
      '/chapter/u-1/l3?mode=quiz',
      '/chapter/u-1/l4?mode=quiz',
      '/chapter/u-1/l5?mode=quiz',
    ])
  })

  it('keeps each lesson’s number available to a screen reader', () => {
    draw()

    for (const number of [1, 6]) {
      expect(screen.getByText(`chapter.lessonNumber:${number}`, { exact: false })).toBeInTheDocument()
    }
  })

  it('draws a ring on the nodes that are not filled in', () => {
    // `border-[var(--token)]` compiles to a border colour, not a width: both
    // outlined states shipped to production with no ring, and the screenshot
    // read as a bare number floating next to the line.
    const { container } = draw()

    const width = (state: string) =>
      (container.querySelector(`[data-node-state="${state}"]`) as HTMLElement).style.borderWidth

    for (const state of ['ready', 'review', 'locked']) {
      expect(width(state), `${state} has no ring`).toBe('var(--constellation-ring)')
    }
    expect(width('done')).toBe('')
    expect(width('doing')).toBe('')
  })

  it('measures nothing itself: every size comes from a token', () => {
    const { container } = draw()

    const inline = [...container.querySelectorAll('[style]')].map((node) => node.getAttribute('style') ?? '')
    const sized = inline.filter((style) => /width|height|gap|margin/.test(style))
    expect(sized.length).toBeGreaterThan(0)
    for (const style of sized) {
      expect(style, `a measurement that is not a token: ${style}`).not.toMatch(/:\s*\d+(\.\d+)?(px|rem)/)
    }
  })
})
