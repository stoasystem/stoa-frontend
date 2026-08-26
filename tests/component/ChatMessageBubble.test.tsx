/**
 * Renders the real ChatMessageBubble to verify how AI output is presented:
 * math rendering, the streaming placeholder, and the blinking cursor.
 */
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble'
import type { ChatMessage } from '@/types/chat'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

function message(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'm1',
    role: 'assistant',
    content: 'Here is the answer.',
    status: 'completed',
    createdAt: '2026-01-01T10:00:00Z',
    ...overrides,
  } as ChatMessage
}

describe('assistant message content', () => {
  it('renders the answer text', () => {
    render(<ChatMessageBubble message={message()} />)
    expect(screen.getByText('Here is the answer.')).toBeInTheDocument()
  })

  it('renders LaTeX in AI output through KaTeX', async () => {
    // KaTeX loads the first time a formula appears.
    const { container } = render(
      <ChatMessageBubble message={message({ content: 'so $x^2$ follows' })} />,
    )
    await waitFor(() => expect(container.querySelector('.katex')).not.toBeNull())
  })

  it('renders student messages as plain text without math processing', () => {
    const { container } = render(
      <ChatMessageBubble message={message({ role: 'student', content: 'costs $5 and $6' })} />,
    )
    expect(container.querySelector('.katex')).toBeNull()
    expect(container.textContent).toContain('costs $5 and $6')
  })
})

describe('streaming state', () => {
  it('shows a thinking placeholder before the first token arrives', () => {
    render(<ChatMessageBubble message={message({ content: '', status: 'streaming' })} />)
    expect(screen.getByText('Thinking…')).toBeInTheDocument()
  })

  it('replaces the placeholder once content starts arriving', () => {
    render(<ChatMessageBubble message={message({ content: 'Partial', status: 'streaming' })} />)
    expect(screen.queryByText('Thinking…')).toBeNull()
    expect(screen.getByText('Partial')).toBeInTheDocument()
  })

  it('shows the cursor while streaming', () => {
    const { container } = render(
      <ChatMessageBubble message={message({ content: 'Partial', status: 'streaming' })} />,
    )
    expect(container.querySelector('[class*="animate-[blink"]')).not.toBeNull()
  })

  it('removes the cursor once the message completes', () => {
    const { container } = render(
      <ChatMessageBubble message={message({ content: 'Done', status: 'completed' })} />,
    )
    expect(container.querySelector('[class*="animate-[blink"]')).toBeNull()
  })

  it('hides the cursor on an empty completed message', () => {
    const { container } = render(<ChatMessageBubble message={message({ content: '' })} />)
    expect(container.querySelector('[class*="animate-[blink"]')).toBeNull()
    expect(screen.queryByText('Thinking…')).toBeNull()
  })
})

describe('system messages', () => {
  it('renders centred without a role label', () => {
    render(<ChatMessageBubble message={message({ role: 'system', content: 'Session ended' })} />)
    expect(screen.getByText('Session ended')).toBeInTheDocument()
    expect(screen.queryByText('STOA Learning Assistant')).toBeNull()
  })
})
