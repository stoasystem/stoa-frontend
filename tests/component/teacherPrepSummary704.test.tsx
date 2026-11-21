/**
 * #704: the teacher's help-request page opens with a preparation table.
 *
 * Nothing on it is generated, and the page asks the backend for no summary
 * (`assistance-summary`, `ai-tools/summary-draft`, both to be removed in
 * stoa-backend#518) and no AI tool at all: the exercise draft card
 * (stoa-backend#519) is not put back, since "Recommend practice" (#703) on
 * this page already gives the student exercises (decided 2026-11-20). The table's rows come as the backend picked them
 * (stoa-backend#517): the first question, the last one before asking for
 * help (`null` when it is the first, then one row), everything uploaded, and
 * the stars the Ask answers named (none, no row). The whole conversation is
 * folded under it, and a question's "show in conversation" opens it on that
 * message.
 */
import type { AxiosAdapter } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import de from '@/i18n/locales/de/teacher.json'
import en from '@/i18n/locales/en/teacher.json'
import fr from '@/i18n/locales/fr/teacher.json'
import italian from '@/i18n/locales/it/teacher.json'
import { TeacherHelpRequestDetailPage } from '@/pages/teacher/TeacherHelpRequestDetailPage'
import { httpClient } from '@/services/api/httpClient'
import { getTeacherHelpRequestDetail } from '@/services/teacher/teacherApi'
import type { TeacherHelpRequestDetail, TeacherPrepQuestion } from '@/types/teacher'
import type { AttachmentSummary } from '@/types/file'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/services/teacher/teacherApi', async (orig) => ({
  ...(await orig<typeof import('@/services/teacher/teacherApi')>()),
  getTeacherHelpRequestDetail: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

const prep = de.prep

const messages: TeacherHelpRequestDetail['messages'] = [
  { id: 'm0', conversationId: 'c1', role: 'student', content: 'Wie kürze ich 18/24?', createdAt: '2026-11-16T09:00:00Z' },
  { id: 'm1', conversationId: 'c1', role: 'assistant', content: 'Teile durch 6.', createdAt: '2026-11-16T09:01:00Z' },
  { id: 'm2', conversationId: 'c1', role: 'student', content: 'Und 15/25?', createdAt: '2026-11-16T09:02:00Z' },
  { id: 'm3', conversationId: 'c1', role: 'student', content: 'Nach der Anfrage geschrieben', createdAt: '2026-11-16T09:05:00Z' },
]

function upload(overrides: Partial<AttachmentSummary> = {}): AttachmentSummary {
  return {
    attachmentId: 'att-1',
    filename: 'heft.png',
    mediaType: 'image/png',
    sizeBytes: 1200,
    status: 'active',
    createdAt: '2026-11-16T09:00:00Z',
    ...overrides,
  }
}

function question(messageId: string, content: string, attachments: AttachmentSummary[] = []): TeacherPrepQuestion {
  return { messageId, content, createdAt: '2026-11-16T09:00:00Z', attachments }
}

function detail(overrides: Partial<TeacherHelpRequestDetail> = {}): TeacherHelpRequestDetail {
  return {
    requestId: 'r1',
    conversationId: 'c1',
    student: { id: 's1', name: 'Lea Muster', grade: '8' },
    subject: 'mathematics',
    status: 'in_progress',
    requestMessage: 'Bitte um Hilfe',
    messages,
    notes: [],
    firstQuestion: question('m0', 'Wie kürze ich 18/24?', [upload()]),
    lastQuestion: question('m2', 'Und 15/25?'),
    uploads: [upload(), upload({ attachmentId: 'att-2', filename: 'skizze.png' })],
    askedStars: [
      { unitId: 'u-kuerzen', title: 'Brüche kürzen' },
      { unitId: 'u-ggt', title: 'Grösster gemeinsamer Teiler' },
    ],
    ...overrides,
  }
}

/** Every URL the page sends through the API client. */
const sent: string[] = []
let adapter: AxiosAdapter | undefined

beforeEach(async () => {
  vi.clearAllMocks()
  sent.length = 0
  adapter = httpClient.defaults.adapter as AxiosAdapter | undefined
  httpClient.defaults.adapter = (config) => {
    sent.push(config.url ?? '')
    return new Promise(() => {})
  }
  await i18n.changeLanguage('de')
})

afterEach(() => {
  httpClient.defaults.adapter = adapter
})

function openDetail(request: TeacherHelpRequestDetail) {
  vi.mocked(getTeacherHelpRequestDetail).mockResolvedValue(request)
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/teacher/requests/r1']}>
          <Routes><Route path="/teacher/requests/:requestId" element={<TeacherHelpRequestDetailPage />} /></Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

async function prepTable() {
  return (await screen.findByRole('region', { name: prep.title })) as HTMLElement
}

function row(table: HTMLElement, name: string) {
  return table.querySelector(`[data-prep-row="${name}"]`) as HTMLElement | null
}

function conversation() {
  return document.querySelector('details[data-conversation]') as HTMLDetailsElement
}

describe('the preparation table (#704)', () => {
  it('asks the backend for no generated summary and no AI tools', async () => {
    openDetail(detail())
    await prepTable()
    // The client is watched: the page's other read goes through it.
    await waitFor(() => expect(sent).toContain('/practice/curriculum/catalog'))
    expect(sent.some((url) => url.includes('assistance-summary'))).toBe(false)
    expect(sent.some((url) => url.includes('ai-tools'))).toBe(false)
    expect(screen.queryByRole('button', { name: /Entwurf/ })).toBeNull()
  })

  it('shows the first and the last question as the backend picked them', async () => {
    openDetail(detail())
    const table = await prepTable()
    const first = row(table, 'first')!
    const last = row(table, 'last')!
    expect(within(first).getByText(prep.firstQuestion)).toBeInTheDocument()
    expect(within(first).getByText('Wie kürze ich 18/24?')).toBeInTheDocument()
    // Its picture is drawn once, under uploads; here it is counted.
    expect(within(first).getByText('1 Anhang')).toBeInTheDocument()
    expect(within(last).getByText(prep.lastQuestion)).toBeInTheDocument()
    expect(within(last).getByText('Und 15/25?')).toBeInTheDocument()
    // Sent after the request for help: not the last question, and the page does not pick its own.
    expect(within(table).queryByText('Nach der Anfrage geschrieben')).toBeNull()
    expect(within(table).queryByText('Teile durch 6.')).toBeNull()
  })

  it('is one row when the last question is the first', async () => {
    openDetail(detail({ lastQuestion: null }))
    const table = await prepTable()
    expect(within(row(table, 'first')!).getByText(prep.question)).toBeInTheDocument()
    expect(row(table, 'last')).toBeNull()
    expect(within(table).queryByText(prep.firstQuestion)).toBeNull()
  })

  it('says so when the student asked no question, and picks none out of the messages', async () => {
    openDetail(detail({ firstQuestion: null, lastQuestion: null }))
    const table = await prepTable()
    expect(within(row(table, 'first')!).getByText(prep.noQuestion)).toBeInTheDocument()
    expect(row(table, 'last')).toBeNull()
    expect(within(table).queryByText('Wie kürze ich 18/24?')).toBeNull()
  })

  it('shows every upload, and says none when there is none', async () => {
    openDetail(detail())
    const table = await prepTable()
    const uploads = row(table, 'uploads')!
    expect(within(uploads).getByText(prep.uploads)).toBeInTheDocument()
    expect(within(uploads).getByRole('list', { name: de.detail.attachments.label }).children).toHaveLength(2)
    expect(within(uploads).queryByText(prep.noUploads)).toBeNull()
  })

  it('says there are no uploads', async () => {
    openDetail(detail({ uploads: [] }))
    const table = await prepTable()
    expect(within(row(table, 'uploads')!).getByText(prep.noUploads)).toBeInTheDocument()
  })

  it('names the related stars as served, newest first, and leaves the row out with none', async () => {
    openDetail(detail())
    const table = await prepTable()
    const stars = within(row(table, 'stars')!).getAllByRole('listitem').map((item) => item.textContent)
    expect(stars).toEqual(['Brüche kürzen', 'Grösster gemeinsamer Teiler'])
  })

  it('has no star row without stars', async () => {
    openDetail(detail({ askedStars: [] }))
    const table = await prepTable()
    expect(row(table, 'stars')).toBeNull()
    expect(within(table).queryByText(prep.stars)).toBeNull()
  })

  it('reads an older request without the table fields', async () => {
    const older = detail()
    delete older.firstQuestion
    delete older.lastQuestion
    delete older.uploads
    delete older.askedStars
    openDetail(older)
    const table = await prepTable()
    expect(within(row(table, 'first')!).getByText(prep.noQuestion)).toBeInTheDocument()
    expect(within(row(table, 'uploads')!).getByText(prep.noUploads)).toBeInTheDocument()
    expect(row(table, 'stars')).toBeNull()
  })
})

describe('the conversation under it (#704)', () => {
  it('is folded, and says how many messages it holds', async () => {
    openDetail(detail())
    await prepTable()
    expect(conversation().open).toBe(false)
    expect(within(conversation()).getByText('Ganzes Gespräch (4 Nachrichten)')).toBeInTheDocument()
  })

  it('opens on the message a question leads to', async () => {
    openDetail(detail())
    const table = await prepTable()
    fireEvent.click(within(row(table, 'last')!).getByRole('button', { name: prep.showInConversation }))
    await waitFor(() => expect(conversation().open).toBe(true))
    const message = document.getElementById('help-message-m2')!
    expect(message).toHaveTextContent('Und 15/25?')
    await waitFor(() => expect(message).toHaveFocus())
    expect(message).toHaveAttribute('data-shown-message', 'true')
  })
})

describe('copy (#704)', () => {
  it('has the table in all four languages, and nothing of the generated summary', () => {
    const keys = Object.keys(de.prep).sort()
    for (const [language, bundle] of Object.entries({ en, fr, it: italian })) {
      const own = Object.keys(bundle.prep).filter((key) => !key.endsWith('_many')).sort()
      expect(own, language).toEqual(keys)
    }
    for (const [language, bundle] of Object.entries({ de, en, fr, it: italian })) {
      expect('assistance' in bundle, language).toBe(false)
      expect('aiTools' in bundle, language).toBe(false)
      expect(bundle.detail.conversation_one, language).toContain('{{count}}')
      expect(bundle.detail.conversation_other, language).toContain('{{count}}')
    }
  })
})
