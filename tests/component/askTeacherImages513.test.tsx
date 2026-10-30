/**
 * #513: the student sees the pictures a teacher replied with (stoa-backend#145).
 *
 * S1 - a teacher's picture is a thumbnail read with the student's token from
 *      the student's own attachment route, named for a screen reader with the
 *      teacher's name, and opens larger.
 * S2 - one removed, one the student may not read (403/404), or one that came
 *      back as anything but PNG or JPEG is a placeholder, not an error, and is
 *      not asked for again; any other failure offers to load it again.
 * S3 - the conversation as the backend sends it names the files `attachmentId`
 *      / `mediaType`; a teacher's message keeps them.
 * S4 - the student's own files are still only named: nothing is read for them.
 * S5 - the sentences are there in all four languages.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AskMessage } from '@/features/ask/AskMessage'
import i18n from '@/i18n'
import de from '@/i18n/locales/de/chat.json'
import en from '@/i18n/locales/en/chat.json'
import fr from '@/i18n/locales/fr/chat.json'
import italian from '@/i18n/locales/it/chat.json'
import { ApiError, httpClient } from '@/services/api/httpClient'
import { getConversation } from '@/services/chat/chatApi'
import { getAttachmentContent } from '@/services/files/fileApi'
import type { ChatAttachment, ChatMessage } from '@/types/chat'

vi.mock('@/services/files/fileApi', async (orig) => ({
  ...(await orig<typeof import('@/services/files/fileApi')>()),
  getAttachmentContent: vi.fn(),
}))

const contentMock = vi.mocked(getAttachmentContent)
const copy = de.ask.teacherImages
const fill = (text: string, values: Record<string, string>) =>
  Object.entries(values).reduce((line, [key, value]) => line.replace(`{{${key}}}`, value), text)

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

describe('S1: a teacher\'s picture', () => {
  it('is a thumbnail read from the student\'s attachment, named with the teacher', async () => {
    contentMock.mockResolvedValue(new Blob(['png'], { type: 'image/png' }))
    renderMessage(message('teacher', [picture()]))

    const open = await screen.findByRole('button', { name: fill(copy.open, { name: 'skizze.png' }) })
    const thumbnail = within(open).getByRole('img')
    expect(thumbnail).toHaveAttribute('alt', fill(copy.alt, { teacher: 'Frau Keller', name: 'skizze.png' }))
    expect(thumbnail).toHaveAttribute('src', 'blob:test/1')
    expect(contentMock).toHaveBeenCalledWith('att-1')
    expect(screen.getByRole('list', { name: copy.label })).toBeInTheDocument()
  })

  it('opens larger', async () => {
    contentMock.mockResolvedValue(new Blob(['png'], { type: 'image/png' }))
    renderMessage(message('teacher', [picture()]))

    await userEvent.click(await screen.findByRole('button', { name: fill(copy.open, { name: 'skizze.png' }) }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: 'skizze.png' })).toBeInTheDocument()
    expect(within(dialog).getByRole('img')).toHaveAttribute('src', 'blob:test/1')
  })

  it('reads the student\'s own route, as a blob', async () => {
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue({ data: new Blob(['png']) } as never)
    const real = await vi.importActual<typeof import('@/services/files/fileApi')>('@/services/files/fileApi')

    await real.getAttachmentContent('att-1')

    expect(get).toHaveBeenCalledWith('/files/attachments/att-1/content', { responseType: 'blob' })
    get.mockRestore()
  })
})

describe('S2: a picture that cannot be shown', () => {
  it('is a placeholder when it was removed, and nothing is read', async () => {
    renderMessage(message('teacher', [picture({ status: 'failed' })]))

    expect(screen.getByText(copy.unavailable)).toBeInTheDocument()
    expect(contentMock).not.toHaveBeenCalled()
  })

  it.each([403, 404])('is a placeholder when the read is refused with %i', async (status) => {
    contentMock.mockRejectedValue(new ApiError('no', { status }))
    renderMessage(message('teacher', [picture()]))

    expect(await screen.findByText(copy.unavailable)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: fill(copy.retryNamed, { name: 'skizze.png' }) })).not.toBeInTheDocument()
  })

  it('is a placeholder when what came back is not a picture the browser draws', async () => {
    contentMock.mockResolvedValue(new Blob(['<svg/>'], { type: 'image/svg+xml' }))
    renderMessage(message('teacher', [picture()]))

    expect(await screen.findByText(copy.unavailable)).toBeInTheDocument()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('offers to load it again after any other failure', async () => {
    contentMock.mockRejectedValue(new ApiError('down', { status: 500 }))
    renderMessage(message('teacher', [picture()]))

    // After the one retry the app gives any read.
    expect(await screen.findByText(copy.failed, undefined, { timeout: 4_000 })).toBeInTheDocument()
    expect(contentMock).toHaveBeenCalledTimes(2)

    contentMock.mockResolvedValue(new Blob(['png'], { type: 'image/png' }))
    // Its name starts with what it says on it (WCAG 2.5.3, label in name).
    const retry = screen.getByRole('button', { name: fill(copy.retryNamed, { name: 'skizze.png' }) })
    expect(retry.getAttribute('aria-label')?.startsWith(retry.textContent ?? '')).toBe(true)
    await userEvent.click(retry)

    expect(await screen.findByRole('button', { name: fill(copy.open, { name: 'skizze.png' }) })).toBeInTheDocument()
    expect(contentMock).toHaveBeenCalledTimes(3)
  })
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
