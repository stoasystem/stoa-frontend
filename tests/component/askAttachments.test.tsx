/**
 * Files sent with a question (#125).
 *
 * The backend's upload path never went away -- intent, chunks, complete, then
 * the upload's id on the message -- only the front of it did, with the
 * online classroom. These drive the real panel and let only the two services at
 * the edge be answered, so what is asserted is what would leave the browser:
 * the file goes up before the question does, the question carries `{uploadId}`
 * (#507; `uploadFile` itself, against the real `complete` answer, is
 * `uploadHandoff507.test.ts`), and a
 * file that cannot be sent is refused in words the student can act on, never in
 * the server's own English.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskHost } from '@/features/ask/AskHost'
import i18n from '@/i18n'
import { ApiError } from '@/services/api/httpClient'
import { resetAsk } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { ChatMessage, Conversation } from '@/types/chat'

vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))
vi.mock('@/services/chat/commandMessageIds', () => ({
  commandMessageIds: vi.fn(async (conversationId: string, key: string) => ({
    studentMessageId: `student:${conversationId}:${key}`,
    assistantMessageId: `assistant:${conversationId}:${key}`,
  })),
}))
vi.mock('@/services/chat/chatApi', () => ({
  getConversations: vi.fn(),
  getConversation: vi.fn(),
  createConversation: vi.fn(),
}))
vi.mock('@/services/chat/chatStreamApi', () => ({
  streamConversationMessage: vi.fn(),
  getGenerationProgress: vi.fn(),
}))
vi.mock('@/services/files/fileApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/files/fileApi')>()),
  uploadFile: vi.fn(),
}))
vi.mock('@/services/teacherHelp/teacherHelpApi', () => ({
  getTeacherAvailability: vi.fn(async () => ({ online: false, availableTeachers: 0 })),
  getTeacherHelpRequest: vi.fn(async () => {
    throw new ApiError('never escalated', { status: 404 })
  }),
  createTeacherHelpRequest: vi.fn(),
}))
vi.mock('@/services/student/studentApi', () => ({
  getStudentProfile: vi.fn(async () => ({ grade: '8', primarySubjects: ['math'] })),
}))
vi.mock('@/services/learning/memoryApi', () => ({
  getMyMemorySummary: vi.fn(async () => ({ recommendations: [], weakTopics: [] })),
}))

import { getConversation } from '@/services/chat/chatApi'
import { getGenerationProgress, streamConversationMessage } from '@/services/chat/chatStreamApi'
import { uploadFile } from '@/services/files/fileApi'

const getConversationMock = vi.mocked(getConversation)
const streamMock = vi.mocked(streamConversationMessage)
const progressMock = vi.mocked(getGenerationProgress)
const uploadMock = vi.mocked(uploadFile)

function conversation(messages: ChatMessage[] = []): Conversation {
  return {
    id: 'c1',
    title: 'Linear equations',
    subject: 'math',
    grade: '8',
    updatedAt: '2026-10-11T10:00:00.000Z',
    messages,
  }
}

function emulateWidth(width: number) {
  window.matchMedia = ((query: string) => {
    const min = query.match(/min-width:\s*(\d+)px/)
    return {
      matches: !min || width >= Number(min[1]),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }
  }) as typeof window.matchMedia
}

function openAsk() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/ask/c1']}>
          <AskHost route={{ conversationId: 'c1' }} />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
  return within(screen.getByRole('complementary', { name: 'Ask' }))
}

const picker = () => document.querySelector<HTMLInputElement>('input[type="file"]')!

const photo = (name = 'exercise.png', size = 2048) =>
  new File([new Uint8Array(size)], name, { type: 'image/png' })

/** What `uploadFile` gives for a file that went up whole and passed: the upload, validated. */
function uploaded(uploadId: string, filename: string) {
  return { uploadId, filename, mimeType: 'image/png', sizeBytes: 2048 }
}

const originalMatchMedia = window.matchMedia

beforeEach(async () => {
  await i18n.changeLanguage('en')
  emulateWidth(1280)
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role: 'student' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  resetAsk()
  getConversationMock.mockResolvedValue(conversation())
  progressMock.mockResolvedValue({ status: 'completed', steps: [] } as never)
  streamMock.mockResolvedValue('streamed')
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
  sessionStorage.clear()
  vi.clearAllMocks()
})

describe('a question that carries a file', () => {
  it('uploads it when it is chosen and sends it with the question by its upload id', async () => {
    uploadMock.mockResolvedValue(uploaded('up-1', 'exercise.png'))
    const ask = openAsk()
    await ask.findByText('Linear equations')

    await userEvent.upload(picker(), photo())
    await waitFor(() => expect(uploadMock).toHaveBeenCalledTimes(1))
    expect(uploadMock.mock.calls[0][0].file.name).toBe('exercise.png')
    await ask.findByText('exercise.png')

    await userEvent.type(ask.getByRole('textbox', { name: 'Your question' }), 'What did I do wrong?{Enter}')
    await waitFor(() => expect(streamMock).toHaveBeenCalledTimes(1))

    const payload = streamMock.mock.calls[0][0].payload
    expect(payload.attachmentIds).toEqual([{ uploadId: 'up-1' }])
    expect(payload.content).toBe('What did I do wrong?')
  })

  it('sends no ids at all when nothing was attached (the negative control)', async () => {
    const ask = openAsk()
    await ask.findByText('Linear equations')

    await userEvent.type(ask.getByRole('textbox', { name: 'Your question' }), 'Just a question{Enter}')
    await waitFor(() => expect(streamMock).toHaveBeenCalledTimes(1))

    expect(uploadMock).not.toHaveBeenCalled()
    expect(streamMock.mock.calls[0][0].payload.attachmentIds).toBeUndefined()
  })

  it('shows the file on the student’s own bubble, before the server has seen it', async () => {
    uploadMock.mockResolvedValue(uploaded('up-1', 'exercise.png'))
    streamMock.mockImplementation(() => new Promise(() => {}))
    const ask = openAsk()
    await ask.findByText('Linear equations')

    await userEvent.upload(picker(), photo())
    await ask.findByText('exercise.png')
    await userEvent.type(ask.getByRole('textbox', { name: 'Your question' }), 'Here it is{Enter}')

    const log = within(await ask.findByRole('log', { name: 'Messages' }))
    const bubble = await log.findByText('Here it is')
    const files = bubble.closest('[data-message-role="student"]')!.querySelector('[data-message-attachments]')
    expect(files).not.toBeNull()
    expect(within(files as HTMLElement).getByText('exercise.png')).toBeInTheDocument()
  })

  it('holds send while the file is still going up, and says so', async () => {
    let finish: (value: ReturnType<typeof uploaded>) => void = () => {}
    uploadMock.mockImplementation(() => new Promise((resolve) => (finish = resolve)))
    const ask = openAsk()
    await ask.findByText('Linear equations')

    await userEvent.upload(picker(), photo())
    await ask.findByText('Adding…')
    await userEvent.type(ask.getByRole('textbox', { name: 'Your question' }), 'Too soon{Enter}')

    expect(streamMock).not.toHaveBeenCalled()
    expect(ask.getByText('This is still going out. Try again in a moment.')).toBeInTheDocument()

    finish(uploaded('up-1', 'exercise.png'))
    await waitFor(() => expect(ask.queryByText('Adding…')).toBeNull())
  })
})

describe('a file that cannot be sent', () => {
  it('refuses a kind the backend would refuse, before any request leaves', async () => {
    const ask = openAsk()
    await ask.findByText('Linear equations')

    // Past the chooser's own `accept` filter, as "All files" or a drag would be.
    fireEvent.change(picker(), {
      target: { files: [new File(['x'], 'notes.key', { type: 'application/octet-stream' })] },
    })

    expect(await ask.findByText(/This kind of file cannot be sent/)).toBeInTheDocument()
    expect(uploadMock).not.toHaveBeenCalled()
  })

  it('refuses a photo over the 10 MB the backend allows one, before any request leaves', async () => {
    const ask = openAsk()
    await ask.findByText('Linear equations')

    const big = photo('scan.png', 1)
    Object.defineProperty(big, 'size', { value: 10 * 1024 * 1024 + 1 })
    await userEvent.upload(picker(), big)

    expect(await ask.findByText(/Photos may be up to 10 MB/)).toBeInTheDocument()
    expect(uploadMock).not.toHaveBeenCalled()
  })

  it('lets a photo just under that limit through (the negative control)', async () => {
    uploadMock.mockResolvedValue(uploaded('up-1', 'scan.png'))
    const ask = openAsk()
    await ask.findByText('Linear equations')

    const justFits = photo('scan.png', 1)
    Object.defineProperty(justFits, 'size', { value: 10 * 1024 * 1024 })
    await userEvent.upload(picker(), justFits)

    await waitFor(() => expect(uploadMock).toHaveBeenCalledTimes(1))
    expect(ask.queryByText(/Photos may be up to 10 MB/)).toBeNull()
  })

  it('turns the upload API’s code into our own sentence, and never shows its English', async () => {
    uploadMock.mockRejectedValue(
      new ApiError('This file is too large. Choose a smaller file.', {
        status: 422,
        code: 'upload_too_large',
        detail: { code: 'upload_too_large', message: 'This file is too large. Choose a smaller file.' },
      }),
    )
    const ask = openAsk()
    await ask.findByText('Linear equations')

    await userEvent.upload(picker(), photo('huge.png'))

    expect(await ask.findByText(/Photos may be up to 10 MB, other files up to 50 MB/)).toBeInTheDocument()
    // The server's own prose is written for whoever wrote the request.
    expect(ask.queryByText('This file is too large. Choose a smaller file.')).toBeNull()
  })

  it('leaves a failed file on screen when the question goes out without it', async () => {
    uploadMock.mockRejectedValue(new ApiError('nope', { status: 503, code: 'upload_service_unavailable' }))
    const ask = openAsk()
    await ask.findByText('Linear equations')

    await userEvent.upload(picker(), photo())
    await ask.findByText(/Files cannot be added right now/)

    await userEvent.type(ask.getByRole('textbox', { name: 'Your question' }), 'Ask anyway{Enter}')
    await waitFor(() => expect(streamMock).toHaveBeenCalledTimes(1))

    expect(streamMock.mock.calls[0][0].payload.attachmentIds).toBeUndefined()
    expect(ask.getByText(/Files cannot be added right now/)).toBeInTheDocument()
  })

  it('takes a file back out again', async () => {
    uploadMock.mockResolvedValue(uploaded('up-1', 'exercise.png'))
    const ask = openAsk()
    await ask.findByText('Linear equations')

    await userEvent.upload(picker(), photo())
    await ask.findByText('exercise.png')
    await userEvent.click(ask.getByRole('button', { name: 'Remove exercise.png' }))
    await waitFor(() => expect(ask.queryByText('exercise.png')).toBeNull())

    await userEvent.type(ask.getByRole('textbox', { name: 'Your question' }), 'Never mind{Enter}')
    await waitFor(() => expect(streamMock).toHaveBeenCalledTimes(1))
    expect(streamMock.mock.calls[0][0].payload.attachmentIds).toBeUndefined()
  })
})
