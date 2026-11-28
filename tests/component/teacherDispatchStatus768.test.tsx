/**
 * The teacher's own dispatch status on /teacher/availability (#768): shown
 * first on the page in its three states, switched on its own with
 * `PATCH { status }`, and never sent by the subjects-and-hours form, which the
 * backend then leaves as it was. Switching must not drop unsaved edits in the
 * form below.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { TeacherAvailabilityPage } from '@/pages/teacher/TeacherAvailabilityPage'
import { ApiError, httpClient } from '@/services/api/httpClient'
import type { TeacherWeeklyAvailability } from '@/types/teacherAvailability'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

const saturday = { dayOfWeek: 'saturday' as const, startTime: '10:00', endTime: '12:00' }

/** The backend as far as this page sees it: a field left out of a save is kept. */
let stored: TeacherWeeklyAvailability
const get = vi.spyOn(httpClient, 'get')
const patch = vi.spyOn(httpClient, 'patch')

function backend(start: TeacherWeeklyAvailability) {
  stored = start
  get.mockImplementation(async () => ({ data: stored }) as never)
  patch.mockImplementation(async (_url: string, body: unknown) => {
    const sent = body as Partial<TeacherWeeklyAvailability>
    stored = {
      subjects: sent.subjects ?? stored.subjects,
      weeklyAvailability: sent.weeklyAvailability ?? stored.weeklyAvailability,
      status: sent.status ?? (stored.status === null ? 'available' : stored.status),
    }
    return { data: stored } as never
  })
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <TeacherAvailabilityPage />
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

const statusCard = async () => within(await screen.findByRole('region', { name: 'Hilfeanfragen annehmen' }))

beforeEach(async () => {
  vi.clearAllMocks()
  await i18n.changeLanguage('de')
})

describe('the three states', () => {
  it('paused: says so first on the page, with what it means and the button to resume', async () => {
    backend({ subjects: ['math'], weeklyAvailability: [saturday], status: 'paused' })
    renderPage()
    const card = await statusCard()
    expect(card.getByRole('status')).toHaveTextContent('Sie sind pausiert')
    expect(card.getByText(/Lernende sehen Sie nicht, und Ihnen werden keine neuen Hilfeanfragen zugewiesen\./)).toBeInTheDocument()
    expect(card.getByRole('button', { name: 'Wieder Anfragen annehmen' })).toBeEnabled()
    // Above the form: the first thing a teacher sent here by the bell sees.
    const form = screen.getByRole('button', { name: 'Verfügbarkeit speichern' })
    expect(card.getByRole('button', { name: 'Wieder Anfragen annehmen' }).compareDocumentPosition(form))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(screen.getByText('Status: pausiert')).toBeInTheDocument()
  })

  it('available: says students see them only while STOA is open, and offers to pause', async () => {
    backend({ subjects: ['math'], weeklyAvailability: [saturday], status: 'available' })
    renderPage()
    const card = await statusCard()
    expect(card.getByRole('status')).toHaveTextContent('Sie nehmen Anfragen an')
    expect(card.getByText(/Etwa 5 Minuten nach dem Schliessen sehen Lernende Sie nicht mehr\./)).toBeInTheDocument()
    expect(card.getByText('Die wöchentlichen Zeitfenster unten schalten das nicht ein oder aus.')).toBeInTheDocument()
    expect(card.getByRole('button', { name: 'Pausieren' })).toBeEnabled()
    expect(screen.getByText('Status: nimmt Anfragen an')).toBeInTheDocument()
  })

  it('never set: not taking requests yet, and saving subjects or hours starts it too', async () => {
    backend({ subjects: [], weeklyAvailability: [], status: null })
    renderPage()
    const card = await statusCard()
    expect(card.getByRole('status')).toHaveTextContent('Sie nehmen noch keine Anfragen an')
    expect(card.getByText(/speichern Sie unten Ihre Fächer und Zeitfenster/)).toBeInTheDocument()
    expect(card.getByRole('button', { name: 'Anfragen annehmen' })).toBeEnabled()
    expect(screen.getByText('Status: noch nicht gestartet')).toBeInTheDocument()
  })
})

describe('switching', () => {
  it('resumes with PATCH { status: "available" } alone, and shows the answer', async () => {
    backend({ subjects: ['math'], weeklyAvailability: [saturday], status: 'paused' })
    renderPage()
    const card = await statusCard()
    await userEvent.click(card.getByRole('button', { name: 'Wieder Anfragen annehmen' }))
    await waitFor(() => expect(card.getByRole('status')).toHaveTextContent('Sie nehmen Anfragen an'))
    expect(patch).toHaveBeenCalledTimes(1)
    expect(patch).toHaveBeenCalledWith('/teachers/me/availability', { status: 'available' })
    expect(card.getByRole('button', { name: 'Pausieren' })).toBeInTheDocument()
    expect(screen.getByText('Status: nimmt Anfragen an')).toBeInTheDocument()
  })

  it('pauses with PATCH { status: "paused" } alone', async () => {
    backend({ subjects: ['math'], weeklyAvailability: [saturday], status: 'available' })
    renderPage()
    const card = await statusCard()
    await userEvent.click(card.getByRole('button', { name: 'Pausieren' }))
    await waitFor(() => expect(card.getByRole('status')).toHaveTextContent('Sie sind pausiert'))
    expect(patch).toHaveBeenCalledWith('/teachers/me/availability', { status: 'paused' })
  })

  it('starts a teacher who never set it with PATCH { status: "available" }', async () => {
    backend({ subjects: [], weeklyAvailability: [], status: null })
    renderPage()
    const card = await statusCard()
    await userEvent.click(card.getByRole('button', { name: 'Anfragen annehmen' }))
    await waitFor(() => expect(card.getByRole('status')).toHaveTextContent('Sie nehmen Anfragen an'))
    expect(patch).toHaveBeenCalledWith('/teachers/me/availability', { status: 'available' })
  })

  it('says so when the switch is refused, and keeps the status shown', async () => {
    backend({ subjects: ['math'], weeklyAvailability: [saturday], status: 'paused' })
    patch.mockRejectedValueOnce(new ApiError('boom', { status: 500 }))
    renderPage()
    const card = await statusCard()
    await userEvent.click(card.getByRole('button', { name: 'Wieder Anfragen annehmen' }))
    expect(await card.findByRole('alert')).toHaveTextContent(
      'Ihr Status konnte nicht geändert werden. Bitte versuchen Sie es erneut.',
    )
    expect(card.getByRole('status')).toHaveTextContent('Sie sind pausiert')
  })

  it('keeps unsaved edits in the form below', async () => {
    backend({ subjects: ['math'], weeklyAvailability: [saturday], status: 'paused' })
    renderPage()
    const card = await statusCard()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Physik' }))
    await userEvent.click(card.getByRole('button', { name: 'Wieder Anfragen annehmen' }))
    await waitFor(() => expect(card.getByRole('status')).toHaveTextContent('Sie nehmen Anfragen an'))
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2))
    expect(screen.getByRole('checkbox', { name: 'Physik' })).toBeChecked()
  })
})

describe('the subjects-and-hours form', () => {
  it('never sends the status, so a paused teacher stays paused', async () => {
    backend({ subjects: ['math'], weeklyAvailability: [saturday], status: 'paused' })
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Verfügbarkeit speichern' }))
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1))
    const [url, body] = patch.mock.calls[0]
    expect(url).toBe('/teachers/me/availability')
    expect(body).toEqual({ subjects: ['math'], weeklyAvailability: [saturday] })
    expect(body).not.toHaveProperty('status')
    expect((await statusCard()).getByRole('status')).toHaveTextContent('Sie sind pausiert')
  })

  it('a first save by a teacher who never set it shows them taking requests, from the answer', async () => {
    backend({ subjects: [], weeklyAvailability: [], status: null })
    renderPage()
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Mathematik' }))
    await userEvent.click(screen.getByRole('button', { name: 'Verfügbarkeit speichern' }))
    const card = await statusCard()
    await waitFor(() => expect(card.getByRole('status')).toHaveTextContent('Sie nehmen Anfragen an'))
    expect(patch.mock.calls[0][1]).not.toHaveProperty('status')
  })
})

describe('the copy', () => {
  const keys = [
    'availability.dispatch.title',
    'availability.dispatch.state.unset',
    'availability.dispatch.state.available',
    'availability.dispatch.state.paused',
    'availability.dispatch.explain.unset',
    'availability.dispatch.explain.available',
    'availability.dispatch.explain.paused',
    'availability.dispatch.online',
    'availability.dispatch.hoursAreNotStatus',
    'availability.dispatch.action.start',
    'availability.dispatch.action.resume',
    'availability.dispatch.action.pause',
    'availability.dispatch.saving',
    'availability.dispatch.saveFailed',
    'availability.summary.status',
    'availability.summary.statusName.unset',
    'availability.summary.statusName.available',
    'availability.summary.statusName.paused',
  ]

  it.each(['de', 'en', 'fr', 'it'])('is there in %s', (language) => {
    for (const key of keys) {
      // Read from the language itself, so the English fallback can't answer for it.
      expect(i18n.getResource(language, 'teacher', key), `${language} ${key}`).toEqual(expect.any(String))
    }
  })

  it('writes German the Swiss way, without ß', () => {
    for (const key of keys) expect(i18n.getResource('de', 'teacher', key), key).not.toContain('ß')
  })
})
