/**
 * The exercise bank's line breaks reach the student (#732, with #728).
 *
 * A question's equations come one to a line and its working one step to a
 * line, separated by `\n`. The stage drew the question in an `<h2>` and the
 * working in a `<p>` with nothing that kept them, so the browser ran them
 * together: ZAP 2023-4 read as one paragraph with its four equations folding
 * in the middle, and the working of 2016-2 as "177.65 : 19 = 9.35. 31 ...",
 * which reads as one number. Both are `BankText` now, in the lesson, its
 * quizzes and the review alike; the stage and the review are pinned to it in
 * `lessonQuiz.test.tsx` and `ReviewSession.test.tsx`.
 *
 * jsdom draws nothing, so what is pinned is what the browser is given: the
 * line breaks still in the text, `pre-line` round it, a formula typeset and
 * held whole.
 */
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { BankText, FeedbackCard } from '@/features/chapter/answerControls'

// ZAP 2023-4, as the bank has it in German.
const EQUATIONS =
  'Entscheide, ohne die Rechnungen auszuführen, ob die Gleichungen richtig sind.\n' +
  '(1) $80 \\cdot 347.2 = 100 \\cdot 347.2 - 20 \\cdot 347.2$\n' +
  '(2) $6524.38 - 136.4 + 63.6 = 6524.38 - 200$\n' +
  '(3) $57.35 \\cdot 4.8 = 4.8 \\cdot 57.35$\n' +
  '(4) $932.4 : 45 \\cdot 3 = 932.4 : 15$\n' +
  'Wie viele der vier Gleichungen sind richtig?'

// The working of ZAP 2016-2, one step to a line.
const WORKING = '177.65 : 19 = 9.35.\n31 · 9.35 = 289.85.\n289.85 − 177.65 = 112.20'

/** The text between the formulas, as the browser is handed it. */
function textRuns(element: Element) {
  // MathRenderer's own span is the one child of the kept-lines one.
  return [...element.querySelector('[data-bank-text] > span')!.childNodes]
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent)
}

function keepsLines(element: Element) {
  const text = element.querySelector('[data-bank-text]')!
  expect(text).toHaveClass('whitespace-pre-line')
}

describe('a question with its own lines', () => {
  it('keeps each equation on its line and typesets every one', async () => {
    const { container } = render(
      <h2>
        <BankText>{EQUATIONS}</BankText>
      </h2>,
    )
    // Four formulas, typeset.
    await screen.findAllByText((_, node) => node?.classList.contains('katex-html') ?? false)
    expect(container.querySelectorAll('.math-inline .katex')).toHaveLength(4)
    expect(container.querySelector('.math-error')).toBeNull()

    keepsLines(container)
    expect(textRuns(container)).toEqual([
      'Entscheide, ohne die Rechnungen auszuführen, ob die Gleichungen richtig sind.\n(1) ',
      '\n(2) ',
      '\n(3) ',
      '\n(4) ',
      '\nWie viele der vier Gleichungen sind richtig?',
    ])
  })

  it('does not break a formula in the middle; one too wide scrolls in its column', () => {
    const { container } = render(<BankText>{EQUATIONS}</BankText>)
    const text = container.querySelector('[data-bank-text]')!
    // KaTeX breaks inline maths after = and the operators; this holds it whole.
    expect(text).toHaveClass('[&_.katex]:whitespace-nowrap')
    expect(text).toHaveClass('overflow-x-auto')
  })

  it('leaves a display formula a block of its own, with no empty line round it', async () => {
    const { container } = render(<BankText>{'Löse:\n$$x^2 = 9$$\nZwei Lösungen.'}</BankText>)
    await screen.findAllByText((_, node) => node?.classList.contains('katex-display') ?? false)
    expect(textRuns(container)).toEqual(['Löse:', 'Zwei Lösungen.'])
  })
})

describe('the working and the feedback with their own lines', () => {
  function card(props: Parameters<typeof FeedbackCard>[0]) {
    return render(
      <I18nextProvider i18n={i18n}>
        <FeedbackCard {...props} />
      </I18nextProvider>,
    )
  }

  it('keeps the working one step to a line once the answer is right', () => {
    const { container } = card({ correct: true, explanation: WORKING })
    keepsLines(container)
    expect(textRuns(container)).toEqual([WORKING])
  })

  it('keeps the lines of the feedback on a wrong answer, with its formula typeset', async () => {
    const feedback = 'Rechne zuerst den Preis pro Stück.\nDann $31 \\cdot x$.'
    const { container } = card({ correct: false, feedback })
    await screen.findAllByText((_, node) => node?.classList.contains('katex-html') ?? false)
    keepsLines(container)
    expect(textRuns(container)).toEqual(['Rechne zuerst den Preis pro Stück.\nDann ', '.'])
  })
})
