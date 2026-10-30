/**
 * #513: a teacher's reply can carry pictures (stoa-backend#145).
 *
 * T1 - a picture goes up as soon as it is chosen, as `help_reply_image`, and
 *      the reply names it as `{uploadId}`; a reply without one sends no
 *      `attachmentIds` at all.
 * T2 - only photos go: anything else is refused before it goes, in the
 *      teacher's own words (Sie), never the server's; a picture moderation
 *      turns down is said as one.
 * T3 - the reply waits for its pictures, and still needs words: pictures alone
 *      are not a reply the backend takes.
 * T4 - the server would not take a picture the reply carried: nothing was
 *      sent, it says so, and the picture is to be chosen again.
 * T5 - the button waits for the same switch as the student's (#512).
 * T6 - the teacher sees the pictures in the reply afterwards, named as theirs.
 * T7 - the sentences are there in all four languages, formal, with ss.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TeacherReplyComposer } from '@/components/teacher/TeacherReplyComposer'
import { TeacherRequestTimeline } from '@/components/teacher/TeacherRequestTimeline'
import i18n from '@/i18n'
import de from '@/i18n/locales/de/teacher.json'
import en from '@/i18n/locales/en/teacher.json'
import fr from '@/i18n/locales/fr/teacher.json'
import italian from '@/i18n/locales/it/teacher.json'
import { TeacherHelpRequestDetailPage } from '@/pages/teacher/TeacherHelpRequestDetailPage'
import { ApiError, httpClient } from '@/services/api/httpClient'
import { uploadFile } from '@/services/files/fileApi'
import type { AttachmentProblem } from '@/services/files/attachmentProblems'
import * as teacherApi from '@/services/teacher/teacherApi'
import type { AttachmentSummary } from '@/types/file'
import type { TeacherHelpRequestNote } from '@/types/teacher'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/services/teacher/teacherApi', async (orig) => ({
  ...(await orig<typeof import('@/services/teacher/teacherApi')>()),
  getTeacherHelpRequestDetail: vi.fn(),
  addTeacherHelpRequestNote: vi.fn(),
  getTeacherHelpRequestAttachment: vi.fn(),
  getTeacherAssistanceSummary: vi.fn(() => new Promise(() => {})),
}))
vi.mock('@/hooks/practice/useCurriculumCatalogQuery', () => ({
  useCurriculumCatalogQuery: () => ({ data: undefined, isLoading: false, isError: false }),
}))
vi.mock('@/services/files/fileApi', async (orig) => ({
  ...(await orig<typeof import('@/services/files/fileApi')>()),
  uploadFile: vi.fn(),
}))
// jsdom draws nothing: what a photo becomes is prepareImage508's.
vi.mock('@/services/files/prepareImage', async (orig) => ({
  ...(await orig<typeof import('@/services/files/prepareImage')>()),
  prepareImage: vi.fn(async (file: File) => file),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))
// Off in the app until #512; the page tests turn it on.
let attachmentsWork = false
vi.mock('@/features/ask/attachmentsSwitch', () => ({
  get ATTACHMENTS_WORK() {
    return attachmentsWork
  },
}))

const uploadMock = vi.mocked(uploadFile)
const noteMock = vi.mocked(teacherApi.addTeacherHelpRequestNote)
const detailMock = vi.mocked(teacherApi.getTeacherHelpRequestDetail)
const contentMock = vi.mocked(teacherApi.getTeacherHelpRequestAttachment)
const copy = de.reply.attachments

const photo = (name = 'tafel.png', type = 'image/png') => new File([new Uint8Array(2048)], name, { type })

function uploaded(uploadId: string, filename = 'tafel.png', expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()) {
  return { uploadId, expiresAt, filename, mimeType: 'image/png', sizeBytes: 2048 }
}

function renderComposer({ allowImages = true }: { allowImages?: boolean } = {}) {
  const onSubmit = vi.fn()
  render(
    <I18nextProvider i18n={i18n}>
      <TeacherReplyComposer isSubmitting={false} draftKey="r1" onSubmit={onSubmit} allowImages={allowImages} />
    </I18nextProvider>,
  )
  return {
    onSubmit,
    send: () => screen.getByRole('button', { name: de.reply.send }),
    type: (text: string) => fireEvent.change(screen.getByLabelText(de.reply.label), { target: { value: text } }),
  }
}

const picker = () => document.querySelector<HTMLInputElement>('input[data-teacher-reply-images]')!
const tray = () => screen.getByRole('list', { name: copy.label })

function detail() {
  return {
    requestId: 'r1', conversationId: 'c1', student: { id: 's1', name: 'Lea', grade: '8' },
    subject: 'mathematics', status: 'in_progress', messages: [], notes: [],
  } as never
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/teacher/requests/r1']}>
          <Routes><Route path="/teacher/requests/:requestId" element={<TeacherHelpRequestDetailPage />} /></Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

beforeEach(async () => {
  vi.clearAllMocks()
  sessionStorage.clear()
  attachmentsWork = false
  uploadMock.mockReset()
  await i18n.changeLanguage('de')
})

describe('T1: a picture goes with the reply', () => {
  it('goes up as the reply picture as soon as it is chosen, and the reply names its upload', async () => {
    uploadMock.mockResolvedValue(uploaded('up-1'))
    const composer = renderComposer()

    await userEvent.upload(picker(), photo())
    await waitFor(() => expect(uploadMock).toHaveBeenCalledTimes(1))
    expect(uploadMock.mock.calls[0]?.[0]).toMatchObject({ purpose: 'help_reply_image' })
    expect(within(tray()).getByText('tafel.png')).toBeInTheDocument()

    composer.type('Schau dir die Skizze an.')
    await waitFor(() => expect(composer.send()).toBeEnabled())
    fireEvent.click(composer.send())

    expect(composer.onSubmit).toHaveBeenCalledTimes(1)
    expect(composer.onSubmit.mock.calls[0]?.[3].references).toEqual([{ uploadId: 'up-1' }])
  })

  it('leaves the tray once the reply is sent', async () => {
    uploadMock.mockResolvedValue(uploaded('up-1'))
    const composer = renderComposer()
    composer.onSubmit.mockImplementation((_content, _rich, onSuccess: () => void) => onSuccess())

    await userEvent.upload(picker(), photo())
    composer.type('Schau dir die Skizze an.')
    await waitFor(() => expect(composer.send()).toBeEnabled())
    fireEvent.click(composer.send())

    expect(screen.queryByRole('list', { name: copy.label })).not.toBeInTheDocument()
  })

  it('sends the pictures from the page, and a reply without any sends no attachmentIds', async () => {
    const post = vi.spyOn(httpClient, 'post').mockResolvedValue({ data: { id: 'n1' } } as never)
    const real = await vi.importActual<typeof import('@/services/teacher/teacherApi')>('@/services/teacher/teacherApi')

    await real.addTeacherHelpRequestNote({ requestId: 'r1', content: 'Hallo', attachmentIds: [{ uploadId: 'up-1' }] })
    await real.addTeacherHelpRequestNote({ requestId: 'r1', content: 'Hallo' })

    expect(post.mock.calls[0]?.[0]).toBe('/teachers/me/help-requests/r1/notes')
    expect(post.mock.calls[0]?.[1]).toEqual({ content: 'Hallo', richContent: undefined, attachmentIds: [{ uploadId: 'up-1' }] })
    expect(post.mock.calls[1]?.[1]).not.toHaveProperty('attachmentIds')
    post.mockRestore()
  })
})

describe('T2: only photos, said in the teacher\'s words', () => {
  it('refuses a document before anything goes up', async () => {
    renderComposer()

    await userEvent.upload(picker(), new File(['%PDF'], 'blatt.pdf', { type: 'application/pdf' }), { applyAccept: false })

    expect(uploadMock).not.toHaveBeenCalled()
    expect(within(tray()).getByRole('alert')).toHaveTextContent(copy.errors.unsupported)
    expect(picker()).toHaveAttribute('accept', expect.not.stringContaining('.pdf'))
  })

  it('says a picture moderation turned down is one that cannot be sent', async () => {
    uploadMock.mockRejectedValue(new ApiError('blocked', { status: 422, code: 'upload_content_blocked' }))
    renderComposer()

    await userEvent.upload(picker(), photo())

    expect(await within(tray()).findByRole('alert')).toHaveTextContent(copy.errors.blocked)
  })
})

describe('T3: the reply waits for its pictures, and needs words', () => {
  it('cannot be sent while a picture is still going up', async () => {
    let finish: (value: ReturnType<typeof uploaded>) => void = () => undefined
    uploadMock.mockReturnValue(new Promise((resolve) => { finish = resolve }))
    const composer = renderComposer()
    composer.type('Schau dir die Skizze an.')

    await userEvent.upload(picker(), photo())
    expect(composer.send()).toBeDisabled()

    finish(uploaded('up-1'))
    await waitFor(() => expect(composer.send()).toBeEnabled())
  })

  it('says that a picture alone is not a reply yet', async () => {
    uploadMock.mockResolvedValue(uploaded('up-1'))
    const composer = renderComposer()

    await userEvent.upload(picker(), photo())

    expect(await screen.findByText(copy.needsText)).toBeInTheDocument()
    expect(composer.send()).toBeDisabled()
    composer.type('Schau dir die Skizze an.')
    expect(screen.queryByText(copy.needsText)).not.toBeInTheDocument()
  })

  it('holds a reply whose picture is past its time, and says to choose it again', async () => {
    uploadMock.mockResolvedValue(uploaded('up-1', 'tafel.png', new Date(Date.now() + 30 * 1000).toISOString()))
    const composer = renderComposer()
    await userEvent.upload(picker(), photo())
    composer.type('Schau dir die Skizze an.')
    await waitFor(() => expect(composer.send()).toBeEnabled())

    fireEvent.click(composer.send())

    expect(composer.onSubmit).not.toHaveBeenCalled()
    expect(within(tray()).getByRole('alert')).toHaveTextContent(copy.errors.expired)
  })
})

describe('T4: the server would not take a picture', () => {
  it('says the reply was not sent, and the picture is to be chosen again', async () => {
    attachmentsWork = true
    detailMock.mockResolvedValue(detail())
    noteMock.mockRejectedValue(new ApiError('gone', { status: 404, code: 'upload_not_found' }))
    uploadMock.mockResolvedValue(uploaded('up-1'))
    renderPage()

    await screen.findByLabelText(de.reply.label)
    await userEvent.upload(picker(), photo())
    fireEvent.change(await screen.findByLabelText(de.reply.label), { target: { value: 'Schau dir die Skizze an.' } })
    const send = screen.getByRole('button', { name: de.reply.send })
    await waitFor(() => expect(send).toBeEnabled())
    fireEvent.click(send)

    await waitFor(() => expect(noteMock).toHaveBeenCalledTimes(1))
    expect(noteMock.mock.calls[0]?.[0]).toMatchObject({ requestId: 'r1', attachmentIds: [{ uploadId: 'up-1' }] })
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(de.toasts.replyImagesExpired))
    expect(within(tray()).getByRole('alert')).toHaveTextContent(copy.errors.expired)
    // The words stay: only the picture is chosen again.
    expect(screen.getByLabelText(de.reply.label)).toHaveValue('Schau dir die Skizze an.')
  })

  it('leaves the picture alone when the reply failed for another reason', async () => {
    attachmentsWork = true
    detailMock.mockResolvedValue(detail())
    noteMock.mockRejectedValue(new ApiError('down', { status: 500 }))
    uploadMock.mockResolvedValue(uploaded('up-1'))
    renderPage()

    await screen.findByLabelText(de.reply.label)
    await userEvent.upload(picker(), photo())
    fireEvent.change(await screen.findByLabelText(de.reply.label), { target: { value: 'Schau dir die Skizze an.' } })
    const send = screen.getByRole('button', { name: de.reply.send })
    await waitFor(() => expect(send).toBeEnabled())
    fireEvent.click(send)

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(de.toasts.replyFailed))
    expect(within(tray()).queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('T5: the button waits for the switch', () => {
  it('is not on the page while the switch is off; the chooser it would open is', async () => {
    detailMock.mockResolvedValue(detail())
    renderPage()

    await screen.findByLabelText(de.reply.label)
    expect(screen.queryByRole('button', { name: copy.add })).not.toBeInTheDocument()
    expect(picker()).not.toBeNull()
  })

  it('opens the chooser once it is on', async () => {
    attachmentsWork = true
    detailMock.mockResolvedValue(detail())
    renderPage()

    const add = await screen.findByRole('button', { name: copy.add })
    const click = vi.spyOn(picker(), 'click')
    fireEvent.click(add)
    expect(click).toHaveBeenCalledTimes(1)
  })
})

describe('T6: the reply shows its pictures afterwards', () => {
  it('reads each through the request, named as the teacher\'s', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:test/1')
    URL.revokeObjectURL = vi.fn()
    contentMock.mockResolvedValue(new Blob(['png'], { type: 'image/png' }))
    const picture: AttachmentSummary = {
      attachmentId: 'att-9', filename: 'skizze.png', mediaType: 'image/png', sizeBytes: 2048,
      status: 'active', createdAt: '2026-10-30T10:00:00Z',
    }
    const note: TeacherHelpRequestNote = {
      id: 'n1', note: 'Schau dir die Skizze an.', createdAt: '2026-10-30T10:00:00Z',
      teacher: { id: 't1', name: 'Frau Keller' }, attachments: [picture],
    }
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>
          <TeacherRequestTimeline requestId="r1" notes={[note]} />
        </QueryClientProvider>
      </I18nextProvider>,
    )

    const open = await screen.findByRole('button', { name: de.detail.attachments.open.replace('{{name}}', 'skizze.png') })
    expect(within(open).getByRole('img')).toHaveAttribute('alt', de.detail.attachments.altTeacher.replace('{{name}}', 'skizze.png'))
    expect(contentMock).toHaveBeenCalledWith('r1', 'att-9')
  })
})

describe('T7: the sentences', () => {
  const problems: AttachmentProblem[] = [
    'tooLarge', 'unsupported', 'empty', 'expired', 'quota', 'unavailable', 'tooMany', 'unreadable', 'blocked', 'failed',
  ]
  const locales = { de, en, fr, it: italian }

  it.each(Object.entries(locales))('%s has every line the reply\'s pictures say', (_lang, locale) => {
    const lines = locale.reply.attachments
    for (const key of ['add', 'label', 'remove', 'uploading', 'uploadingFile', 'needsText'] as const) {
      expect(lines[key]).toBeTruthy()
    }
    for (const problem of problems) expect(lines.errors[problem]).toBeTruthy()
    expect(locale.toasts.replyImagesExpired).toBeTruthy()
    expect(locale.detail.attachments.altTeacher).toContain('{{name}}')
  })

  it('speaks to the teacher formally, and writes ss', () => {
    const german = JSON.stringify([de.reply.attachments, de.toasts.replyImagesExpired])
    expect(german).not.toMatch(/\b(du|dir|dich|dein\w*)\b|Wähl |Versuch es/)
    expect(german).toMatch(/\bSie\b/)
    expect(german).not.toContain('ß')
    expect(JSON.stringify(fr.reply.attachments)).not.toMatch(/\b(tu|te|ton|ta|tes)\b|Choisis|Réessaie/)
    expect(JSON.stringify(italian.reply.attachments)).not.toMatch(/\b(tu|ti)\b|Scegli |Riprova\b/)
  })
})
