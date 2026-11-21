/**
 * The assistant's answer in the teacher's view (#545). The help request's
 * detail showed it as written -- `1. **Schritt 1: …**`, `$$\frac{18 \div 6}…$$`
 * -- where the student saw it drawn in Ask. It is now drawn the same way.
 *
 * The preparation table above the conversation does not carry that answer:
 * since #704 it holds the student's questions, uploads and related stars
 * (teacherPrepSummary704.test.tsx).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { HelpRequestDetailCard } from '@/components/teacher/HelpRequestDetailCard'
import type { TeacherHelpRequestDetail } from '@/types/teacher'

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
