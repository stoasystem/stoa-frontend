/**
 * The reply composer refused ordinary maths as HTML (#268): "0 < a < 1" hit
 * the "<a" tag check and "set one = 1" the "on…=" handler check, so a teacher
 * could not send the answer. Which text is HTML is the reply rules' now
 * (replyRules564); these hold that the composer lets maths go out, in text
 * and formula blocks alike, and says so when markup is refused.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TeacherReplyComposer } from '@/features/teacherReply/TeacherReplyComposer'
import type { TeacherReplyAdapter } from '@/features/teacherReply/teacherReplyAdapter'
import { useTeacherReply } from '@/features/teacherReply/useTeacherReply'
import i18n from '@/i18n'
import type { TeacherHelpRequestNote } from '@/types/teacher'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

const REFUSED = 'HTML-Code ist in Antworten nicht erlaubt.'

beforeEach(async () => {
  sessionStorage.clear()
  await i18n.changeLanguage('de')
})

function Composer({ adapter }: { adapter: TeacherReplyAdapter }) {
  return <TeacherReplyComposer reply={useTeacherReply('r1', { adapter })} />
}

async function compose(text: string, mode: 'paragraph' | 'formula' = 'paragraph') {
  const addNote = vi.fn<TeacherReplyAdapter['addNote']>(async () => ({ id: 'n1' }) as TeacherHelpRequestNote)
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={new QueryClient()}>
        <Composer adapter={{ addNote }} />
      </QueryClientProvider>
    </I18nextProvider>,
  )
  if (mode === 'formula') await userEvent.click(screen.getByRole('button', { name: 'Formel' }))
  fireEvent.change(screen.getByLabelText('Antwort der Lehrperson'), { target: { value: text } })
  return { addNote, send: screen.getByRole('button', { name: 'Antwort senden' }) }
}

describe('the reply composer lets maths and plain text through', () => {
  it.each([
    ['an inequality', '0 < a < 1', 'paragraph'],
    ['"one =" in a sentence', 'Set one = 1 first, once = 2 after', 'paragraph'],
    ['an inequality in a formula block', '0 < a < 1', 'formula'],
  ] as const)('%s', async (_, text, mode) => {
    const { addNote, send } = await compose(text, mode)
    expect(screen.queryByText(REFUSED)).not.toBeInTheDocument()
    expect(send).toBeEnabled()
    await userEvent.click(send)
    await waitFor(() => expect(addNote).toHaveBeenCalledOnce())
    const block = addNote.mock.calls[0]?.[1].richContent.blocks[0]
    expect(block).toEqual(mode === 'formula' ? { type: 'formula', latex: text } : { type: 'paragraph', text })
  })
})

describe('the reply composer still refuses HTML', () => {
  it.each([
    ['a script tag', '<script>alert(1)</script>', 'paragraph'],
    ['a tag in a formula block', 'x = 1 <img src=x onerror=alert(1)>', 'formula'],
  ] as const)('%s', async (_, text, mode) => {
    const { send } = await compose(text, mode)
    expect(screen.getByText(REFUSED)).toBeInTheDocument()
    expect(send).toBeDisabled()
  })
})
