/**
 * Renders the real ChatMessageList to verify where follow-up prompts appear
 * and that selecting one reaches the caller.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ChatMessageList } from '@/components/chat/ChatMessageList'
import type { ChatMessage } from '@/types/chat'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}))

function msg(id: string, role: ChatMessage['role'], status = 'completed'): ChatMessage {
  return {
    id,
    role,
    content: `${role} ${id}`,
    status,
    createdAt: '2026-01-01T10:00:00Z',
  } as ChatMessage
}

const FOLLOW_UP = "I don't understand one of the steps"

describe('follow-up suggestions', () => {
  it('are offered after a completed assistant answer', () => {
    render(
      <ChatMessageList
        messages={[msg('a', 'student'), msg('b', 'assistant')]}
        onFollowUp={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: FOLLOW_UP })).toBeInTheDocument()
  })

  it('are hidden while the assistant is still streaming', () => {
    render(
      <ChatMessageList
        messages={[msg('a', 'student'), msg('b', 'assistant', 'streaming')]}
        onFollowUp={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button', { name: FOLLOW_UP })).toBeNull()
  })

  it('are hidden when the last answer failed', () => {
    render(
      <ChatMessageList messages={[msg('b', 'assistant', 'failed')]} onFollowUp={vi.fn()} />,
    )
    expect(screen.queryByRole('button', { name: FOLLOW_UP })).toBeNull()
  })

  it('are absent when no assistant has answered yet', () => {
    render(<ChatMessageList messages={[msg('a', 'student')]} onFollowUp={vi.fn()} />)
    expect(screen.queryByRole('button', { name: FOLLOW_UP })).toBeNull()
  })

  it('are not rendered at all without a handler', () => {
    render(<ChatMessageList messages={[msg('b', 'assistant')]} />)
    expect(screen.queryByRole('button', { name: FOLLOW_UP })).toBeNull()
  })

  it('appear only once even across several assistant turns', () => {
    render(
      <ChatMessageList
        messages={[msg('a', 'assistant'), msg('b', 'student'), msg('c', 'assistant')]}
        onFollowUp={vi.fn()}
      />,
    )
    expect(screen.getAllByRole('button', { name: FOLLOW_UP })).toHaveLength(1)
  })

  it('send the prompt text to the handler when clicked', async () => {
    const onFollowUp = vi.fn()
    render(<ChatMessageList messages={[msg('b', 'assistant')]} onFollowUp={onFollowUp} />)

    await userEvent.click(screen.getByRole('button', { name: FOLLOW_UP }))

    expect(onFollowUp).toHaveBeenCalledWith(FOLLOW_UP)
  })

  it('are disabled while a reply is in flight', async () => {
    const onFollowUp = vi.fn()
    render(
      <ChatMessageList
        messages={[msg('b', 'assistant')]}
        onFollowUp={onFollowUp}
        isFollowUpDisabled
      />,
    )
    const button = screen.getByRole('button', { name: FOLLOW_UP })
    expect(button).toBeDisabled()

    await userEvent.click(button)
    expect(onFollowUp).not.toHaveBeenCalled()
  })
})
