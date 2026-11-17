/**
 * A new student's or parent's usage period, chosen in the form that opens the
 * account. Neither opening route takes a period, so the page sends it as an
 * extension right after, carrying the version it reads first. Left alone the
 * account gets a three-day trial, as a gift. A teacher or an administrator has
 * no period: no field, no extension. When the extension fails the account is
 * open anyway, and the period card comes up saying so.
 *
 * Runs against the real API layer through MSW, so the bodies asserted are the
 * ones the backend would receive.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import enAdmin from '@/i18n/locales/en/admin.json'
import { formatDate } from '@/lib/formatDateTime'
import { AdminAccountsPage } from '@/pages/admin/AdminAccountsPage'
import { useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

const API = 'https://api.test'
const accounts = enAdmin.accounts
const copy = enAdmin.usagePeriod

// 10:00 in Zurich on 9 November 2026.
const NOW = new Date('2026-11-09T09:00:00Z')

type Extension = Record<string, unknown>
let extensions: Extension[] = []
let reads: string[] = []
let invitations: Record<string, unknown>[] = []
let extensionAnswer: (body: Extension) => Response

function fill(text: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce((out, [key, value]) => out.replace(`{{${key}}}`, String(value)), text)
}

function newAccount(role: string, body: Record<string, unknown>) {
  const prefix = role === 'parent' ? 'P' : role === 'teacher' ? 'T' : 'S'
  return {
    userId: `${role}-new`,
    role,
    accountNumber: `${prefix}26-0042`,
    email: String(body.email),
    accountStatus: 'invited',
  }
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  await i18n.changeLanguage('en')
  useAuthStore.setState({ user: null, accessToken: 'access-1', isAuthenticated: true })
  extensions = []
  reads = []
  invitations = []
  extensionAnswer = (body) =>
    HttpResponse.json({
      userId: 'student-new',
      role: 'student',
      endsOn: body.unit === 'days' ? '2026-11-12' : '2027-02-09',
      state: 'active',
      version: 3,
      record: {},
    })
  mswServer.use(
    http.get(`${API}/admin/users`, () => HttpResponse.json({ items: [], count: 0, groups: {}, nextCursor: null })),
    http.post(`${API}/admin/users/invitations`, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      invitations.push(body)
      return HttpResponse.json({
        ...newAccount(String(body.role), body),
        invitationId: 'inv-1',
        activationToken: 'code-123',
        expiresAt: '2026-11-16T09:00:00Z',
        invitationDelivered: true,
      })
    }),
    http.post(`${API}/admin/users`, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      return HttpResponse.json({
        ...newAccount(String(body.role), body),
        accountStatus: 'active',
        initialPassword: 'Initial12345678',
      })
    }),
    // A profile just opened is past version 0: opening it and attaching its number each write one.
    http.get(`${API}/admin/users/:id/usage-period`, ({ params }) => {
      reads.push(String(params.id))
      return HttpResponse.json({
        userId: params.id,
        role: 'student',
        endsOn: null,
        state: 'none',
        version: 2,
        effective: null,
        records: [],
        nextPageToken: null,
      })
    }),
    http.post(`${API}/admin/users/:id/usage-period/extensions`, async ({ request }) => {
      const body = (await request.json()) as Extension
      extensions.push(body)
      return extensionAnswer(body)
    }),
  )
})
afterEach(() => {
  vi.useRealTimers()
  mswServer.resetHandlers()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})
afterAll(() => mswServer.close())

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/admin/users']}>
        <AdminAccountsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function createCard() {
  return screen.getByText(accounts.createTitle).closest('.mb-4') as HTMLElement
}

async function typeEmail(user: ReturnType<typeof userEvent.setup>, scope: HTMLElement, email: string) {
  await user.type(within(scope).getByLabelText(new RegExp(accounts.emailLabel)), email)
}

describe('a new account’s usage period', () => {
  it('gives an invited student the three-day trial, as a gift, with the version it read', async () => {
    const user = userEvent.setup()
    renderPage()
    const card = createCard()
    const period = within(card).getByRole('group', { name: copy.newAccount.legend })
    expect(within(period).getByLabelText(new RegExp(copy.amountLabel))).toHaveValue('3')
    expect(within(period).getByLabelText(new RegExp(copy.unitLabel))).toHaveValue('days')
    expect(within(period).getByLabelText(new RegExp(copy.sourceLabel))).toHaveValue('gifted')
    expect(within(period).getByTestId('new-account-period-preview')).toHaveTextContent(formatDate('2026-11-12'))

    await typeEmail(user, card, 'lea@example.ch')
    await user.click(within(card).getByRole('button', { name: accounts.invite }))

    const done = await screen.findByText(new RegExp(`Usage period of S26-0042 set: 3 days \\(Gifted\\)`))
    expect(done).toHaveTextContent(formatDate('2026-11-12'))
    await waitFor(() => expect(done).toHaveFocus())
    expect(reads).toEqual(['student-new'])
    expect(extensions).toEqual([{ unit: 'days', amount: 3, source: 'gifted', expectedVersion: 2 }])
    // Set as chosen: no panel to set it again.
    expect(screen.queryByText(fill(copy.newAccountTitle, { accountNumber: 'S26-0042' }))).not.toBeInTheDocument()
    // The form is back to the trial for the next account.
    expect(within(createCard()).getByLabelText(new RegExp(copy.amountLabel))).toHaveValue('3')
  })

  it('sends the period the administrator changed it to', async () => {
    const user = userEvent.setup()
    renderPage()
    const card = createCard()
    await user.selectOptions(within(card).getByLabelText(new RegExp(accounts.roleLabel)), 'parent')
    const amount = within(card).getByLabelText(new RegExp(copy.amountLabel))
    await user.clear(amount)
    await user.type(amount, '14')
    await typeEmail(user, card, 'pia@example.ch')
    await user.click(within(card).getByRole('button', { name: accounts.invite }))

    await screen.findByText(/Usage period of P26-0042 set: 14 days/)
    expect(extensions).toEqual([{ unit: 'days', amount: 14, source: 'gifted', expectedVersion: 2 }])
  })

  it('asks a paid period for its payment reference before the account can be opened', async () => {
    const user = userEvent.setup()
    renderPage()
    const card = createCard()
    await user.selectOptions(within(card).getByLabelText(new RegExp(copy.sourceLabel)), 'paid')
    // A paid period is counted in months.
    expect(within(card).getByLabelText(new RegExp(copy.unitLabel))).toHaveValue('months')
    await typeEmail(user, card, 'lea@example.ch')
    await user.tab()

    const invite = within(card).getByRole('button', { name: accounts.invite })
    expect(invite).toBeDisabled()
    expect(within(card).getByText(new RegExp(copy.extensionIssues.paymentReference))).toBeInTheDocument()

    await user.type(within(card).getByLabelText(new RegExp('Payment reference')), 'RF18 5390')
    expect(invite).toBeEnabled()
    await user.click(invite)

    await screen.findByText(/Usage period of S26-0042 set: 3 months \(Paid\)/)
    expect(extensions).toEqual([
      { unit: 'months', amount: 3, source: 'paid', paymentReference: 'RF18 5390', expectedVersion: 2 },
    ])
  })

  it('shows no period for a teacher and sends no extension', async () => {
    const user = userEvent.setup()
    renderPage()
    const card = createCard()
    await user.selectOptions(within(card).getByLabelText(new RegExp(accounts.roleLabel)), 'teacher')
    expect(within(card).queryByRole('group', { name: copy.newAccount.legend })).not.toBeInTheDocument()

    await typeEmail(user, card, 'tom@example.ch')
    await user.click(within(card).getByRole('button', { name: accounts.invite }))

    await screen.findByText(fill(accounts.inviteSent, { accountNumber: 'T26-0042' }))
    expect(invitations).toHaveLength(1)
    expect(reads).toEqual([])
    expect(extensions).toEqual([])
    expect(screen.queryByText(/Usage period of/)).not.toBeInTheDocument()
  })

  it('applies the period chosen in the form to an account assigned directly', async () => {
    const user = userEvent.setup()
    renderPage()
    const card = createCard()
    const amount = within(card).getByLabelText(new RegExp(copy.amountLabel))
    await user.clear(amount)
    await user.type(amount, '10')
    await user.click(within(card).getByRole('button', { name: accounts.assign }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByTestId('assign-period-summary')).toHaveTextContent('10 days (Gifted)')
    await typeEmail(user, dialog, 'new@example.ch')
    await user.click(within(dialog).getByRole('button', { name: accounts.assignDialogSubmit }))

    await screen.findByText(/Usage period of S26-0042 set: 10 days/)
    expect(screen.getByText(/Initial12345678/)).toBeInTheDocument()
    expect(extensions).toEqual([{ unit: 'days', amount: 10, source: 'gifted', expectedVersion: 2 }])
  })

  it('opens the period card with the reason when the extension fails', async () => {
    const user = userEvent.setup()
    extensionAnswer = () =>
      HttpResponse.json(
        { detail: { code: 'usage_period_version_conflict', message: 'version conflict' } },
        { status: 409 },
      )
    renderPage()
    const card = createCard()
    await typeEmail(user, card, 'lea@example.ch')
    await user.click(within(card).getByRole('button', { name: accounts.invite }))

    const heading = await screen.findByText(fill(copy.newAccountTitle, { accountNumber: 'S26-0042' }))
    await waitFor(() => expect(heading).toHaveFocus())
    const alert = await screen.findByText(/was opened, but its usage period was not set/)
    expect(alert).toHaveAttribute('role', 'alert')
    expect(alert).toHaveTextContent(copy.newAccount.conflict)
    // The account is open: its invitation notice stands, and the panel can set the period.
    expect(screen.getByText(fill(accounts.inviteSent, { accountNumber: 'S26-0042' }))).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: copy.addSubmit })).toBeInTheDocument()
    expect(screen.queryByText(/Usage period of S26-0042 set/)).not.toBeInTheDocument()
  })
})
