/**
 * What a student or a teacher wrote shows its formulas as maths, and the rest
 * as typed (#183). The demo thread showed "Warum ist $\sin 30^\circ$ genau
 * 0,5?" letter for letter in the student's own bubble, while the assistant's
 * answers beside it were typeset; a question asked from an exercise carries
 * the exercise's $...$.
 */
import { render, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'
import { AskMessage } from '@/features/ask/AskMessage'
import i18n from '@/i18n'
import type { ChatMessage } from '@/types/chat'

const message = (overrides: Partial<ChatMessage>): ChatMessage => ({
  id: 'm-1',
  conversationId: 'c-1',
  role: 'student',
  content: '',
  createdAt: '2026-10-13T10:00:00Z',
  status: 'completed',
  ...overrides,
})

function show(value: ChatMessage) {
  return render(
    <I18nextProvider i18n={i18n}>
      <AskMessage message={value} />
    </I18nextProvider>,
  )
}

describe('a person’s message in Ask', () => {
  it('typesets the student’s formulas and keeps "2*3*4" a product', async () => {
    const { container } = show(message({ content: 'Warum ist $\\sin 30^\\circ$ genau 0,5? Und 2*3*4?' }))
    const bubble = container.querySelector('[data-message-role="student"]')!

    await waitFor(() => expect(bubble.querySelector('.katex')).not.toBeNull())
    expect(bubble.textContent).not.toContain('$')
    expect(bubble.querySelector('em, strong')).toBeNull()
    expect(bubble.textContent).toContain('2*3*4')
  })

  it('typesets a quoted passage from an exercise', async () => {
    const { container } = show(message({
      content: 'Was heisst das?',
      quote: { text: 'Berechne $\\cos 60^\\circ$.', source: { kind: 'challenge', id: 'ch-1' } },
    }))
    const quote = container.querySelector('blockquote')!

    await waitFor(() => expect(quote.querySelector('.katex')).not.toBeNull())
    expect(quote.textContent).not.toContain('$')
  })

  it('typesets a teacher’s formulas too', async () => {
    const { container } = show(message({ role: 'teacher', content: 'Schau: $a^2 + b^2 = c^2$' }))
    const bubble = container.querySelector('[data-message-role="teacher"]')!

    await waitFor(() => expect(bubble.querySelector('.katex')).not.toBeNull())
    expect(bubble.textContent).not.toContain('$')
  })
})
