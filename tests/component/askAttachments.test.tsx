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
// jsdom draws nothing: what a photo becomes is prepareImage508's. Here it is
// answered, so what is asserted is that the prepared file is the one sent.
vi.mock('@/services/files/prepareImage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/files/prepareImage')>()),
  prepareImage: vi.fn(async (file: File) => file),
}))
// Off in the app until #512; each test that needs the buttons turns it on.
let attachmentsWork = false
vi.mock('@/features/ask/attachmentsSwitch', () => ({
  get ATTACHMENTS_WORK() {
    return attachmentsWork
  },
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
import { ImagePreparationError, prepareImage } from '@/services/files/prepareImage'

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
function renderAsk() {
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
}

function openAsk() {
  renderAsk()
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
  attachmentsWork = false
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

  it('takes an iPhone’s HEIC and sends the JPEG made of it (#508)', async () => {
    uploadMock.mockResolvedValue(uploaded('up-1', 'IMG_0001.jpg'))
    prepareMock.mockResolvedValueOnce(new File([new Uint8Array(4096)], 'IMG_0001.jpg', { type: 'image/jpeg' }))
    const ask = openAsk()
    await ask.findByText('Linear equations')

    expect(picker().accept.split(',')).toEqual(expect.arrayContaining(['.heic', '.heif', '.jpg', '.png']))
    await userEvent.upload(picker(), new File([new Uint8Array(2048)], 'IMG_0001.HEIC', { type: 'image/heic' }))

    await waitFor(() => expect(uploadMock).toHaveBeenCalledTimes(1))
    expect(uploadMock.mock.calls[0][0].file).toMatchObject({ name: 'IMG_0001.jpg', type: 'image/jpeg' })
    expect(await ask.findByText('IMG_0001.jpg')).toBeInTheDocument()
  })

  it('prepares photos chosen together one at a time, so a phone holds one in memory', async () => {
    uploadMock.mockImplementation(async ({ file }) => uploaded(`up-${file.name}`, file.name))
    const finish: Array<() => void> = []
    prepareMock.mockImplementation(
      (file: File) => new Promise<File>((resolve) => finish.push(() => resolve(file))),
    )
    const ask = openAsk()
    await ask.findByText('Linear equations')

    await userEvent.upload(picker(), [photo('a.png'), photo('b.png'), photo('c.png')])
    await waitFor(() => expect(prepareMock).toHaveBeenCalledTimes(1))
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(prepareMock).toHaveBeenCalledTimes(1)

    finish[0]()
    await waitFor(() => expect(prepareMock).toHaveBeenCalledTimes(2))
    expect(prepareMock.mock.calls[1][0].name).toBe('b.png')
    finish[1]()
    await waitFor(() => expect(prepareMock).toHaveBeenCalledTimes(3))
    finish[2]()
    await waitFor(() => expect(uploadMock).toHaveBeenCalledTimes(3))
  })

  it('goes on to the next photo when one cannot be prepared', async () => {
    uploadMock.mockImplementation(async ({ file }) => uploaded(`up-${file.name}`, file.name))
    prepareMock.mockRejectedValueOnce(new ImagePreparationError('a.png could not be opened.'))
    const ask = openAsk()
    await ask.findByText('Linear equations')

    await userEvent.upload(picker(), [photo('a.png'), photo('b.png')])

    await waitFor(() => expect(uploadMock).toHaveBeenCalledTimes(1))
    expect(uploadMock.mock.calls[0][0].file.name).toBe('b.png')
  })

  it('does not call a photo that came out of shrinking over the limit "too big" (#508)', async () => {
    const over = new File([new Uint8Array(8)], 'exercise.jpg', { type: 'image/jpeg' })
    Object.defineProperty(over, 'size', { value: 10 * 1024 * 1024 + 1 })
    prepareMock.mockResolvedValueOnce(over)
    const ask = openAsk()
    await ask.findByText('Linear equations')

    await userEvent.upload(picker(), photo())

    expect(await ask.findByText('This file could not be added. Try again.')).toBeInTheDocument()
    expect(ask.queryByText(/Photos may be up to/)).toBeNull()
    expect(uploadMock).not.toHaveBeenCalled()
  })

  it('sends a document as it is, unprepared (the negative control)', async () => {
    uploadMock.mockResolvedValue({ ...uploaded('up-1', 'notes.pdf'), mimeType: 'application/pdf', sizeBytes: 3 })
    const ask = openAsk()
    await ask.findByText('Linear equations')

    const pdf = new File(['pdf'], 'notes.pdf', { type: 'application/pdf' })
    await userEvent.upload(picker(), pdf)

    await waitFor(() => expect(uploadMock).toHaveBeenCalledTimes(1))
    expect(prepareMock).not.toHaveBeenCalled()
    expect(uploadMock.mock.calls[0][0].file).toBe(pdf)
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
 * The buttons wait behind `ATTACHMENTS_WORK` (#512), which these turn on; the
 * Composer's own camera button is baseComponentSizes'.
 */
describe('the camera and the chooser', () => {
  /** A phone (`coarse`) or a laptop, at the width the panel is opened at. */
  function pointer(coarse: boolean) {
    const base = window.matchMedia
    window.matchMedia = ((query: string) =>
      query === '(pointer: coarse)' ? { ...base(query), matches: coarse } : base(query)) as typeof window.matchMedia
  }

  it('on a phone, opens the camera from the camera and the chooser from the +', async () => {
    attachmentsWork = true
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
    attachmentsWork = true
    pointer(false)
    const ask = openAsk()
    await ask.findByText('Linear equations')

    await userEvent.click(ask.getByRole('button', { name: 'Add a photo' }))
    const menu = await screen.findByRole('menu')
    expect(within(menu).getByRole('menuitem', { name: 'Choose a photo or file' })).toBeInTheDocument()
    expect(within(menu).queryByRole('menuitem', { name: 'Take a photo' })).toBeNull()
  })

  it('shows no + while the switch is off (the negative control)', async () => {
    pointer(true)
    const ask = openAsk()
    await ask.findByText('Linear equations')

    expect(ask.queryByRole('button', { name: 'Add a photo' })).toBeNull()
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

  it('refuses a photo over the 30 MB the browser will open, before it is opened', async () => {
    const ask = openAsk()
    await ask.findByText('Linear equations')

    const big = photo('scan.png', 1)
    Object.defineProperty(big, 'size', { value: 30 * 1024 * 1024 + 1 })
    await userEvent.upload(picker(), big)

    expect(await ask.findByText(/Photos may be up to 30 MB/)).toBeInTheDocument()
    expect(prepareMock).not.toHaveBeenCalled()
    expect(uploadMock).not.toHaveBeenCalled()
  })

  it('lets a photo over the backend’s 10 MB through, since it is shrunk first (#508)', async () => {
    uploadMock.mockResolvedValue(uploaded('up-1', 'scan.jpg'))
    prepareMock.mockResolvedValueOnce(new File([new Uint8Array(4096)], 'scan.jpg', { type: 'image/jpeg' }))
    const ask = openAsk()
    await ask.findByText('Linear equations')

    const large = photo('scan.png', 1)
    Object.defineProperty(large, 'size', { value: 30 * 1024 * 1024 })
    await userEvent.upload(picker(), large)

    await waitFor(() => expect(uploadMock).toHaveBeenCalledTimes(1))
    expect(prepareMock.mock.calls[0][0]).toBe(large)
    expect(uploadMock.mock.calls[0][0].file).toMatchObject({ name: 'scan.jpg', type: 'image/jpeg', size: 4096 })
    expect(ask.queryByText(/Photos may be up to/)).toBeNull()
  })

  it('says so in the student’s words when the browser cannot open a photo (#508)', async () => {
    prepareMock.mockRejectedValueOnce(new ImagePreparationError('exercise.png could not be opened.'))
    const ask = openAsk()
    await ask.findByText('Linear equations')

    await userEvent.upload(picker(), photo())

    expect(await ask.findByText('This photo could not be opened. Try another one, or a screenshot.')).toBeInTheDocument()
    expect(uploadMock).not.toHaveBeenCalled()
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

    expect(await ask.findByText(/Photos may be up to 30 MB, other files up to 50 MB/)).toBeInTheDocument()
    // The server's own prose is written for whoever wrote the request.
    expect(ask.queryByText('This file is too large. Choose a smaller file.')).toBeNull()
  })

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
