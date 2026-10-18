/**
 * The moderation queue acts on the case on screen, and says what happened (#261).
 *
 * The resolution note and the assignee were page state: a note typed on case A
 * was sent with "Dismissed" on case B, and the assignee started as the literal
 * "admin-1", which the backend stores as given. Failures and successes said
 * nothing. A failed load also showed "no cases match", a 403 read like any
 * other failure, and a full page of 50 claimed to be every case there was.
 */
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { AdminModerationPage } from '@/pages/admin/AdminModerationPage'
import { ApiError } from '@/services/api/httpClient'
import type { ModerationCase } from '@/services/admin/adminApi'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

const api = vi.hoisted(() => ({
  getModerationCases: vi.fn(),
  getModerationCase: vi.fn(),
  updateModerationCase: vi.fn(),
  addModerationCaseNote: vi.fn(),
}))

vi.mock('@/services/admin/adminApi', () => api)

function moderationCase(id: string, overrides: Partial<ModerationCase> = {}): ModerationCase {
  return {
    case_id: id,
    status: 'open',
    reason: 'abuse',
    severity: 'high',
    surface: 'question',
    question_id: `q-${id}`,
    reporter_id: 'teacher-1',
    reporter_role: 'teacher',
    report_note: `report ${id}`,
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z',
    history: [],
    ...overrides,
  }
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <AdminModerationPage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

function listOf(items: ModerationCase[]) {
  api.getModerationCases.mockResolvedValue({ items, count: items.length, access_pattern: 'scan' })
  api.getModerationCase.mockImplementation(async (id: string) => items.find((item) => item.case_id === id))
}

const caseButton = (id: string) => screen.getByRole('button', { name: new RegExp(`^${id}`) })
const caseHeading = (id: string) => screen.findByText(`Case ${id}`)

beforeAll(async () => {
  await i18n.changeLanguage('en')
})

afterAll(async () => {
  await i18n.changeLanguage('en')
})

beforeEach(() => {
  vi.clearAllMocks()
  api.updateModerationCase.mockImplementation(async (input: { caseId: string }) => moderationCase(input.caseId))
  api.addModerationCaseNote.mockImplementation(async (input: { caseId: string }) => moderationCase(input.caseId))
})

describe('the note and the assignee belong to the selected case', () => {
  it('does not send case A’s resolution note when case B is dismissed', async () => {
    listOf([moderationCase('case-a'), moderationCase('case-b')])
    renderPage()
    await caseHeading('case-a')

    fireEvent.change(screen.getByPlaceholderText('Resolution note'), { target: { value: 'spam from A' } })
    fireEvent.click(caseButton('case-b'))
    await caseHeading('case-b')

    expect(screen.getByPlaceholderText('Resolution note')).toHaveValue('')
    fireEvent.click(screen.getByRole('button', { name: 'Dismissed' }))

    await waitFor(() => expect(api.updateModerationCase).toHaveBeenCalledTimes(1))
    expect(api.updateModerationCase.mock.calls[0][0]).toEqual({
      caseId: 'case-b',
      status: 'dismissed',
      resolution_note: undefined,
    })
  })

  it('clears the resolution note once the status change succeeds', async () => {
    listOf([moderationCase('case-a')])
    renderPage()
    await caseHeading('case-a')

    fireEvent.change(screen.getByPlaceholderText('Resolution note'), { target: { value: 'checked, fine' } })
    fireEvent.click(screen.getByRole('button', { name: 'Dismissed' }))

    await waitFor(() => expect(screen.getByPlaceholderText('Resolution note')).toHaveValue(''))
    expect(api.updateModerationCase.mock.calls[0][0]).toMatchObject({ resolution_note: 'checked, fine' })
  })

  it('starts with no assignee and cannot assign until one is entered', async () => {
    listOf([moderationCase('case-a')])
    renderPage()
    await caseHeading('case-a')

    const field = screen.getByLabelText('Admin')
    const assign = screen.getByRole('button', { name: 'Assign case' })
    expect(field).toHaveValue('')
    expect(assign).toBeDisabled()

    fireEvent.change(field, { target: { value: '   ' } })
    expect(assign).toBeDisabled()

    fireEvent.change(field, { target: { value: ' admin-ana ' } })
    fireEvent.click(assign)
    await waitFor(() => expect(api.updateModerationCase).toHaveBeenCalledTimes(1))
    expect(api.updateModerationCase.mock.calls[0][0]).toEqual({ caseId: 'case-a', assigned_admin_id: 'admin-ana' })
  })

  it('shows each case’s own assignee rather than the one typed on another case', async () => {
    listOf([moderationCase('case-a'), moderationCase('case-b', { assigned_admin_id: 'admin-bo' })])
    renderPage()
    await caseHeading('case-a')

    fireEvent.change(screen.getByLabelText('Admin'), { target: { value: 'admin-ana' } })
    fireEvent.click(caseButton('case-b'))
    await caseHeading('case-b')
    expect(screen.getByLabelText('Admin')).toHaveValue('admin-bo')

    fireEvent.click(caseButton('case-a'))
    await caseHeading('case-a')
    expect(screen.getByLabelText('Admin')).toHaveValue('')
  })
})

describe('actions say how they went', () => {
  it('shows an error when a status change fails, and keeps the note', async () => {
    listOf([moderationCase('case-a')])
    api.updateModerationCase.mockRejectedValueOnce(new ApiError('Request failed with status code 500', { status: 500 }))
    renderPage()
    await caseHeading('case-a')

    fireEvent.change(screen.getByPlaceholderText('Resolution note'), { target: { value: 'keep me' } })
    fireEvent.click(screen.getByRole('button', { name: 'Actioned' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not update the case. Please try again.')
    expect(screen.getByPlaceholderText('Resolution note')).toHaveValue('keep me')
  })

  it('confirms a status change and an assignment', async () => {
    listOf([moderationCase('case-a')])
    renderPage()
    await caseHeading('case-a')

    fireEvent.click(screen.getByRole('button', { name: 'Closed' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Case set to "Closed".')

    fireEvent.change(screen.getByLabelText('Admin'), { target: { value: 'admin-ana' } })
    fireEvent.click(screen.getByRole('button', { name: 'Assign case' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Case assigned to admin-ana.'))
  })

  it('shows an error when a note fails, and confirms one that is saved', async () => {
    listOf([moderationCase('case-a')])
    api.addModerationCaseNote.mockRejectedValueOnce(new ApiError('Network Error', { transportCode: 'ERR_NETWORK' }))
    renderPage()
    await caseHeading('case-a')

    const note = screen.getByPlaceholderText('Add an internal moderation note')
    fireEvent.change(note, { target: { value: 'looked at it' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add note' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not add the note. Please try again.')
    expect(note).toHaveValue('looked at it')

    fireEvent.click(screen.getByRole('button', { name: 'Add note' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Note added.')
    expect(note).toHaveValue('')
  })

  it('does not carry one case’s message to the next', async () => {
    listOf([moderationCase('case-a'), moderationCase('case-b')])
    api.updateModerationCase.mockRejectedValueOnce(new ApiError('boom', { status: 500 }))
    renderPage()
    await caseHeading('case-a')

    fireEvent.click(screen.getByRole('button', { name: 'Closed' }))
    await screen.findByRole('alert')
    fireEvent.click(caseButton('case-b'))
    await caseHeading('case-b')
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('the queue', () => {
  it('does not also say "no cases" when the load failed', async () => {
    api.getModerationCases.mockRejectedValue(new ApiError('Request failed with status code 500', { status: 500 }))
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load moderation cases.')
    expect(screen.queryByText('No moderation cases match these filters.')).toBeNull()
    expect(screen.queryByText(/^0 cases$/)).toBeNull()
  })

  it('says the account is not allowed on a 403', async () => {
    api.getModerationCases.mockRejectedValue(new ApiError('Forbidden', { status: 403 }))
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Your account is not allowed to see moderation cases.')
    expect(screen.queryByText('Failed to load moderation cases.')).toBeNull()
    expect(screen.queryByText('No moderation cases match these filters.')).toBeNull()
  })

  it('still says "no cases" when the queue really is empty', async () => {
    listOf([])
    renderPage()
    expect(await screen.findByText('No moderation cases match these filters.')).toBeInTheDocument()
    expect(screen.getByText('0 cases')).toBeInTheDocument()
  })

  it('says there may be more when a full page of 50 comes back', async () => {
    listOf(Array.from({ length: 50 }, (_, index) => moderationCase(`case-${index}`)))
    renderPage()

    expect(
      await screen.findByText('Only the first 50 cases are shown. There may be more — narrow the filters to find them.'),
    ).toBeInTheDocument()
    expect(screen.getByText('50+ cases')).toBeInTheDocument()
    expect(api.getModerationCases).toHaveBeenCalledWith(expect.objectContaining({ limit: 50 }))
  })

  it('does not claim more when the page is not full', async () => {
    listOf(Array.from({ length: 49 }, (_, index) => moderationCase(`case-${index}`)))
    renderPage()

    expect(await screen.findByText('49 cases')).toBeInTheDocument()
    expect(screen.queryByText(/There may be more/)).toBeNull()
  })
})

describe('the new copy in German', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('de')
  })
  afterAll(async () => {
    await i18n.changeLanguage('en')
  })

  it('addresses the administrator as Sie', async () => {
    api.getModerationCases.mockRejectedValue(new ApiError('Forbidden', { status: 403 }))
    renderPage()
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Ihr Konto darf keine Moderationsfälle sehen.')
    await act(async () => {})
    expect(within(document.body).queryByText(/\bdu\b|\bdein/i)).toBeNull()
  })
})
