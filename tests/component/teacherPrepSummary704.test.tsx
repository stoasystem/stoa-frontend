/**
 * #704: the teacher's help-request page without the generated parts.
 *
 * The "AI teacher tools" card is gone, and the preparation summary is no
 * longer asked of the backend (`/teachers/questions/{id}/assistance-summary`):
 * it shows, fixed, the student's name and the student's first question, both
 * from the request the page has already read.
 */
import type { AxiosAdapter } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
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

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/services/teacher/teacherApi', async (orig) => ({
  ...(await orig<typeof import('@/services/teacher/teacherApi')>()),
  getTeacherHelpRequestDetail: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

type Message = { role: string; content: string }

function detail({ messages = [], requestMessage }: { messages?: Message[]; requestMessage?: string } = {}) {
  return {
    requestId: 'r1',
    conversationId: 'c1',
    student: { id: 's1', name: 'Lea Muster', grade: '8' },
    subject: 'mathematics',
    status: 'in_progress',
    requestMessage,
    messages: messages.map((message, index) => ({
      id: `m${index}`,
      conversationId: 'c1',
      createdAt: `2026-11-16T09:0${index}:00Z`,
      ...message,
    })),
    notes: [],
  } as never
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

function openDetail(request: unknown) {
  vi.mocked(getTeacherHelpRequestDetail).mockResolvedValue(request as never)
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

/** The preparation summary card, found by its title. */
async function summaryCard() {
  const title = await screen.findByText(de.assistance.title)
  return title.closest('[data-preparation-summary]') as HTMLElement
}

function block(card: HTMLElement, label: string) {
  return within(card).getByText(label).parentElement as HTMLElement
}

describe('the teacher help-request page (#704)', () => {
  it('shows no AI teacher tools', async () => {
    openDetail(detail({ messages: [{ role: 'student', content: 'Wie kürze ich 18/24?' }] }))
    await summaryCard()
    expect(screen.queryByText('KI-Werkzeuge für Lehrpersonen')).toBeNull()
    expect(screen.queryByRole('button', { name: /Entwurf/ })).toBeNull()
    expect(sent.some((url) => url.includes('ai-tools'))).toBe(false)
  })

  it('asks the backend for no assistance summary', async () => {
    openDetail(detail({ messages: [{ role: 'student', content: 'Wie kürze ich 18/24?' }] }))
    await summaryCard()
    // The client is watched: the page's other read goes through it.
    await waitFor(() => expect(sent).toContain('/practice/curriculum/catalog'))
    expect(sent.some((url) => url.includes('assistance-summary'))).toBe(false)
  })

  it('shows the student’s name and first message, nothing generated', async () => {
    openDetail(detail({
      requestMessage: 'Bitte um Hilfe',
      messages: [
        { role: 'assistant', content: 'Willkommen!' },
        { role: 'student', content: 'Wie kürze ich 18/24?' },
        { role: 'assistant', content: 'Teile durch 6.' },
        { role: 'student', content: 'Danke, und 15/25?' },
      ],
    }))
    const card = await summaryCard()
    expect(within(block(card, de.assistance.student)).getByText('Lea Muster')).toBeInTheDocument()
    expect(within(block(card, de.assistance.question)).getByText('Wie kürze ich 18/24?')).toBeInTheDocument()
    expect(within(card).queryByText('Danke, und 15/25?')).toBeNull()
    expect(within(card).queryByText('Teile durch 6.')).toBeNull()
    expect(within(card).queryByText(/Quelle/)).toBeNull()
    expect(within(card).queryByText('A bounded summary for teacher preparation, not automatic exercise generation.')).toBeNull()
  })

  it('falls back to the text the request was opened with', async () => {
    openDetail(detail({ requestMessage: 'Ich verstehe das Kürzen nicht.', messages: [{ role: 'assistant', content: 'Hallo' }] }))
    const card = await summaryCard()
    expect(within(block(card, de.assistance.question)).getByText('Ich verstehe das Kürzen nicht.')).toBeInTheDocument()
  })

  it('says there is no question when there is neither', async () => {
    openDetail(detail())
    const card = await summaryCard()
    expect(within(block(card, de.assistance.question)).getByText(de.assistance.noQuestion)).toBeInTheDocument()
  })

  it('has its labels in all four languages, and nothing of the old card', () => {
    for (const [language, bundle] of Object.entries({ de, en, fr, it: italian })) {
      expect(Object.keys(bundle.assistance).sort(), language).toEqual(['noQuestion', 'question', 'student', 'title'])
      expect('aiTools' in bundle, language).toBe(false)
    }
  })
})
