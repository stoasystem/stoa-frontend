/**
 * #561: the files a message carries, from the moment they are chosen to the
 * moment the message takes them -- one module for a student's question and a
 * teacher's reply.
 *
 * The module is driven through its own interface: a small harness renders
 * `useAttachments` with `<Attachments>`, files are chosen through the hidden
 * inputs it draws, and the message is sent with `take()` and settled with
 * `sent()` / `refused()`. Uploads go to an uploader in memory, handed in
 * through the hook's `uploader` seam, so each one is answered when and how a
 * test says. Only the edges the uploader does not cover are mocked: shrinking a
 * photo (jsdom draws nothing; prepareImage508 has what it makes) and the
 * phone's code API.
 *
 * What the panel and the reply box do with it -- which button opens what, what
 * goes in the request -- is askAttachments', askPhoneUpload514's and
 * teacherReplyImages513's.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Attachments } from '@/features/uploads/Attachments'
import type { TrayCopy } from '@/features/uploads/AttachmentTray'
import { isUploadGone } from '@/features/uploads/uploadGone'
import { useAttachments, type AttachmentUploader } from '@/features/uploads/useAttachments'
import i18n from '@/i18n'
import chat from '@/i18n/locales/en/chat.json'
import teacher from '@/i18n/locales/en/teacher.json'
import { ApiError } from '@/services/api/httpClient'
import { ATTACHMENTS_PER_MESSAGE } from '@/services/files/uploadLimits'
import type { UploadPurpose, ValidatedUpload } from '@/types/file'

vi.mock('@/services/files/prepareImage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/files/prepareImage')>()),
  prepareImage: vi.fn(async (file: File) => file),
}))
vi.mock('@/services/files/uploadCodeApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/files/uploadCodeApi')>()),
  createUploadCode: vi.fn(),
  readUploadCode: vi.fn(),
  readUploadCodePhoto: vi.fn(),
}))

import { ImagePreparationError, prepareImage } from '@/services/files/prepareImage'
import { createUploadCode, readUploadCode, readUploadCodePhoto } from '@/services/files/uploadCodeApi'

const prepareMock = vi.mocked(prepareImage)

/** Lets what an answered upload sets off run out. */
const settled = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })

/** One file the uploader was handed, to be answered by the test. */
type Pending = {
  file: File
  purpose: UploadPurpose
  signal: AbortSignal
  pass: (patch?: Partial<ValidatedUpload>) => Promise<void>
  fail: (error: unknown) => Promise<void>
}

/** Uploads held in memory; each waits until the test passes or fails it. */
function memoryUploader() {
  const pending: Pending[] = []
  let count = 0
  const uploader: AttachmentUploader = {
    upload: (file, purpose, signal) =>
      new Promise<ValidatedUpload>((resolve, reject) => {
        count += 1
        const uploadId = `up-${count}`
        pending.push({
          file,
          purpose,
          signal,
          pass: async (patch = {}) => {
            resolve({ uploadId, expiresAt: minutesFromNow(30), filename: file.name, mimeType: file.type, sizeBytes: file.size, ...patch })
            await settled()
          },
          fail: async (error) => {
            reject(error)
            await settled()
          },
        })
      }),
  }
  return { uploader, pending }
}

const minutesFromNow = (minutes: number) => new Date(Date.now() + minutes * 60 * 1000).toISOString()

const photo = (name = 'exercise.png') => new File([new Uint8Array(2048)], name, { type: 'image/png' })
const pdf = (name = 'notes.pdf') => new File(['%PDF'], name, { type: 'application/pdf' })

type Options = Parameters<typeof useAttachments>[0]

/** The hook and its view, as a composer places them; what the hook gives is kept to drive it. */
function renderAttachments(options: Options = {}, { copy = 'student' as TrayCopy, needsText = false } = {}) {
  const memory = memoryUploader()
  const current: { value: ReturnType<typeof useAttachments> | null } = { value: null }
  function Harness({ shown = true }: { shown?: boolean }) {
    const attachments = useAttachments({ uploader: memory.uploader, ...options })
    current.value = attachments
    return shown ? <Attachments view={attachments.view} copy={copy} needsText={needsText} /> : null
  }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrap = (shown?: boolean) => (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <Harness shown={shown} />
      </QueryClientProvider>
    </I18nextProvider>
  )
  const rendered = render(wrap())
  const hook = () => current.value!
  return {
    ...memory,
    hook,
    unmount: rendered.unmount,
    choose: async (files: File | File[]) => {
      await userEvent.upload(picker(), files, { applyAccept: false })
      await settled()
    },
    take: () => {
      let batch: ReturnType<ReturnType<typeof useAttachments>['take']> = null
      act(() => {
        batch = hook().take()
      })
      return batch as ReturnType<ReturnType<typeof useAttachments>['take']>
    },
  }
}

const picker = () => document.querySelector<HTMLInputElement>('input[type="file"]:not([data-ask-camera])')!
const camera = () => document.querySelector<HTMLInputElement>('input[type="file"][data-ask-camera]')
const rows = () => Array.from(document.querySelectorAll<HTMLElement>('[data-attachment-state]'))
const states = () => rows().map((row) => row.dataset.attachmentState)

function emulate({ touch }: { touch: boolean }) {
  window.matchMedia = ((query: string) => ({
    matches: query === '(pointer: coarse)' ? touch : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
}

const originalMatchMedia = window.matchMedia

beforeEach(async () => {
  await i18n.changeLanguage('en')
  emulate({ touch: false })
  prepareMock.mockImplementation(async (file: File) => file)
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
  vi.clearAllMocks()
})

describe('a file from chosen to sent', () => {
  it('goes up as soon as it is chosen, is ready once it passed, and the message takes it by its upload id', async () => {
    const tray = renderAttachments()

    await tray.choose(photo())
    expect(states()).toEqual(['uploading'])
    expect(tray.pending).toHaveLength(1)
    expect(tray.pending[0].purpose).toBe('conversation_attachment')

    await tray.pending[0].pass()
    expect(states()).toEqual(['ready'])

    const batch = tray.take()
    expect(batch?.references).toEqual([{ uploadId: 'up-1' }])
    expect(batch?.attachments).toMatchObject([{ id: 'up-1', filename: 'exercise.png', mimeType: 'image/png', status: 'uploaded' }])
    // Taking is not sending: the tray holds the file until the message is out.
    expect(states()).toEqual(['ready'])

    act(() => batch?.sent())
    expect(rows()).toEqual([])
  })

  it('goes up as the purpose it was asked for', async () => {
    const tray = renderAttachments({ purpose: 'help_reply_image', imagesOnly: true }, { copy: 'teacher' })

    await tray.choose(photo())

    expect(tray.pending[0].purpose).toBe('help_reply_image')
  })

  it('takes nothing when nothing was chosen (the negative control)', () => {
    const tray = renderAttachments()

    const batch = tray.take()

    expect(batch?.references).toEqual([])
    expect(batch?.attachments).toEqual([])
  })

  it('sent: takes only the files the message carried; one that failed stays with its reason', async () => {
    const tray = renderAttachments()
    await tray.choose([photo('a.png'), photo('b.png')])
    await tray.pending[0].pass()
    await tray.pending[1].fail(new ApiError('down', { status: 503, code: 'upload_service_unavailable' }))
    const batch = tray.take()
    expect(batch?.references).toEqual([{ uploadId: 'up-1' }])

    // Chosen after the message took its files: not part of it.
    await tray.choose(photo('c.png'))
    await tray.pending[2].pass()
    act(() => batch?.sent())

    expect(rows().map((row) => row.textContent)).toEqual([
      expect.stringContaining('b.png'),
      expect.stringContaining('c.png'),
    ])
    expect(states()).toEqual(['failed', 'ready'])
    expect(screen.getByRole('alert')).toHaveTextContent(chat.ask.attachments.errors.unavailable)
  })

  it('refused: marks each file the message carried to be chosen again, and leaves the rest', async () => {
    const tray = renderAttachments()
    await tray.choose(photo('a.png'))
    await tray.pending[0].pass()
    const batch = tray.take()
    await tray.choose(photo('b.png'))
    await tray.pending[1].pass()

    act(() => batch?.refused())

    expect(states()).toEqual(['failed', 'ready'])
    expect(screen.getByRole('alert')).toHaveTextContent(chat.ask.attachments.errors.expired)
    // Chosen again, it is a new upload; the refused one is never sent again.
    expect(tray.take()?.references).toEqual([{ uploadId: 'up-2' }])
  })

  it('is not taken while a file is still going up', async () => {
    const tray = renderAttachments()
    await tray.choose([photo('a.png'), photo('b.png')])
    await tray.pending[0].pass()

    expect(tray.hook().busy).toBe(true)
    expect(tray.take()).toBeNull()

    await tray.pending[1].pass()
    expect(tray.hook().busy).toBe(false)
    expect(tray.take()?.references).toEqual([{ uploadId: 'up-1' }, { uploadId: 'up-2' }])
  })

  it('takes a file back out, and stops its upload', async () => {
    const tray = renderAttachments()
    await tray.choose(photo())
    const { signal } = tray.pending[0]

    await userEvent.click(screen.getByRole('button', { name: 'Remove exercise.png' }))

    expect(signal.aborted).toBe(true)
    expect(rows()).toEqual([])
    expect(tray.take()?.references).toEqual([])
  })

  it('stops every upload still going when it is closed', async () => {
    const tray = renderAttachments()
    await tray.choose([photo('a.png'), photo('b.png')])
    await tray.pending[0].pass()
    await waitFor(() => expect(tray.pending).toHaveLength(2))

    tray.unmount()

    expect(tray.pending[1].signal.aborted).toBe(true)
  })

  it('leaves an upload that is still wanted going (the negative control)', async () => {
    const tray = renderAttachments()
    await tray.choose([photo('a.png'), photo('b.png')])
    await waitFor(() => expect(tray.pending).toHaveLength(2))

    await userEvent.click(screen.getByRole('button', { name: 'Remove a.png' }))

    expect(tray.pending[0].signal.aborted).toBe(true)
    expect(tray.pending[1].signal.aborted).toBe(false)
  })
})

describe('a file past its time', () => {
  it('holds the message, and says to choose the file again, within two minutes of its upload’s end (#507)', async () => {
    const tray = renderAttachments()
    await tray.choose(photo())
    await tray.pending[0].pass({ expiresAt: minutesFromNow(1.9) })

    expect(tray.take()).toBeNull()

    expect(states()).toEqual(['failed'])
    expect(screen.getByRole('alert')).toHaveTextContent(chat.ask.attachments.errors.expired)
    // Chosen again or taken out; until then, nothing more is held.
    expect(tray.take()?.references).toEqual([])
  })

  it('goes with the message while it has more than two minutes left (the negative control)', async () => {
    const tray = renderAttachments()
    await tray.choose(photo())
    await tray.pending[0].pass({ expiresAt: minutesFromNow(2.5) })

    expect(tray.take()?.references).toEqual([{ uploadId: 'up-1' }])
    expect(states()).toEqual(['ready'])
  })
})

describe('more files than a message carries', () => {
  it(`keeps the first ${ATTACHMENTS_PER_MESSAGE}, and says the rest were left out`, async () => {
    const tray = renderAttachments()

    await tray.choose(Array.from({ length: ATTACHMENTS_PER_MESSAGE + 1 }, (_, index) => photo(`p${index}.png`)))

    expect(rows()).toHaveLength(ATTACHMENTS_PER_MESSAGE)
    expect(tray.pending).toHaveLength(ATTACHMENTS_PER_MESSAGE)
    expect(screen.getByRole('alert')).toHaveTextContent(
      chat.ask.attachments.errors.tooMany.replace('{{count}}', String(ATTACHMENTS_PER_MESSAGE)),
    )
  })

  it(`takes all ${ATTACHMENTS_PER_MESSAGE} without a word (the negative control)`, async () => {
    const tray = renderAttachments()

    await tray.choose(Array.from({ length: ATTACHMENTS_PER_MESSAGE }, (_, index) => photo(`p${index}.png`)))

    expect(rows()).toHaveLength(ATTACHMENTS_PER_MESSAGE)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('a file that cannot be sent', () => {
  it('is refused before it goes when it is a kind the backend would refuse', async () => {
    const tray = renderAttachments()

    await tray.choose(new File(['x'], 'notes.key', { type: 'application/octet-stream' }))

    expect(tray.pending).toHaveLength(0)
    expect(states()).toEqual(['failed'])
    expect(screen.getByRole('alert')).toHaveTextContent(chat.ask.attachments.errors.unsupported)
  })

  it('takes a document for a question, as it is, unprepared (the negative control)', async () => {
    const tray = renderAttachments()
    const document = pdf()

    await tray.choose(document)

    expect(tray.pending).toHaveLength(1)
    expect(tray.pending[0].file).toBe(document)
    expect(prepareMock).not.toHaveBeenCalled()
  })

  it('refuses a photo over the 30 MB the browser will open, before it is opened', async () => {
    const tray = renderAttachments()
    const big = photo('scan.png')
    Object.defineProperty(big, 'size', { value: 30 * 1024 * 1024 + 1 })

    await tray.choose(big)

    expect(screen.getByRole('alert')).toHaveTextContent(/Photos may be up to 30 MB/)
    expect(prepareMock).not.toHaveBeenCalled()
    expect(tray.pending).toHaveLength(0)
  })

  it('lets a photo over the backend’s 10 MB through, since it is shrunk first (#508)', async () => {
    prepareMock.mockResolvedValueOnce(new File([new Uint8Array(4096)], 'scan.jpg', { type: 'image/jpeg' }))
    const tray = renderAttachments()
    const large = photo('scan.png')
    Object.defineProperty(large, 'size', { value: 30 * 1024 * 1024 })

    await tray.choose(large)

    expect(prepareMock.mock.calls[0][0]).toBe(large)
    expect(tray.pending[0].file).toMatchObject({ name: 'scan.jpg', type: 'image/jpeg', size: 4096 })
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('says a photo the browser could not open in its own words (#508)', async () => {
    prepareMock.mockRejectedValueOnce(new ImagePreparationError('exercise.png could not be opened.'))
    const tray = renderAttachments()

    await tray.choose(photo())

    expect(screen.getByRole('alert')).toHaveTextContent(chat.ask.attachments.errors.unreadable)
    expect(tray.pending).toHaveLength(0)
  })

  it('does not call a photo that came out of shrinking over the limit "too big" (#508)', async () => {
    const over = new File([new Uint8Array(8)], 'exercise.jpg', { type: 'image/jpeg' })
    Object.defineProperty(over, 'size', { value: 10 * 1024 * 1024 + 1 })
    prepareMock.mockResolvedValueOnce(over)
    const tray = renderAttachments()

    await tray.choose(photo())

    expect(screen.getByRole('alert')).toHaveTextContent(chat.ask.attachments.errors.failed)
    expect(tray.pending).toHaveLength(0)
  })

  it('is refused before it goes when only photos may go and it is not one', async () => {
    const tray = renderAttachments({ purpose: 'help_reply_image', imagesOnly: true }, { copy: 'teacher' })

    await tray.choose(pdf())

    expect(tray.pending).toHaveLength(0)
    expect(screen.getByRole('alert')).toHaveTextContent(teacher.reply.attachments.errors.unsupported)
    expect(picker()).toHaveAttribute('accept', expect.not.stringContaining('.pdf'))
  })

  it.each([
    ['upload_content_blocked', chat.ask.attachments.errors.blocked],
    ['upload_too_large', 'This file is too big.'],
    ['upload_expired', chat.ask.attachments.errors.expired],
    ['storage_quota_exceeded', chat.ask.attachments.errors.quota],
    ['something_new', chat.ask.attachments.errors.failed],
  ])('says the upload API’s %s in its own sentence, never the server’s', async (code, sentence) => {
    const tray = renderAttachments()
    await tray.choose(photo())

    await tray.pending[0].fail(new ApiError('The server’s own English.', { status: 422, code }))

    expect(states()).toEqual(['failed'])
    expect(screen.getByRole('alert')).toHaveTextContent(sentence)
    expect(screen.queryByText(/The server’s own English/)).toBeNull()
    expect(tray.take()?.references).toEqual([])
  })
})

describe('photos chosen together', () => {
  it('are prepared one at a time, so a phone holds one in memory', async () => {
    const finish: Array<() => void> = []
    prepareMock.mockImplementation((file: File) => new Promise<File>((resolve) => finish.push(() => resolve(file))))
    const tray = renderAttachments()

    await tray.choose([photo('a.png'), photo('b.png'), photo('c.png')])
    await waitFor(() => expect(prepareMock).toHaveBeenCalledTimes(1))
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(prepareMock).toHaveBeenCalledTimes(1)

    finish[0]()
    await waitFor(() => expect(prepareMock).toHaveBeenCalledTimes(2))
    expect(prepareMock.mock.calls[1][0].name).toBe('b.png')
    finish[1]()
    await waitFor(() => expect(prepareMock).toHaveBeenCalledTimes(3))
    finish[2]()
    await waitFor(() => expect(tray.pending).toHaveLength(3))
  })

  it('go on to the next when one cannot be prepared', async () => {
    prepareMock.mockRejectedValueOnce(new ImagePreparationError('a.png could not be opened.'))
    const tray = renderAttachments()

    await tray.choose([photo('a.png'), photo('b.png')])

    await waitFor(() => expect(tray.pending).toHaveLength(1))
    expect(tray.pending[0].file.name).toBe('b.png')
  })

  it('are named as they went up: an iPhone’s HEIC is the JPEG made of it (#508)', async () => {
    prepareMock.mockResolvedValueOnce(new File([new Uint8Array(4096)], 'IMG_0001.jpg', { type: 'image/jpeg' }))
    const tray = renderAttachments()

    await tray.choose(new File([new Uint8Array(2048)], 'IMG_0001.HEIC', { type: 'image/heic' }))
    expect(tray.pending[0].file).toMatchObject({ name: 'IMG_0001.jpg', type: 'image/jpeg' })
    await tray.pending[0].pass()

    expect(rows()[0]).toHaveTextContent('IMG_0001.jpg')
    expect(tray.take()?.attachments).toMatchObject([{ filename: 'IMG_0001.jpg', mimeType: 'image/jpeg', sizeBytes: 4096 }])
  })

  it('leave one taken out while it waited its turn unopened', async () => {
    const finish: Array<() => void> = []
    prepareMock.mockImplementation((file: File) => new Promise<File>((resolve) => finish.push(() => resolve(file))))
    const tray = renderAttachments()

    await tray.choose([photo('a.png'), photo('b.png'), photo('c.png')])
    await waitFor(() => expect(prepareMock).toHaveBeenCalledTimes(1))
    await userEvent.click(screen.getByRole('button', { name: 'Remove b.png' }))
    finish[0]()

    await waitFor(() => expect(prepareMock).toHaveBeenCalledTimes(2))
    expect(prepareMock.mock.calls.map(([file]) => file.name)).toEqual(['a.png', 'c.png'])
  })
})

describe('a photo from the phone', () => {
  const CODE_ID = 'a1'.repeat(16)
  const UPLOAD_ID = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:phone-photo')
    URL.revokeObjectURL = vi.fn()
    vi.mocked(createUploadCode).mockResolvedValue({
      codeId: CODE_ID, code: `${CODE_ID}.${'s'.repeat(43)}`, expiresAt: minutesFromNow(10), uploadId: UPLOAD_ID,
    })
    vi.mocked(readUploadCode).mockResolvedValue({
      codeId: CODE_ID, status: 'ready', expiresAt: minutesFromNow(9), redeemedAt: new Date().toISOString(), uploadId: 'up-phone',
    })
    vi.mocked(readUploadCodePhoto).mockResolvedValue(new Blob([new Uint8Array(3000)], { type: 'image/jpeg' }))
  })

  async function addFromPhone(tray: ReturnType<typeof renderAttachments>) {
    act(() => tray.hook().sources.usePhone?.())
    const card = await screen.findByRole('region', { name: chat.ask.phone.label })
    await within(card).findByRole('img', { name: chat.ask.phone.photoAlt })
    await userEvent.click(within(card).getByRole('button', { name: chat.ask.phone.add }))
  }

  it('joins the tray ready, once the student adds it, and goes with the message', async () => {
    const tray = renderAttachments({ phone: 'c1' })

    await addFromPhone(tray)

    expect(states()).toEqual(['ready'])
    expect(screen.queryByRole('region', { name: chat.ask.phone.label })).toBeNull()
    expect(tray.take()?.references).toEqual([{ uploadId: 'up-phone' }])
  })

  it('joins only once, however often it is added', async () => {
    const tray = renderAttachments({ phone: 'c1' })

    await addFromPhone(tray)
    await addFromPhone(tray)

    expect(states()).toEqual(['ready'])
  })

  it('is left out, and said, when the tray is full', async () => {
    const tray = renderAttachments({ phone: 'c1' })
    await tray.choose(Array.from({ length: ATTACHMENTS_PER_MESSAGE }, (_, index) => photo(`p${index}.png`)))
    expect(screen.queryByRole('alert')).toBeNull()

    await addFromPhone(tray)

    expect(rows()).toHaveLength(ATTACHMENTS_PER_MESSAGE)
    expect(screen.getByRole('alert')).toHaveTextContent(
      chat.ask.attachments.errors.tooMany.replace('{{count}}', String(ATTACHMENTS_PER_MESSAGE)),
    )
  })
})

describe('the ways to add a file', () => {
  it('on a computer: the chooser and the phone, no camera', () => {
    const tray = renderAttachments({ camera: true, phone: 'c1' })
    const { sources } = tray.hook()

    expect(sources.pickFile).toBeInstanceOf(Function)
    expect(sources.takePhoto).toBeUndefined()
    expect(sources.usePhone).toBeInstanceOf(Function)
  })

  it('on a touch screen: the chooser and the camera, no phone', () => {
    emulate({ touch: true })
    const tray = renderAttachments({ camera: true, phone: 'c1' })
    const { sources } = tray.hook()

    expect(sources.takePhoto).toBeInstanceOf(Function)
    expect(sources.usePhone).toBeUndefined()
  })

  it('offers the phone for a new question too: its code belongs to no conversation (#554)', () => {
    const tray = renderAttachments({ camera: true, phone: null })

    expect(tray.hook().sources.usePhone).toBeInstanceOf(Function)
  })

  it('for a teacher’s reply: the chooser only, off a touch screen', () => {
    const tray = renderAttachments({ purpose: 'help_reply_image', imagesOnly: true, camera: false, phone: false }, { copy: 'teacher' })
    const { sources } = tray.hook()

    expect(sources.pickFile).toBeInstanceOf(Function)
    expect(sources.takePhoto).toBeUndefined()
    expect(sources.usePhone).toBeUndefined()
  })

  it('for a teacher’s reply: the chooser only, on a touch screen too', () => {
    emulate({ touch: true })
    const tray = renderAttachments({ purpose: 'help_reply_image', imagesOnly: true, camera: false, phone: false }, { copy: 'teacher' })
    const { sources } = tray.hook()

    expect(sources.pickFile).toBeInstanceOf(Function)
    expect(sources.takePhoto).toBeUndefined()
    expect(sources.usePhone).toBeUndefined()
    expect(camera()).toBeNull()
  })

  it('open the chooser and the camera they name', () => {
    emulate({ touch: true })
    const tray = renderAttachments({ camera: true, phone: 'c1' })
    const pickerClick = vi.spyOn(picker(), 'click').mockImplementation(() => {})
    const cameraClick = vi.spyOn(camera()!, 'click').mockImplementation(() => {})

    tray.hook().sources.pickFile()
    expect(pickerClick).toHaveBeenCalledTimes(1)
    expect(cameraClick).not.toHaveBeenCalled()
    tray.hook().sources.takePhoto?.()
    expect(cameraClick).toHaveBeenCalledTimes(1)
  })

  it('takes the photo the camera took into the tray', async () => {
    emulate({ touch: true })
    const tray = renderAttachments({ camera: true, phone: 'c1' })

    await userEvent.upload(camera()!, new File([new Uint8Array(2048)], 'image.jpg', { type: 'image/jpeg' }))

    await waitFor(() => expect(tray.pending).toHaveLength(1))
    expect(tray.pending[0].file.name).toBe('image.jpg')
  })
})

describe('a teacher’s reply', () => {
  it('says a picture alone is not a reply yet, once one is ready', async () => {
    const tray = renderAttachments({ purpose: 'help_reply_image', imagesOnly: true }, { copy: 'teacher', needsText: true })
    await tray.choose(photo())
    expect(screen.queryByText(teacher.reply.attachments.needsText)).toBeNull()

    await tray.pending[0].pass()

    expect(screen.getByText(teacher.reply.attachments.needsText)).toBeInTheDocument()
  })
})

describe('an upload that is gone', () => {
  it('is what the server says when an upload a message carried is past its time, or already sent', () => {
    expect(isUploadGone(new ApiError('gone', { status: 422, code: 'upload_expired' }))).toBe(true)
    expect(isUploadGone(new ApiError('gone', { status: 404, code: 'upload_not_found' }))).toBe(true)
  })

  it('is nothing else: another code, no code, or not the server at all (the negative control)', () => {
    expect(isUploadGone(new ApiError('blocked', { status: 422, code: 'upload_content_blocked' }))).toBe(false)
    expect(isUploadGone(new ApiError('missing', { status: 404 }))).toBe(false)
    expect(isUploadGone(new Error('upload_expired'))).toBe(false)
  })
})

describe('reset', () => {
  it('empties the tray and stops what is still going up (#564)', async () => {
    const tray = renderAttachments()
    await tray.choose([photo('a.png'), photo('b.png')])
    await tray.pending[0].pass()
    expect(states()).toEqual(['ready', 'uploading'])

    act(() => tray.hook().reset())

    expect(rows()).toEqual([])
    expect(tray.pending[1].signal.aborted).toBe(true)
    expect(tray.take()?.references).toEqual([])
  })
})
