/**
 * #510: the teacher sees the pictures the student sent in a help request.
 *
 * T1 - a picture is a thumbnail read with the teacher's token, named for a
 *      screen reader, and opens larger in a dialog the keyboard can close.
 * T2 - a message without files shows none, and reads none.
 * T3 - a picture this teacher may not read (403/404), one removed, or one the
 *      browser cannot draw is a placeholder, not an error, and is not asked
 *      for again; any other failure offers to load it again.
 * T4 - a picture is read once: not again with every poll of the request.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HelpRequestDetailCard } from '@/components/teacher/HelpRequestDetailCard'
import i18n from '@/i18n'
import de from '@/i18n/locales/de/teacher.json'
import en from '@/i18n/locales/en/teacher.json'
import fr from '@/i18n/locales/fr/teacher.json'
import italian from '@/i18n/locales/it/teacher.json'
import { ApiError } from '@/services/api/httpClient'
import * as teacherApi from '@/services/teacher/teacherApi'
import { teacherQueryKeys } from '@/services/teacher/teacherQueryKeys'
import type { AttachmentSummary } from '@/types/file'
import type { TeacherHelpMessage, TeacherHelpRequestDetail } from '@/types/teacher'

vi.mock('@/services/teacher/teacherApi', async (orig) => ({
  ...(await orig<typeof import('@/services/teacher/teacherApi')>()),
  getTeacherHelpRequestAttachment: vi.fn(),
}))

const mockedContent = vi.mocked(teacherApi.getTeacherHelpRequestAttachment)
const copy = de.detail.attachments
const named = (text: string, name: string) => text.replace('{{name}}', name)

function picture(overrides: Partial<AttachmentSummary> = {}): AttachmentSummary {
  return {
    attachmentId: 'att-1',
    filename: 'tafel.png',
    mediaType: 'image/png',
    sizeBytes: 2048,
    status: 'active',
    createdAt: '2026-10-28T10:00:00Z',
    ...overrides,
  }
}

function message(attachments?: AttachmentSummary[]): TeacherHelpMessage {
  return {
    id: 'm1',
    conversationId: 'c1',
    role: 'student',
    content: 'Ich verstehe Schritt 2 nicht.',
    createdAt: '2026-10-28T10:00:00Z',
    ...(attachments ? { attachments } : {}),
  }
}

function request(messages: TeacherHelpMessage[]): TeacherHelpRequestDetail {
  return {
    requestId: 'r1',
    conversationId: 'c1',
    student: { id: 's1', name: 'Lea', grade: '8' },
    subject: 'mathematics',
    status: 'in_progress',
    messages,
    notes: [],
  }
}

function renderCard(detail: TeacherHelpRequestDetail) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const view = render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <HelpRequestDetailCard request={detail} />
      </QueryClientProvider>
    </I18nextProvider>,
  )
  const rerender = (next: TeacherHelpRequestDetail) =>
    view.rerender(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>
          <HelpRequestDetailCard request={next} />
        </QueryClientProvider>
      </I18nextProvider>,
    )
  return { client, rerender }
}

const created: string[] = []
const revoked: string[] = []

beforeEach(async () => {
  vi.clearAllMocks()
  mockedContent.mockReset()
  created.length = 0
  revoked.length = 0
  // jsdom has no object URLs.
  URL.createObjectURL = vi.fn(() => {
    const url = `blob:test/${created.length + 1}`
    created.push(url)
    return url
  })
  URL.revokeObjectURL = vi.fn((url: string) => {
    revoked.push(url)
  })
  await i18n.changeLanguage('de')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('T1: a picture the student sent', () => {
  it('shows a named thumbnail read with this request and this file', async () => {
    mockedContent.mockResolvedValue(new Blob(['png'], { type: 'image/png' }))
    renderCard(request([message([picture()])]))

    const open = await screen.findByRole('button', { name: named(copy.open, 'tafel.png') })
    const thumbnail = within(open).getByRole('img')
    expect(thumbnail).toHaveAttribute('alt', named(copy.alt, 'tafel.png'))
    expect(thumbnail).toHaveAttribute('src', 'blob:test/1')
    expect(mockedContent).toHaveBeenCalledWith('r1', 'att-1')
    expect(screen.getByRole('list', { name: copy.label })).toBeInTheDocument()
  })

  it('opens larger with the keyboard, closes with Escape, and gives focus back', async () => {
    mockedContent.mockResolvedValue(new Blob(['png'], { type: 'image/png' }))
    renderCard(request([message([picture()])]))
    const open = await screen.findByRole('button', { name: named(copy.open, 'tafel.png') })

    open.focus()
    await userEvent.keyboard('{Enter}')
    const dialog = await screen.findByRole('dialog', { name: 'tafel.png' })
    const large = within(dialog).getByRole('img', { name: named(copy.alt, 'tafel.png') })
    expect(large).toHaveAttribute('src', 'blob:test/1')

    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(open).toHaveFocus()
  })

  it('lets the address go when the picture leaves the screen', async () => {
    mockedContent.mockResolvedValue(new Blob(['png'], { type: 'image/png' }))
    const { rerender } = renderCard(request([message([picture()])]))
    await screen.findByRole('button', { name: named(copy.open, 'tafel.png') })

    rerender(request([message()]))
    await waitFor(() => expect(revoked).toEqual(['blob:test/1']))
  })
})

describe('T2: a message without files', () => {
  it('shows no attachment list and reads nothing', () => {
    renderCard(request([message(), message([])]))
    expect(screen.getAllByText('Ich verstehe Schritt 2 nicht.').length).toBeGreaterThan(0)
    expect(screen.queryByRole('list', { name: copy.label })).toBeNull()
    expect(document.querySelector('[data-help-attachments]')).toBeNull()
    expect(mockedContent).not.toHaveBeenCalled()
  })
})

describe('T3: a picture the teacher cannot see', () => {
  it.each([403, 404])('is a placeholder on a %i, not an error, and is asked for once', async (status) => {
    mockedContent.mockRejectedValue(new ApiError('refused', { status }))
    const client = new QueryClient()
    render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>
          <HelpRequestDetailCard request={request([message([picture()])])} />
        </QueryClientProvider>
      </I18nextProvider>,
    )

    expect(await screen.findByText(copy.unavailable)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByRole('button', { name: copy.retry })).toBeNull()
    expect(screen.queryByRole('button', { name: named(copy.open, 'tafel.png') })).toBeNull()
    // The app's client retries; a refusal is not retried.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1_200))
    })
    expect(mockedContent).toHaveBeenCalledTimes(1)
  })

  it('is a placeholder for a removed picture, without reading it', async () => {
    renderCard(request([message([picture({ status: 'deleted' })])]))
    expect(screen.getByText(copy.unavailable)).toBeInTheDocument()
    expect(mockedContent).not.toHaveBeenCalled()
  })

  it('is a placeholder when the browser cannot draw what came back', async () => {
    mockedContent.mockResolvedValue(new Blob(['not a png'], { type: 'image/png' }))
    renderCard(request([message([picture()])]))
    const open = await screen.findByRole('button', { name: named(copy.open, 'tafel.png') })

    fireEvent.error(within(open).getByRole('img'))
    expect(await screen.findByText(copy.unavailable)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: named(copy.open, 'tafel.png') })).toBeNull()
  })

  it('offers to load it again after any other failure', async () => {
    mockedContent.mockRejectedValue(new ApiError('boom', { status: 500 }))
    renderCard(request([message([picture()])]))

    // After the one retry the app gives any read.
    expect(await screen.findByText(copy.failed, undefined, { timeout: 4_000 })).toBeInTheDocument()
    expect(mockedContent).toHaveBeenCalledTimes(2)
    expect(screen.queryByText(copy.unavailable)).toBeNull()

    mockedContent.mockResolvedValue(new Blob(['png'], { type: 'image/png' }))
    await userEvent.click(screen.getByRole('button', { name: named(copy.retryNamed, 'tafel.png') }))
    expect(await screen.findByRole('button', { name: named(copy.open, 'tafel.png') })).toBeInTheDocument()
    expect(mockedContent).toHaveBeenCalledTimes(3)
  })

  it('names a file that is not a picture, without reading it', () => {
    renderCard(request([message([picture({ filename: 'notizen.pdf', mediaType: 'application/pdf' })])]))
    expect(screen.getByText('notizen.pdf')).toBeInTheDocument()
    expect(screen.queryByRole('img')).toBeNull()
    expect(mockedContent).not.toHaveBeenCalled()
  })
})

describe('T4: a picture is read once', () => {
  it('is not read again when the request is polled or invalidated', async () => {
    mockedContent.mockResolvedValue(new Blob(['png'], { type: 'image/png' }))
    const { client, rerender } = renderCard(request([message([picture()])]))
    await screen.findByRole('button', { name: named(copy.open, 'tafel.png') })

    // A poll hands over a new copy of the same request.
    rerender(request([message([picture()])]))
    await act(async () => {
      await client.invalidateQueries({ queryKey: teacherQueryKeys.helpRequests() })
      await client.invalidateQueries({ queryKey: teacherQueryKeys.helpRequestDetail('r1') })
    })
    expect(mockedContent).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: named(copy.open, 'tafel.png') })).toBeInTheDocument()
  })

  it('is not read again when it leaves the screen and comes back', async () => {
    mockedContent.mockResolvedValue(new Blob(['png'], { type: 'image/png' }))
    const { rerender } = renderCard(request([message([picture()])]))
    await screen.findByRole('button', { name: named(copy.open, 'tafel.png') })

    rerender(request([message()]))
    rerender(request([message([picture()])]))
    expect(await screen.findByRole('button', { name: named(copy.open, 'tafel.png') })).toBeInTheDocument()
    expect(mockedContent).toHaveBeenCalledTimes(1)
  })
})

describe('copy', () => {
  it('has every line in all four languages, with the file name where it is named', () => {
    const keys = Object.keys(de.detail.attachments).sort()
    for (const locale of [en, fr, italian]) {
      expect(Object.keys(locale.detail.attachments).sort()).toEqual(keys)
    }
    for (const locale of [de, en, fr, italian]) {
      const lines = locale.detail.attachments
      for (const key of ['alt', 'open', 'retryNamed'] as const) expect(lines[key]).toContain('{{name}}')
      for (const key of ['label', 'loading', 'unavailable', 'failed', 'retry'] as const) {
        expect(lines[key]).not.toContain('{{')
      }
    }
    // German for Switzerland: no ß.
    expect(JSON.stringify(de.detail.attachments)).not.toContain('ß')
  })
})
