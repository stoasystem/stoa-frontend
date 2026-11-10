/**
 * #651: an account deletes itself from the bottom of its account page with
 * `DELETE /auth/me`. Nothing is sent before the reader has typed their own
 * email address; an accepted deletion signs the device out without the logout
 * call and lands on the sign-in page; a failure says so in plain words.
 *
 * Driven through the real API layer against a mocked backend, on the real
 * /me page and the real sign-out.
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryClient } from '@/app/query/queryClient'
import { confirmsDeletion } from '@/features/account/DeleteAccountGroup'
import i18n from '@/i18n'
import enCommon from '@/i18n/locales/en/common.json'
import { MePage } from '@/pages/me/MePage'
import { type CurrentUser, TOKEN_KEY, useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'
import { mswServer } from '../mswServer'

// The shell and the other groups fetch on their own; they are not under test.
vi.mock('@/layouts/AppLayout', () => ({ AppLayout: ({ children }: { children: ReactNode }) => children }))
vi.mock('@/features/account/GradeGroup', () => ({ GradeGroup: () => null }))
vi.mock('@/features/account/AnswerStyleGroup', () => ({ AnswerStyleGroup: () => null }))
vi.mock('@/features/account/NotificationPreferencesGroup', () => ({ NotificationPreferencesGroup: () => null }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

const copy = enCommon.me.deleteAccount
const EMAIL = 'Lina.Meier@example.com'
const confirmLabel = copy.confirmLabel.replace('{{word}}', EMAIL)

type Seen = { deletes: number; logouts: number }

function backend(answer: () => Response): Seen {
  const seen: Seen = { deletes: 0, logouts: 0 }
  mswServer.use(
    http.delete('https://api.test/auth/me', () => {
      seen.deletes += 1
      return answer()
    }),
    http.post('https://api.test/auth/logout', () => {
      seen.logouts += 1
      return new HttpResponse(null, { status: 204 })
    }),
  )
  return seen
}

const accepted = () =>
  HttpResponse.json(
    { commandId: 'cmd-1', status: 'deletion_pending', acceptedAt: '2026-11-10T09:00:00Z' },
    { status: 202 },
  )

let pathname = ''
function LocationProbe() {
  pathname = useLocation().pathname
  return null
}

function openMe(role: UserRole = 'student') {
  sessionStorage.setItem(TOKEN_KEY, 'token-a')
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: EMAIL, role } as CurrentUser,
    accessToken: 'token-a',
    isAuthenticated: true,
  })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/me']}>
          <Routes>
            <Route path="/me" element={<MePage />} />
            <Route path="/login" element={<p>Sign-in page</p>} />
          </Routes>
          <LocationProbe />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

const deleteButton = () => screen.getByRole('button', { name: copy.submit })

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
beforeEach(async () => {
  await i18n.changeLanguage('en')
  vi.mocked(toast.success).mockClear()
})
afterEach(() => {
  mswServer.resetHandlers()
  queryClient.clear()
  sessionStorage.clear()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})
afterAll(() => mswServer.close())

describe('the confirmation word', () => {
  it('is the address typed in any case, with spaces around it', () => {
    expect(confirmsDeletion('  lina.meier@EXAMPLE.com ', EMAIL)).toBe(true)
    expect(confirmsDeletion('lina.meier@example.co', EMAIL)).toBe(false)
    expect(confirmsDeletion('', '')).toBe(false)
  })
})

describe('deleting the account on /me (#651)', () => {
  it('explains what is lost and sends nothing before the address is typed', async () => {
    const user = userEvent.setup()
    const seen = backend(accepted)
    openMe()

    expect(screen.getByRole('heading', { level: 2, name: copy.heading })).toBeInTheDocument()
    expect(screen.getByText(copy.consequences)).toBeInTheDocument()
    // Only a parent reads about children.
    expect(screen.queryByText(copy.parentLinks)).toBeNull()

    expect(deleteButton()).toBeDisabled()
    const field = screen.getByLabelText(confirmLabel)
    await user.type(field, 'lina.meier@example.co')
    expect(deleteButton()).toBeDisabled()
    // Enter in the field submits the form; a wrong word still sends nothing.
    await user.type(field, '{Enter}')
    await user.click(deleteButton())
    expect(seen.deletes).toBe(0)

    await user.type(field, 'm')
    expect(deleteButton()).toBeEnabled()
    expect(seen.deletes).toBe(0)
    expect(pathname).toBe('/me')
  })

  it('signs out without the logout call and lands on the sign-in page once accepted', async () => {
    const user = userEvent.setup()
    const seen = backend(accepted)
    openMe()

    await user.type(screen.getByLabelText(confirmLabel), EMAIL.toUpperCase())
    await user.click(deleteButton())

    await waitFor(() => expect(pathname).toBe('/login'))
    expect(screen.getByText('Sign-in page')).toBeInTheDocument()
    expect(seen.deletes).toBe(1)
    // The account is being deleted: there is nothing left to sign out of.
    expect(seen.logouts).toBe(0)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(toast.success).toHaveBeenCalledWith(copy.accepted)
  })

  it('says it did not work, and stays signed in, when the backend refuses', async () => {
    const user = userEvent.setup()
    const seen = backend(() =>
      HttpResponse.json({ detail: { code: 'account_deletion_conflict', message: 'internal reason' } }, { status: 409 }),
    )
    openMe()

    await user.type(screen.getByLabelText(confirmLabel), EMAIL)
    await user.click(deleteButton())

    expect(await screen.findByRole('alert')).toHaveTextContent(copy.failed)
    expect(screen.queryByText(/internal reason/)).toBeNull()
    expect(seen.deletes).toBe(1)
    expect(seen.logouts).toBe(0)
    expect(pathname).toBe('/me')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('tells a parent that the links to their children end', () => {
    backend(accepted)
    openMe('parent')

    expect(screen.getByText(copy.parentLinks_formal)).toBeInTheDocument()
    expect(screen.getByText(copy.consequences_formal)).toBeInTheDocument()
  })
})
