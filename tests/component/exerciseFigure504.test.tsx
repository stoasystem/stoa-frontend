/**
 * #504: an exercise's figure (stoa-backend#127). The backend allowlists every
 * figure when it is authored; the page cleans it again with the same list
 * before drawing it, and draws nodes, not text parsed again. These pin what
 * comes through, what does not, and how the figure is named and sized.
 */
import { createRequire } from 'node:module'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import { afterEach, describe, expect, it } from 'vitest'
import { AnswerInput, type AnswerValue } from '@/features/chapter/answerControls'
import { ExerciseFigure } from '@/features/chapter/ExerciseFigure'
import { cleanFigure } from '@/features/chapter/figure'
import i18n from '@/i18n'

const SVG = 'http://www.w3.org/2000/svg'

/** A figure as the knowledge base has them: a cone beside a cylinder, labelled, with an arrow marker. */
const CONE = `<svg xmlns="${SVG}" viewBox="0 0 240 120" width="240" height="120">
  <defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="currentColor"/></marker></defs>
  <polygon points="20,100 60,20 100,100" fill="#bbbbbb" stroke="#000000" stroke-width="2"/>
  <rect x="140" y="20" width="60" height="80" fill="none" stroke="currentColor"/>
  <line x1="10" y1="110" x2="230" y2="110" stroke="currentColor" marker-end="url(#arrow)"/>
  <text x="60" y="115" text-anchor="middle" font-size="12">Kegel</text>
  <text x="170" y="115" text-anchor="middle" font-size="12">Zylinder</text>
</svg>`

const TITLED = `<svg xmlns="${SVG}" viewBox="0 0 100 50"><title>A right triangle</title><polygon points="0,50 100,50 0,0"/></svg>`

const box = (n: number) => `<svg xmlns="${SVG}" viewBox="0 0 80 80"><rect x="10" y="10" width="${n}" height="${n}" fill="currentColor"/></svg>`

/** Everything a figure must not carry, the way an attacker would write it. */
const HOSTILE = `<svg xmlns="${SVG}" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" onload="window.__figure504('svg onload')">
  <script>window.__figure504('script')</script>
  <style>rect { fill: url(https://evil.example/paint.svg#p) }</style>
  <rect x="0" y="0" width="10" height="10" onclick="window.__figure504('onclick')" style="fill: red" fill="url(https://evil.example/paint.svg#p)"/>
  <circle cx="5" cy="5" r="5" onmouseover="window.__figure504('onmouseover')" stroke="url(#nowhere)"/>
  <image href="https://evil.example/tracker.png" width="10" height="10" onerror="window.__figure504('image onerror')"/>
  <image xlink:href="https://evil.example/tracker2.png" width="10" height="10"/>
  <use href="https://evil.example/sprite.svg#x"/>
  <a href="javascript:window.__figure504('link')"><text x="1" y="9">click</text></a>
  <foreignObject width="10" height="10"><img src="x" onerror="window.__figure504('img onerror')"/></foreignObject>
  <animate attributeName="href" to="javascript:window.__figure504('animate')"/>
  <set attributeName="onmouseover" to="window.__figure504('set')"/>
  <path d="M0,0 L10,10" fill="javascript:window.__figure504('fill')"/>
</svg>`

afterEach(cleanup)

type ScriptedWindow = Window & typeof globalThis & { __figure504?: (what: string) => void }
const { JSDOM } = createRequire(import.meta.url)('jsdom') as {
  JSDOM: new (html: string, options: { runScripts: 'dangerously' }) => { window: ScriptedWindow }
}

/**
 * The test page runs no script and no inline handler, so nothing run there
 * proves nothing. This page runs both, as a browser would; what a figure
 * carries is copied into it and given every event a handler could wait for.
 * The control: the hostile figure as written does run there.
 */
function runIn(nodes: (document: Document) => Node[]): string[] {
  const { window } = new JSDOM('<!doctype html><body></body>', { runScripts: 'dangerously' })
  const ran: string[] = []
  window.__figure504 = (what) => ran.push(what)
  window.document.body.append(...nodes(window.document))
  for (const node of window.document.body.querySelectorAll('*')) {
    for (const type of ['load', 'error', 'click', 'mouseover', 'focus']) node.dispatchEvent(new window.Event(type, { bubbles: true }))
  }
  return ran
}

const asWritten = (svg: string) => (document: Document) => {
  const holder = document.createElement('div')
  holder.innerHTML = svg
  return [holder]
}
const copied = (node: Node) => (document: Document) => [document.importNode(node, true)]

it('runs the hostile figure as written, where scripts run (the control)', () => {
  expect(runIn(asWritten(HOSTILE))).toEqual(expect.arrayContaining(['svg onload', 'onclick', 'onmouseover', 'image onerror']))
})

describe('cleanFigure', () => {
  it('keeps a drawing as the backend allowed it, in the SVG namespace', () => {
    const figure = cleanFigure(CONE, 'p-')!
    expect(figure.svg.namespaceURI).toBe(SVG)
    expect(figure.svg.querySelectorAll('polygon, rect, line, text')).toHaveLength(5)
    expect([...figure.svg.querySelectorAll('text')].map((node) => node.textContent)).toEqual(['Kegel', 'Zylinder'])
    expect(figure.svg.querySelector('polygon')).toHaveAttribute('fill', '#bbbbbb')
    expect(figure.svg.querySelector('text')).toHaveAttribute('text-anchor', 'middle')
    expect(figure.named).toBe(false)
  })

  it('keeps its own markers apart from another figure’s', () => {
    const figure = cleanFigure(CONE, 'p-')!
    expect(figure.svg.querySelector('marker')).toHaveAttribute('id', 'p-arrow')
    expect(figure.svg.querySelector('line')).toHaveAttribute('marker-end', 'url(#p-arrow)')
  })

  it('scales by its viewBox, as wide as drawn and never wider than the column', () => {
    const { svg } = cleanFigure(CONE, 'p-')!
    expect(svg.style.width).toBe('100%')
    expect(svg.style.maxWidth).toBe('240px')
    expect(svg.style.height).toBe('auto')
    expect(svg.style.aspectRatio).toBe('240 / 120')
  })

  it('gives a figure drawn with a size only a viewBox to scale by', () => {
    const { svg } = cleanFigure(`<svg xmlns="${SVG}" width="300" height="150"><rect width="10" height="10"/></svg>`, 'p-')!
    expect(svg).toHaveAttribute('viewBox', '0 0 300 150')
    expect(svg.style.maxWidth).toBe('300px')
  })

  it('drops script, handlers, links, embedded documents, styles and outside references', () => {
    const figure = cleanFigure(HOSTILE, 'p-')!
    const all = [figure.svg, ...figure.svg.querySelectorAll('*')]
    expect(all.map((node) => node.localName).sort()).toEqual(['circle', 'path', 'rect', 'svg', 'text'])
    for (const node of all) {
      // The svg's own style is the page's sizing (below), not the figure's.
      const own = (name: string) => name === 'xmlns' || (node === figure.svg && name === 'style')
      for (const attribute of Array.from(node.attributes).filter((item) => !own(item.name))) {
        expect(attribute.name).not.toMatch(/^on|href|style/i)
        expect(attribute.value).not.toMatch(/javascript:|https?:|evil/i)
      }
    }
    expect(figure.svg.getAttribute('style')).not.toMatch(/red|url/)
    // A reference to anything but a marker of its own is not kept.
    expect(figure.svg.querySelector('rect')).not.toHaveAttribute('fill')
    expect(figure.svg.querySelector('path')).not.toHaveAttribute('fill')
    // The text of a dropped link stays, as text.
    expect(figure.svg.querySelector('text')?.textContent).toBe('click')
  })

  it('draws nothing from text that holds no svg', () => {
    expect(cleanFigure('', 'p-')).toBeNull()
    expect(cleanFigure('<script>window.__figure504("script")</script>', 'p-')).toBeNull()
    expect(cleanFigure('<img src="x" onerror="window.__figure504(1)">', 'p-')).toBeNull()
  })

  it('names a figure that names itself', () => {
    const titled = cleanFigure(TITLED, 'p-')!
    expect(titled.named).toBe(true)
    expect(titled.svg).toHaveAttribute('role', 'img')
    const labelled = cleanFigure(`<svg xmlns="${SVG}" viewBox="0 0 10 10" aria-label="Ein Würfel" role="presentation"><rect width="5" height="5"/></svg>`, 'p-')!
    expect(labelled.named).toBe(true)
    expect(labelled.svg).toHaveAttribute('role', 'img')
  })
})

describe('ExerciseFigure', () => {
  it('draws a hostile figure with nothing in it that runs', () => {
    render(<ExerciseFigure svg={HOSTILE} />)
    const paper = document.querySelector<HTMLElement>('[data-exercise-figure]')!
    const svg = paper.querySelector('svg')!
    expect(svg).toBeInTheDocument()
    expect(paper.querySelector('script, style, image, use, a, foreignObject, img, animate, set')).toBeNull()
    expect(runIn(copied(paper))).toEqual([])
  })

  it('names an unnamed figure by the question, as one image', () => {
    render(
      <>
        <h2 id="question">Welcher Körper ist ein Kegel?</h2>
        <ExerciseFigure svg={CONE} labelledBy="question" />
      </>,
    )
    const image = screen.getByRole('img', { name: 'Welcher Körper ist ein Kegel?' })
    expect(image).toHaveAttribute('data-exercise-figure')
    expect(image.querySelector('svg')).not.toHaveAttribute('role')
  })

  it('keeps the name a figure gives itself', () => {
    render(<ExerciseFigure svg={TITLED} labelledBy="question" />)
    const paper = document.querySelector('[data-exercise-figure]')!
    expect(paper).not.toHaveAttribute('role')
    expect(paper).not.toHaveAttribute('aria-labelledby')
    expect(paper.querySelector('svg')).toHaveAttribute('role', 'img')
    expect(paper.querySelector('svg > title')?.textContent).toBe('A right triangle')
  })

  it('leaves an unnamed figure with no label out of the reading', () => {
    render(<ExerciseFigure svg={box(20)} />)
    expect(document.querySelector('[data-exercise-figure]')).toHaveAttribute('aria-hidden', 'true')
  })

  it('is on white with dark ink, in the dark sky too', () => {
    render(<ExerciseFigure svg={CONE} />)
    const paper = document.querySelector('[data-exercise-figure]')!
    expect(paper.className).toMatch(/\bbg-white\b/)
    expect(paper.className).toContain('text-[#1D1D1F]')
  })

  it('keeps two figures’ markers apart on one page', () => {
    render(
      <>
        <ExerciseFigure svg={CONE} />
        <ExerciseFigure svg={CONE} />
      </>,
    )
    const ids = [...document.querySelectorAll('marker')].map((node) => node.id)
    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
    for (const line of document.querySelectorAll('line')) {
      const target = /url\(#(.+)\)/.exec(line.getAttribute('marker-end')!)![1]
      expect(line.closest('svg')!.querySelector(`marker[id="${target}"]`)).not.toBeNull()
    }
  })

  it('draws nothing when nothing is left of it', () => {
    render(<ExerciseFigure svg="<p>not a drawing</p>" />)
    expect(document.querySelector('[data-exercise-figure]')).toBeNull()
  })
})

function Choice({ options, optionFigures }: { options: string[]; optionFigures?: (string | null)[] }) {
  const [value, setValue] = useState<AnswerValue>('')
  return (
    <I18nextProvider i18n={i18n}>
      <AnswerInput
        challenge={{ challengeId: 'kb-m-p023-q1', type: 'multiple_choice', options, optionFigures }}
        value={value}
        onChange={setValue}
        disabled={false}
      />
      <output data-chosen>{String(value)}</output>
    </I18nextProvider>
  )
}

describe('options that are drawings', () => {
  it('shows each option its drawing, with its letter, and answers by the letter', async () => {
    render(<Choice options={['A', 'B', 'C']} optionFigures={[box(20), box(40), box(60)]} />)
    const radios = screen.getAllByRole('radio')
    expect(radios.map((radio) => radio.getAttribute('value'))).toEqual(['A', 'B', 'C'])
    const labels = radios.map((radio) => radio.closest('label')!)
    for (const [index, label] of labels.entries()) {
      expect(label.querySelectorAll('[data-exercise-figure] svg')).toHaveLength(1)
      expect(label.querySelector('rect')).toHaveAttribute('width', String(20 * (index + 1)))
      // The letter once, as the badge; the label is still read.
      const letters = within(label).getAllByText(['A', 'B', 'C'][index])
      expect(letters).toHaveLength(2)
      expect(letters[0]).toHaveAttribute('aria-hidden', 'true')
      expect(letters[1].closest('.sr-only')).not.toBeNull()
    }
    expect(screen.getByRole('radio', { name: 'B' })).toBeInTheDocument()
    // Side by side where they fit, one under another on a phone.
    expect(labels[0].parentElement!.className).toContain('grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))]')

    await userEvent.click(labels[1])
    expect(document.querySelector('[data-chosen]')).toHaveTextContent('B')
  })

  it('keeps the letter of a label shown out of order', () => {
    render(<Choice options={['C', 'A']} optionFigures={[box(20), box(40)]} />)
    const badges = screen.getAllByRole('radio').map((radio) => radio.closest('label')!.querySelector('[aria-hidden="true"]')!.textContent)
    expect(badges).toEqual(['C', 'A'])
  })

  it('shows only the text of an option with no drawing', () => {
    render(<Choice options={['A circle', 'A square']} optionFigures={['', box(40)]} />)
    const [first, second] = screen.getAllByRole('radio').map((radio) => radio.closest('label')!)
    expect(first.querySelector('[data-exercise-figure]')).toBeNull()
    expect(within(first).getByText('A circle').closest('.sr-only')).toBeNull()
    // Text longer than a letter is shown with the drawing.
    expect(within(second).getByText('A square').closest('.sr-only')).toBeNull()
    expect(second.querySelector('[data-exercise-figure]')).not.toBeNull()
  })

  it('lays out options without drawings as before', () => {
    render(<Choice options={['x = 3', 'x = 5']} />)
    expect(document.querySelector('[data-exercise-figure]')).toBeNull()
    const list = screen.getAllByRole('radio')[0].closest('label')!.parentElement!
    expect(list.className).toBe('flex flex-col gap-2')
  })

  it('draws a hostile option drawing with nothing in it that runs', () => {
    render(<Choice options={['A', 'B']} optionFigures={[HOSTILE, null]} />)
    const label = screen.getAllByRole('radio')[0].closest('label')!
    expect(label.querySelector('script, image, a, foreignObject')).toBeNull()
    expect(runIn(copied(label.querySelector('[data-exercise-figure]')!))).toEqual([])
  })
})
