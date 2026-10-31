/**
 * The assistant's answer in the teacher's view (#545). The help request's
 * detail showed it as written -- `1. **Schritt 1: …**`, `$$\frac{18 \div 6}…$$`
 * -- where the student saw it drawn in Ask. It is now drawn the same way.
 *
 * The preparation summary carries only the start of that answer, cut at 360
 * characters with its line breaks folded into spaces (stoa-backend#181), so
 * the cut can leave a formula or emphasis half open. What it leaves open is
 * taken out before the excerpt is drawn; whole pairs are drawn.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { HelpRequestDetailCard } from '@/components/teacher/HelpRequestDetailCard'
import { TeacherAssistanceSummaryCard } from '@/components/teacher/TeacherAssistanceSummaryCard'
import { settleTruncatedMarkdown } from '@/lib/truncatedMarkdown'
import type { TeacherAssistanceSummary, TeacherHelpRequestDetail } from '@/types/teacher'

/** As production served it for a closed request (stoa-backend#147's walkthrough). */
const ANSWER = [
  '1. **Schritt 1: Was bedeutet Kürzen?** Beim Kürzen teilst du Zähler und Nenner durch dieselbe Zahl.',
  '2. **Schritt 2:** Der grösste gemeinsame Teiler von $18$ und $24$ ist $6$:',
  '$$\\frac{18 \\div 6}{24 \\div 6} = \\frac{3}{4}$$',
].join('\n')

function request(content: string): TeacherHelpRequestDetail {
  return {
    requestId: 'r-1',
    conversationId: 'c-1',
    status: 'resolved',
    subject: 'math',
    firstTeacherActionAt: null,
    requestMessage: 'Ich verstehe das Kürzen nicht.',
    student: { id: 's-1', name: 'Test Student', grade: '6' },
    messages: [
      { id: 'm-1', conversationId: 'c-1', role: 'student', content: 'Wie kürze ich 18/24?', createdAt: '2026-10-31T09:00:00Z' },
      { id: 'm-2', conversationId: 'c-1', role: 'assistant', content, createdAt: '2026-10-31T09:00:05Z' },
    ],
    notes: [],
    sla: { status: 'met', targetMinutes: 30, requestToFirstActionMinutes: 5 },
  } as unknown as TeacherHelpRequestDetail
}

function summary(aiAnswerSummary: string, questionSummary = 'Wie kürze ich 18/24? — **dringend**'): TeacherAssistanceSummary {
  return {
    summaryId: 'sum-1',
    questionId: 'r-1',
    studentId: 's-1',
    subject: 'math',
    studentContextSummary: 'Klasse 6',
    questionSummary,
    aiAnswerSummary,
    suggestedFocus: 'Kürzen',
    weakTopics: [],
    sourceCount: 2,
    createdAt: '2026-10-31T09:01:00Z',
  } as TeacherAssistanceSummary
}

function wrap(node: React.ReactNode) {
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>{node}</MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

/** What is drawn, without the TeX source KaTeX keeps for screen readers in its MathML. */
function shownText(element: HTMLElement) {
  const copy = element.cloneNode(true) as HTMLElement
  copy.querySelectorAll('.katex-mathml').forEach((node) => node.remove())
  return copy.textContent ?? ''
}

/** The answer block of the summary card. */
function answerBlock() {
  return screen.getByText('Antwort des Lernassistenten').parentElement as HTMLElement
}

beforeAll(async () => {
  await import('@/components/ui/katexLoader')
})

beforeEach(async () => {
  await i18n.changeLanguage('de')
})

describe('the assistant’s answer in the help request', () => {
  it('is drawn as Ask draws it: bold, formulas inline and on their own line, numbered lines kept', async () => {
    wrap(<HelpRequestDetailCard request={request(ANSWER)} />)
    const answer = document.querySelector('[data-assistant-answer]') as HTMLElement
    await waitFor(() => expect(answer.querySelector('.math-block .katex')).not.toBeNull())
    expect(within(answer).getByText('Schritt 1: Was bedeutet Kürzen?').tagName).toBe('STRONG')
    expect(within(answer).getByText('Schritt 2:').tagName).toBe('STRONG')
    expect(answer.querySelectorAll('.math-inline .katex')).toHaveLength(3)
    expect(shownText(answer)).not.toMatch(/\*\*|\$|\\frac/)
    // Line breaks kept: the numbered steps stay on lines of their own.
    expect(answer.className).toContain('whitespace-pre-wrap')
    expect(answer.textContent).toContain('1. ')
  })

  it('leaves the student’s message as written', () => {
    wrap(<HelpRequestDetailCard request={request(ANSWER)} />)
    expect(screen.getByText('Wie kürze ich 18/24?')).toBeInTheDocument()
  })
})

describe('the start of the answer in the preparation summary', () => {
  it('draws whole emphasis and formulas', async () => {
    wrap(<TeacherAssistanceSummaryCard summary={summary(ANSWER.replace(/\n/g, ' '))} isLoading={false} isError={false} />)
    const block = answerBlock()
    await waitFor(() => expect(block.querySelector('.katex')).not.toBeNull())
    expect(within(block).getByText('Schritt 1: Was bedeutet Kürzen?').tagName).toBe('STRONG')
    expect(shownText(block)).not.toMatch(/\*\*|\$|\\frac/)
  })

  it.each([
    ['inside bold', '1. **Schritt 1: Was bedeutet Kürzen?** Beim Kürzen teilst du. 2. **Schritt 2: Der grösste gem', 'Schritt 2: Der grösste gem'],
    ['inside an inline formula', 'Teile Zähler und Nenner durch $\\frac{18}{', 'Teile Zähler und Nenner durch…'],
    ['inside a block formula', 'Dann gilt: $$\\frac{18 \\div 6}{24', 'Dann gilt:…'],
    ['inside italic', 'Beim Kürzen bleibt der Wert gleich. *Hinweis: Teile immer durch', 'Hinweis: Teile immer durch'],
  ])('shows no half mark when the cut falls %s', (_, excerpt, shown) => {
    wrap(<TeacherAssistanceSummaryCard summary={summary(excerpt)} isLoading={false} isError={false} />)
    const block = answerBlock()
    expect(block.textContent).toContain(shown)
    expect(block.textContent).not.toMatch(/\*|\$|\\frac/)
  })

  it('shows the student’s question as written, marks and all', () => {
    wrap(<TeacherAssistanceSummaryCard summary={summary('Kürzen heisst teilen.')} isLoading={false} isError={false} />)
    expect(screen.getByText('Wie kürze ich 18/24? — **dringend**')).toBeInTheDocument()
  })

  it('still says there is no answer when there is none', () => {
    wrap(<TeacherAssistanceSummaryCard summary={summary('')} isLoading={false} isError={false} />)
    expect(within(answerBlock()).getByText('Keine Antwort des Lernassistenten verfügbar.')).toBeInTheDocument()
  })
})

describe('settleTruncatedMarkdown', () => {
  it.each([
    ['whole pairs and formulas stay', '**a** and $x^2$ and *b*', '**a** and $x^2$ and *b*'],
    ['an open bold pair loses its mark', '**a** then **b c', '**a** then b c'],
    ['an open single star loses its mark', '*a* then *b c', '*a* then b c'],
    ['a product keeps its star', 'so 2 * 3 = 6', 'so 2 * 3 = 6'],
    ['an open inline formula is dropped', 'teile durch $\\frac{18', 'teile durch…'],
    ['an open block formula is dropped', 'also $$\\frac{18}{24', 'also…'],
    ['a formula after a whole one is dropped alone', '$a$ und $b + ', '$a$ und…'],
    ['a price stays', 'Das Heft kostet $5 und der Stift $2.', 'Das Heft kostet $5 und der Stift $2.'],
    ['heading marks go', '### Schritt 1 Kürzen ## Schritt 2', 'Schritt 1 Kürzen Schritt 2'],
    ['nothing stays nothing', '', ''],
  ])('%s', (_, excerpt, settled) => {
    expect(settleTruncatedMarkdown(excerpt)).toBe(settled)
  })
})
