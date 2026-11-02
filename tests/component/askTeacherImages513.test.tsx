/**
 * #513: the student sees the pictures a teacher replied with (stoa-backend#145).
 *
 * How a teacher's picture shows, fails, and is read once is the attachment
 * viewer's (#563, `attachmentPictures563.test.tsx`); the student's route it is
 * read from is pinned in `teacherHelpAttachmentApi510.test.ts`. Left here:
 *
 * S3 - the conversation as the backend sends it names the files `attachmentId`
 *      / `mediaType`; a teacher's message keeps them.
 * S4 - the student's own files are still only named: nothing is read for them.
 * S5 - the sentences are there in all four languages.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AskMessage } from '@/features/ask/AskMessage'
import i18n from '@/i18n'
import de from '@/i18n/locales/de/chat.json'
import en from '@/i18n/locales/en/chat.json'
import fr from '@/i18n/locales/fr/chat.json'
import italian from '@/i18n/locales/it/chat.json'
import { httpClient } from '@/services/api/httpClient'
import { getConversation } from '@/services/chat/chatApi'
import { getAttachmentContent } from '@/services/files/fileApi'
import type { ChatAttachment, ChatMessage } from '@/types/chat'

vi.mock('@/services/files/fileApi', async (orig) => ({
  ...(await orig<typeof import('@/services/files/fileApi')>()),
  getAttachmentContent: vi.fn(),
}))

const contentMock = vi.mocked(getAttachmentContent)
const copy = de.ask.teacherImages

function picture(overrides: Partial<ChatAttachment> = {}): ChatAttachment {
  return {
    id: 'att-1',
    filename: 'skizze.png',
    mimeType: 'image/png',
    sizeBytes: 2048,
    status: 'uploaded',
    createdAt: '2026-10-30T10:00:00Z',
    ...overrides,
  }
}

function message(role: ChatMessage['role'], attachments: ChatAttachment[]): ChatMessage {
  return {
    id: `${role}-1`,
    conversationId: 'c1',
    role,
    content: 'Schau dir die Skizze an.',
    createdAt: '2026-10-30T10:00:00Z',
    attachments,
  }
}

function renderMessage(value: ChatMessage) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <AskMessage message={value} teacherName="Frau Keller" />
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

beforeEach(async () => {
  vi.clearAllMocks()
  contentMock.mockReset()
  URL.createObjectURL = vi.fn(() => 'blob:test/1')
  URL.revokeObjectURL = vi.fn()
  await i18n.changeLanguage('de')
})

describe('S3: as the backend sends it', () => {
  it('keeps a teacher message\'s files, renamed as the thread names them', async () => {
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue({
      data: {
        id: 'c1', title: 'Brüche', subject: 'mathematics', grade: '8', messages: [{
          id: 'm1', conversationId: 'c1', role: 'teacher', content: 'Schau dir die Skizze an.',
          createdAt: '2026-10-30T10:00:00Z',
          attachments: [{
            attachmentId: 'att-1', filename: 'skizze.png', mediaType: 'image/png', sizeBytes: 2048,
            status: 'active', createdAt: '2026-10-30T10:00:00Z',
          }],
        }],
      },
    } as never)

    const conversation = await getConversation('c1')

    expect(conversation.messages[0]?.attachments).toEqual([picture()])
    get.mockRestore()
  })
})

describe('S4: the student\'s own files', () => {
  it('are still only named, and nothing is read for them', async () => {
    renderMessage(message('student', [picture()]))

    expect(screen.getByText('skizze.png')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: copy.label })).not.toBeInTheDocument()
    await waitFor(() => expect(contentMock).not.toHaveBeenCalled())
  })
})

describe('S5: the sentences', () => {
  it.each(Object.entries({ de, en, fr, it: italian }))('%s has every line', (_lang, locale) => {
    const lines = locale.ask.teacherImages
    for (const key of ['label', 'open', 'loading', 'unavailable', 'failed', 'retry'] as const) expect(lines[key]).toBeTruthy()
    expect(lines.alt).toContain('{{teacher}}')
    expect(lines.alt).toContain('{{name}}')
    expect(lines.retryNamed).toContain('{{name}}')
  })

  it('writes ss in German', () => {
    expect(JSON.stringify(de.ask.teacherImages)).not.toContain('ß')
  })
})
