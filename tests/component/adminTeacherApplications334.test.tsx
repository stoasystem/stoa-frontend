/**
 * The teacher application review, from the 2026-10-20 audit (#334).
 *
 * 1. The decision reason started as an English sentence and outlived every
 *    decision, so the next applicant was decided under the last one's reason.
 * 2. Approve and Reject acted on the first click; they now open a dialog that
 *    names the applicant.
 * 3. The queue showed nothing while it loaded, read every failure as missing
 *    reviewer access, and did not announce the failure.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import deAdmin from '@/i18n/locales/de/admin.json'
import enAdmin from '@/i18n/locales/en/admin.json'
import frAdmin from '@/i18n/locales/fr/admin.json'
import itAdmin from '@/i18n/locales/it/admin.json'
import { AdminTeacherApplicationsPage } from '@/pages/admin/AdminTeacherApplicationsPage'
import { ApiError } from '@/services/api/httpClient'

type ListState = {
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  error: unknown
}

const state = vi.hoisted(() => ({
  list: { isPending: false, isSuccess: true, isError: false, error: null } as ListState,
  applications: [] as Array<Record<string, unknown>>,
}))

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

const reviewMutate = vi.fn()
vi.mock('@/hooks/teacher/useTeacherApplication', () => ({
  useTeacherApplicationsQuery: (reviewState: string) => {
    const items = state.applications.filter((row) => row.reviewState === reviewState)
    return {
      ...state.list,
      data: state.list.isSuccess ? { reviewState, items, count: items.length } : undefined,
    }
  },
  useTeacherApplicationDetailQuery: () => ({ data: undefined, isPending: false, isError: false, error: null }),
  useReviewTeacherApplicationMutation: () => ({ mutate: reviewMutate, isPending: false }),
  useReissueTeacherInvitationMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

const LEA = {
  applicationId: 'app-1',
  version: 2,
  reviewState: 'pending_review',
  fullName: 'Lea Muster',
  verifiedEmail: 'lea@example.ch',
  subjects: ['math'],
}
const MARCO = { ...LEA, applicationId: 'app-2', version: 1, fullName: 'Marco Rossi', verifiedEmail: 'marco@example.ch' }

function wrap() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AdminTeacherApplicationsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const copy = enAdmin.teacherApplications
const reasonField = () => screen.getByRole('textbox', { name: copy.reasonLabel })

beforeEach(async () => {
  await i18n.changeLanguage('en')
  reviewMutate.mockReset()
  state.list = { isPending: false, isSuccess: true, isError: false, error: null }
  state.applications = [LEA, MARCO]
})
afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('the decision reason', () => {
  it('starts empty, so no decision goes out under a sentence nobody wrote', async () => {
    const user = userEvent.setup()
    wrap()
    await user.click(screen.getByRole('button', { name: /Lea Muster/ }))

    expect(reasonField()).toHaveValue('')
    expect(screen.getByRole('button', { name: copy.approve })).toBeDisabled()
    expect(screen.getByRole('button', { name: copy.reject })).toBeDisabled()
  })

  it('does not follow the reviewer to another application', async () => {
    const user = userEvent.setup()
    wrap()
    await user.click(screen.getByRole('button', { name: /Lea Muster/ }))
    await user.type(reasonField(), 'Strong maths background.')
    // Clicking the open application again keeps what was typed.
    await user.click(screen.getByRole('button', { name: /Lea Muster/ }))
    expect(reasonField()).toHaveValue('Strong maths background.')

    await user.click(screen.getByRole('button', { name: /Marco Rossi/ }))
    expect(reasonField()).toHaveValue('')
  })

  it('is gone once the decision is made', async () => {
    reviewMutate.mockImplementation((_input, options) => options.onSuccess({ invitationDelivered: true }))
    const user = userEvent.setup()
    wrap()
    await user.click(screen.getByRole('button', { name: /Lea Muster/ }))
    await user.type(reasonField(), 'Strong maths background.')
    await user.click(screen.getByRole('button', { name: copy.approve }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: copy.approve }))

    await user.click(screen.getByRole('button', { name: /Marco Rossi/ }))
    expect(reasonField()).toHaveValue('')
  })
})

describe('approving or rejecting', () => {
  it('asks first, naming the applicant, and sends nothing on cancel', async () => {
    const user = userEvent.setup()
    wrap()
    await user.click(screen.getByRole('button', { name: /Lea Muster/ }))
    await user.type(reasonField(), 'Missing teaching diploma.')
    await user.click(screen.getByRole('button', { name: copy.reject }))

    expect(reviewMutate).not.toHaveBeenCalled()
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('heading')).toHaveTextContent('Reject the application from Lea Muster?')
    expect(dialog).toHaveTextContent('Missing teaching diploma.')

    await user.click(within(dialog).getByRole('button', { name: copy.confirm.cancel }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(reviewMutate).not.toHaveBeenCalled()
  })

  it('sends the decision for the named applicant with the typed reason once confirmed', async () => {
    const user = userEvent.setup()
    wrap()
    await user.click(screen.getByRole('button', { name: /Lea Muster/ }))
    await user.type(reasonField(), '  Strong maths background.  ')
    await user.click(screen.getByRole('button', { name: copy.approve }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('heading')).toHaveTextContent('Approve the application from Lea Muster?')
    expect(dialog).toHaveTextContent('lea@example.ch')
    await user.click(within(dialog).getByRole('button', { name: copy.approve }))

    expect(reviewMutate).toHaveBeenCalledTimes(1)
    expect(reviewMutate.mock.calls[0][0]).toEqual({
      applicationId: 'app-1',
      version: 2,
      decision: 'approved',
      reason: 'Strong maths background.',
    })
  })

  it('keeps the dialog open and says why when the decision fails', async () => {
    reviewMutate.mockImplementation((_input, options) => options.onError(new ApiError('Request failed with status code 500', { status: 500 })))
    const user = userEvent.setup()
    wrap()
    await user.click(screen.getByRole('button', { name: /Lea Muster/ }))
    await user.type(reasonField(), 'Strong maths background.')
    await user.click(screen.getByRole('button', { name: copy.approve }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: copy.approve }))

    expect(within(dialog).getByRole('alert')).toHaveTextContent(copy.reviewFailed)
    // The page behind the open dialog is hidden from the accessibility tree.
    expect(screen.getByRole('textbox', { name: copy.reasonLabel, hidden: true })).toHaveValue(
      'Strong maths background.',
    )
  })
})

describe('reading the queue', () => {
  it('says it is loading rather than nothing', () => {
    state.list = { isPending: true, isSuccess: false, isError: false, error: null }
    wrap()

    expect(screen.getByText(copy.loading)).toBeInTheDocument()
    expect(screen.queryByText(copy.empty)).toBeNull()
  })

  it('names missing reviewer access only when the server refused it, and announces it', () => {
    state.list = {
      isPending: false,
      isSuccess: false,
      isError: true,
      error: new ApiError('Request failed with status code 403', { status: 403 }),
    }
    wrap()

    expect(screen.getByRole('alert')).toHaveTextContent(copy.forbidden)
  })

  it('reads any other failure as a failed load, not as missing access', () => {
    state.list = {
      isPending: false,
      isSuccess: false,
      isError: true,
      error: new ApiError('Network Error', { transportCode: 'ERR_NETWORK' }),
    }
    wrap()

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(copy.loadFailed)
    expect(alert).not.toHaveTextContent(copy.forbidden)
    expect(alert.textContent).not.toMatch(/access/i)
  })
})

describe('the new copy', () => {
  it('exists in all four languages', () => {
    const keys = ['loading', 'forbidden', 'loadFailed'] as const
    for (const locale of [deAdmin, enAdmin, frAdmin, itAdmin]) {
      const ta = locale.teacherApplications
      for (const key of keys) expect(ta[key]).toBeTruthy()
      expect(ta.confirm.title.approved).toContain('{{name}}')
      expect(ta.confirm.title.rejected).toContain('{{name}}')
      expect(ta.confirm.body.approved).toContain('{{email}}')
      expect(ta.confirm.reason).toBeTruthy()
      expect(ta.confirm.cancel).toBeTruthy()
    }
  })

  it('names the applicant in German', async () => {
    await i18n.changeLanguage('de')
    const user = userEvent.setup()
    wrap()
    await user.click(screen.getByRole('button', { name: /Lea Muster/ }))
    await user.type(screen.getByRole('textbox', { name: deAdmin.teacherApplications.reasonLabel }), 'Gut.')
    await user.click(screen.getByRole('button', { name: deAdmin.teacherApplications.approve }))

    expect(within(screen.getByRole('dialog')).getByRole('heading')).toHaveTextContent(
      'Bewerbung von Lea Muster annehmen?',
    )
  })
})
