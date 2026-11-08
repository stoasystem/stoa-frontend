/**
 * Murmi's poses where the product owner put them (#592):
 *
 *   - on the map Murmi points at the star the bubble stands beside, turned
 *     round when the bubble is to the star's right;
 *   - only the big moments move; nothing small (the inline figure beside a
 *     loading line) ever does, and every inline loading line has Murmi reading.
 *
 * The moods at each page's own moment are pinned beside that page's tests
 * (chapterStage, starQuiz486, starQuizNext578, firstLanding, pageStates).
 */
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { act, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MurmiBubble, murmiFacing } from '@/features/starmap/components/MurmiBubble'
import type { StarOnScreen } from '@/features/starmap/engine/starMapEngine'
import { fakeClock } from './starmapHarness'

const SRC = path.resolve(__dirname, '../../src')

describe('which way Murmi points (#592)', () => {
  it('points right while the star is right of it, and turns round when the star is left of it', () => {
    // Below the star, centred under it: the star is up and to the right of Murmi at the bubble's left end.
    expect(murmiFacing(500, 500 - 160)).toBe('right')
    // Left of the star: the star is past the bubble's right end.
    expect(murmiFacing(500, 500 - 40 - 320)).toBe('right')
    // Right of the star: the star is behind Murmi.
    expect(murmiFacing(500, 500 + 40)).toBe('left')
  })
})

describe('the map bubble', () => {
  // jsdom lays nothing out: the bubble is 320 x 100, the layer 1024 x 700.
  const sized = (name: 'offsetWidth' | 'offsetHeight', value: number) =>
    Object.defineProperty(HTMLElement.prototype, name, {
      configurable: true,
      get(this: HTMLElement) {
        return this.tagName === 'ASIDE' ? value : 0
      },
    })
  const original = {
    offsetWidth: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth'),
    offsetHeight: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight'),
  }
  beforeEach(() => {
    sized('offsetWidth', 320)
    sized('offsetHeight', 100)
  })
  afterEach(() => {
    for (const name of ['offsetWidth', 'offsetHeight'] as const) {
      const descriptor = original[name]
      if (descriptor) Object.defineProperty(HTMLElement.prototype, name, descriptor)
    }
  })

  /** The bubble beside a star at (500, 350), kept off `keepClear`; its Murmi and the side it took. */
  function bubbleBeside(keepClear: StarOnScreen['keepClear']) {
    const clock = fakeClock()
    render(
      <MemoryRouter>
        <MurmiBubble
          unitId="u-1"
          marker="data-test-bubble"
          title="Here"
          ways={() => null}
          locate={() => ({ x: 500, y: 350, size: 20, keepClear })}
          onDismiss={() => {}}
          scheduler={clock}
        />
      </MemoryRouter>,
    )
    const layer = document.querySelector<HTMLElement>('[data-test-bubble]')!
    Object.defineProperty(layer, 'clientWidth', { value: 1024 })
    Object.defineProperty(layer, 'clientHeight', { value: 700 })
    act(() => clock.advance(500))
    const aside = layer.querySelector<HTMLElement>('aside')!
    return { side: aside.dataset.side, murmi: aside.querySelector('[data-murmi]')! }
  }

  it('has Murmi pointing, and moving: one of the big moments', () => {
    const { murmi } = bubbleBeside([])
    expect(murmi).toHaveAttribute('data-murmi', 'pointing')
    expect(murmi).toHaveAttribute('data-murmi-animated')
    expect(murmi).toHaveAttribute('aria-hidden', 'true')
  })

  it('faces the star from its right: Murmi turns round', () => {
    // Names above and below the star, and none to its right.
    const { side, murmi } = bubbleBeside([{ x0: 480, y0: 0, x1: 520, y1: 700 }])
    expect(side).toBe('right')
    expect(murmi).toHaveAttribute('data-murmi-facing', 'left')
  })

  it('faces the star from its left: Murmi points as drawn', () => {
    // Names above, below and to the right of the star: only its left is clear.
    const { side, murmi } = bubbleBeside([{ x0: 480, y0: 0, x1: 900, y1: 700 }])
    expect(side).toBe('left')
    expect(murmi).toHaveAttribute('data-murmi-facing', 'right')
  })

  it('faces the star from below it, where it stands under the star', () => {
    const { side, murmi } = bubbleBeside([])
    expect(side).toBe('below')
    expect(murmi).toHaveAttribute('data-murmi-facing', 'right')
  })
})

describe('only the big moments move', () => {
  const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name)
      // The design gallery shows every pose moving on purpose.
      if (entry.isDirectory()) return entry.name === 'dev' ? [] : files(full)
      return entry.name.endsWith('.tsx') ? [full] : []
    })
  const murmis = files(SRC).flatMap((file) =>
    (readFileSync(file, 'utf8').match(/<Murmi\b[^>]*\/>/g) ?? []).map((tag) => ({
      file: path.relative(SRC, file).replace(/\\/g, '/'),
      tag,
    })),
  )

  it('finds the figures it checks (a control for the scan)', () => {
    expect(murmis.length).toBeGreaterThan(10)
  })

  it('never moves the inline figure, and has it reading beside every loading line', () => {
    const inline = murmis.filter(({ tag }) => tag.includes('var(--murmi-inline)'))
    expect(inline.length).toBeGreaterThan(0)
    for (const { file, tag } of inline) {
      expect(tag, file).not.toMatch(/\banimated\b/)
      // An inline figure stands beside a loading line, or the empty lesson's one sentence.
      expect(tag, file).toMatch(/mood="(reading|curious)"/)
    }
  })

  it('moves only at the four big moments', () => {
    const moving = murmis.filter(({ tag }) => /\banimated\b/.test(tag)).map(({ file }) => file)
    expect([...new Set(moving)].sort()).toEqual([
      'features/chapter/ChapterView.tsx',
      'features/chapter/LessonStage.tsx',
      'features/starmap/components/MurmiBubble.tsx',
      'features/starmap/onboarding/FirstSubjectQuestion.tsx',
    ])
  })
})
