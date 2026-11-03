/**
 * Files sent with a question (#125).
 *
 * The backend's upload path never went away -- intent, chunks, complete, then
 * the upload's id on the message -- only the front of it did, with the
 * online classroom. These drive the real panel and let only the two services at
 * the edge be answered, so what is asserted is what would leave the browser:
 * the file goes up before the question does, the question carries `{uploadId}`
 * (#507; `uploadFile` itself, against the real `complete` answer, is
 * `uploadToMessage507.test.ts`), and a
 * file that cannot be sent is refused in words the student can act on, never in
 * the server's own English.
 *
 * What a file goes through between chosen and sent -- prepared, refused,
 * failed, past its time, taken out -- is the attachments module's
 * (attachments561); these hold Ask's wiring to it, and its sentences.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
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
// jsdom draws nothing: what a photo becomes is prepareImage508's. Here it is
// answered, so what is asserted is that the prepared file is the one sent.
vi.mock('@/services/files/prepareImage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/files/prepareImage')>()),
  prepareImage: vi.fn(async (file: File) => file),
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

import { createConversation, getConversation, getConversations } from '@/services/chat/chatApi'
import { getGenerationProgress, streamConversationMessage } from '@/services/chat/chatStreamApi'
import { uploadFile } from '@/services/files/fileApi'
import { prepareImage } from '@/services/files/prepareImage'

const getConversationMock = vi.mocked(getConversation)
const streamMock = vi.mocked(streamConversationMessage)
const progressMock = vi.mocked(getGenerationProgress)
const uploadMock = vi.mocked(uploadFile)
const prepareMock = vi.mocked(prepareImage)

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

/** The panel as a student opens it, in whatever language i18n is in. */
function renderAsk(conversationId: string | null = 'c1') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[conversationId ? `/ask/${conversationId}` : '/ask']}>
          <AskHost route={{ conversationId }} />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

function openAsk(conversationId: string | null = 'c1') {
  renderAsk(conversationId)
  return within(screen.getByRole('complementary', { name: 'Ask' }))
}

const picker = () => document.querySelector<HTMLInputElement>('input[type="file"]:not([data-ask-camera])')!
const camera = () => document.querySelector<HTMLInputElement>('input[type="file"][data-ask-camera]')!

const photo = (name = 'exercise.png', size = 2048) =>
  new File([new Uint8Array(size)], name, { type: 'image/png' })

/** What `uploadFile` gives for a file that went up whole and passed: the upload, validated. */
function uploaded(uploadId: string, filename: string, expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()) {
  return { uploadId, expiresAt, filename, mimeType: 'image/png', sizeBytes: 2048 }
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
  prepareMock.mockImplementation(async (file: File) => file)
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
    // Gone with the question: the next one does not carry it again.
    expect(ask.queryByRole('list', { name: 'Attached files' })).toBeNull()
  })

  it('starts a new conversation with it, and the tray lets it go once it is sent there (#263)', async () => {
    vi.mocked(getConversations).mockResolvedValue({ items: [] } as never)
    vi.mocked(createConversation).mockResolvedValue(conversation() as never)
    uploadMock.mockResolvedValue(uploaded('up-1', 'exercise.png'))
    const ask = openAsk(null)
    const box = await ask.findByRole('textbox', { name: 'Your question' })

    await userEvent.upload(picker(), photo())
    await ask.findByText('exercise.png')
    await waitFor(() => expect(ask.queryByText('Adding…')).toBeNull())
    await userEvent.type(box, 'What did I do wrong?{Enter}')

    await waitFor(() => expect(streamMock).toHaveBeenCalledTimes(1))
    // A question carrying a file starts the conversation empty and goes into it.
    expect(vi.mocked(createConversation).mock.calls[0][0]).not.toHaveProperty('initialMessage')
    expect(streamMock.mock.calls[0][0].payload.attachmentIds).toEqual([{ uploadId: 'up-1' }])
    await waitFor(() => expect(screen.queryByRole('list', { name: 'Attached files' })).toBeNull())
  })

  it('holds the question when a file waited past its upload’s 30 minutes, and says to choose it again (#507)', async () => {
    uploadMock.mockResolvedValue(uploaded('up-1', 'exercise.png', new Date(Date.now() + 30 * 1000).toISOString()))
    const ask = openAsk()
    await ask.findByText('Linear equations')

    await userEvent.upload(picker(), photo())
    await waitFor(() => expect(ask.queryByText('Adding…')).toBeNull())
    await userEvent.type(ask.getByRole('textbox', { name: 'Your question' }), 'Here it is{Enter}')

    expect(await ask.findByText('This file took too long. Choose it again.')).toBeInTheDocument()
    expect(streamMock).not.toHaveBeenCalled()
    expect(ask.getByRole('textbox', { name: 'Your question' })).toHaveValue('Here it is')
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

/**
 * Taking a photo and choosing one are two entries (#509): `capture` makes a
 * phone open its camera, and takes the gallery away, so the chooser has none.
 * The Composer's own camera button is baseComponentSizes'.
 */
describe('the camera and the chooser', () => {
  /** A phone (`coarse`) or a laptop, at the width the panel is opened at. */
  function pointer(coarse: boolean) {
    const base = window.matchMedia
    window.matchMedia = ((query: string) =>
      query === '(pointer: coarse)' ? { ...base(query), matches: coarse } : base(query)) as typeof window.matchMedia
  }

  it('on a phone, opens the camera from the camera and the chooser from the +', async () => {
    pointer(true)
    const ask = openAsk()
    await ask.findByText('Linear equations')
    const cameraClick = vi.spyOn(camera(), 'click').mockImplementation(() => {})
    const pickerClick = vi.spyOn(picker(), 'click').mockImplementation(() => {})

    // Both from the + menu (#553): taking a photo first, choosing one after it.
    await userEvent.click(ask.getByRole('button', { name: 'Add a photo' }))
    let menu = await screen.findByRole('menu')
    expect(within(menu).getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Take a photo', 'Choose a photo or file'])
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Take a photo' }))
    expect(cameraClick).toHaveBeenCalledTimes(1)
    expect(pickerClick).not.toHaveBeenCalled()

    await userEvent.click(ask.getByRole('button', { name: 'Add a photo' }))
    menu = await screen.findByRole('menu')
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Choose a photo or file' }))
    expect(pickerClick).toHaveBeenCalledTimes(1)
    expect(cameraClick).toHaveBeenCalledTimes(1)
  })

  it('on a laptop, offers no camera: `capture` would open a second chooser there', async () => {
    pointer(false)
    const ask = openAsk()
    await ask.findByText('Linear equations')

    await userEvent.click(ask.getByRole('button', { name: 'Add a photo' }))
    const menu = await screen.findByRole('menu')
    expect(within(menu).getByRole('menuitem', { name: 'Choose a photo or file' })).toBeInTheDocument()
    expect(within(menu).queryByRole('menuitem', { name: 'Take a photo' })).toBeNull()
  })

  it('opens the back camera for a photo, and only for a photo', async () => {
    const ask = openAsk()
    await ask.findByText('Linear equations')

    expect(camera().getAttribute('capture')).toBe('environment')
    expect(camera().accept).toBe('image/*')
    expect(camera().multiple).toBe(false)
  })

  it('leaves the chooser without `capture`, so the gallery and files stay open (the negative control)', async () => {
    const ask = openAsk()
    await ask.findByText('Linear equations')

    expect(picker().hasAttribute('capture')).toBe(false)
    expect(picker().multiple).toBe(true)
    expect(picker().accept.split(',')).toEqual(expect.arrayContaining(['.pdf', '.jpg', '.heic']))
  })

  it('puts the photo taken in the tray, shrunk, and sends it with the question', async () => {
    uploadMock.mockResolvedValue(uploaded('up-1', 'image.jpg'))
    const ask = openAsk()
    await ask.findByText('Linear equations')

    const taken = new File([new Uint8Array(2048)], 'image.jpg', { type: 'image/jpeg' })
    await userEvent.upload(camera(), taken)
    await ask.findByText('image.jpg')
    expect(prepareMock.mock.calls[0][0]).toBe(taken)

    await userEvent.type(ask.getByRole('textbox', { name: 'Your question' }), 'This one{Enter}')
    await waitFor(() => expect(streamMock).toHaveBeenCalledTimes(1))
    expect(streamMock.mock.calls[0][0].payload.attachmentIds).toEqual([{ uploadId: 'up-1' }])
  })
})

describe('a file that cannot be sent', () => {
  /**
   * Image moderation (stoa-backend#138) answers `complete` with
   * `422 upload_content_blocked`. There is no appeal (#512): the sentence says
   * what the student can do instead, never to try the same picture again.
   */
  const BLOCKED = {
    de: 'Dieses Bild kann nicht gesendet werden. Wähl ein anderes oder beschreib die Aufgabe in Worten.',
    en: 'This picture cannot be sent. Choose a different one, or describe the question in words.',
    fr: 'Cette image ne peut pas être envoyée. Choisis-en une autre ou décris l’exercice avec tes mots.',
    it: 'Questa immagine non si può inviare. Scegline un’altra oppure descrivi l’esercizio a parole.',
  } as const

  const blocked = () =>
    new ApiError('This image cannot be sent.', {
      status: 422,
      code: 'upload_content_blocked',
      detail: { code: 'upload_content_blocked', message: 'This image cannot be sent.', correlationId: 'c-1' },
    })

  it.each(Object.entries(BLOCKED))('says in %s that a picture moderation refused cannot be sent (#512)', async (language, sentence) => {
    await i18n.changeLanguage(language)
    uploadMock.mockRejectedValue(blocked())
    renderAsk()
    await screen.findByText('Linear equations')

    await userEvent.upload(picker(), photo())

    const row = (await screen.findByText(sentence)).closest('li')!
    expect(row).toHaveAttribute('data-attachment-state', 'failed')
    expect(screen.queryByText('This image cannot be sent.')).toBeNull()
  })

  it('does not tell the student to send a refused picture again, and the question goes out without it', async () => {
    uploadMock.mockRejectedValue(blocked())
    const ask = openAsk()
    await ask.findByText('Linear equations')

    await userEvent.upload(picker(), photo())
    await ask.findByText(BLOCKED.en)
    // The generic failure says "Try again", which moderation would only refuse again.
    expect(ask.queryByText(/Try again/)).toBeNull()

    await userEvent.type(ask.getByRole('textbox', { name: 'Your question' }), 'It is a triangle with sides 3, 4, 5{Enter}')
    await waitFor(() => expect(streamMock).toHaveBeenCalledTimes(1))
    expect(streamMock.mock.calls[0][0].payload.attachmentIds).toBeUndefined()
  })

})
