/**
 * The practice stage in a narrow column, and its options' names (#735).
 *
 * In the full-bank run (stoa-backend#106, 11-21), at 1024 with Ask open the
 * question broke one word to a line and at its operators ("470 + / 250 = ?"),
 * long words ran under Ask and figures were squeezed to about 160 px. The
 * cause was the 360 px "You are here" took at the left of the stage, which
 * left the question 196 px. Now the stage measures itself (a container
 * query): where it is narrower than the card and a 400 px question, the card
 * goes. The question is sized by its column, so a short sum fits on its line
 * again, a long word wraps inside it, and the question's figure keeps a
 * readable width.
 *
 * jsdom applies no container queries, so the rules are pinned in
 * `chapter.css` as written, and what the stage hands them in the DOM; the
 * browser was checked in the design preview at 1024 with Ask open and at 375.
 *
 * The radios the run reported nameless (kb-e-j120-q4, kb-m-253-q4,
 * kb-m-h127-q4, kb-m-h015-q1) were named all along: Chromium names each by
 * its label. The run's page tree showed a radio's `value`, and left it out
 * where the option is long (about 50 characters and more: exactly the ones
 * reported). Each radio now points at its option text all the same, so the
 * name is the option as shown, whatever reads it.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { AnswerInput } from '@/features/chapter/answerControls'

describe('the stage in a narrow column (chapter.css)', () => {
  const css = readFileSync(path.resolve(__dirname, '../../src/features/chapter/chapter.css'), 'utf8')
  const rule = (selector: string) => {
    const at = css.indexOf(`${selector} {`)
    expect(at, selector).toBeGreaterThanOrEqual(0)
    return css.slice(at, css.indexOf('}', at))
  }

  it('lets "You are here" go where the stage is too narrow for it and the question', () => {
    expect(rule('[data-stage-scroll]')).toContain('container: stage / inline-size')
    const narrow = css.slice(css.indexOf('@container stage (max-width: 819px)'))
    expect(narrow).toMatch(/^@container stage \(max-width: 819px\) \{\s*\[data-stage-you-are-here\] \{\s*display: none;/)
    expect(narrow).toMatch(/\[data-stage-center='side'\] \{\s*padding-left: 48px;/)
  })

  it('sizes the question by its column, long or short', () => {
    expect(rule("[data-stage-prompt='short']")).toContain('font-size: clamp(32px, calc(8px + 6cqi), 44px)')
    expect(rule("[data-stage-prompt='long']")).toContain('font-size: clamp(17px, calc(8px + 2.4cqi), 22px)')
    expect(rule('[data-stage-prompt]')).toContain('overflow-wrap: break-word')
  })

  it('keeps the question’s figure at a readable width', () => {
    expect(rule("[data-exercise-figure='question'] > svg")).toContain('min-width: min(280px, var(--figure-width, 280px))')
    expect(rule("[data-exercise-figure='question']")).toContain('overflow-x: auto')
  })
})

describe('each option names its radio', () => {
  function options(options: string[], optionFigures?: string[]) {
    render(
      <I18nextProvider i18n={i18n}>
        <AnswerInput
          challenge={{ challengeId: 'c', type: 'multiple_choice', options, optionFigures }}
          value=""
          onChange={() => {}}
          disabled={false}
        />
      </I18nextProvider>,
    )
  }

  it('by the option as shown, however long', () => {
    // kb-m-253-q4, as the bank has it.
    const long = [
      'Ein Umfangswinkel ist gleich gross wie der zugehörige Zentriwinkel',
      'Alle Umfangswinkel über derselben Sehne sind gleich gross',
      'Umfangswinkel über demselben Bogen oder über gleichen Bögen sind gleich gross',
    ]
    options(long)
    const radios = screen.getAllByRole('radio')
    expect(radios.map((radio) => radio.getAttribute('aria-labelledby'))).toEqual(
      radios.map((_, index) => expect.stringMatching(new RegExp(`-${index}$`))),
    )
    for (const option of long) expect(screen.getByRole('radio', { name: option })).toBeInTheDocument()
  })

  it('by its letter where the option is only a drawing', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>'
    options(['A', ''], [svg, svg])
    expect(screen.getByRole('radio', { name: 'A' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'B' })).toBeInTheDocument()
  })
})
