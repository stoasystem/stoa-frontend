import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { requestPasswordReset, resetPassword } from '@/services/auth/authApi'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en', language: 'en' },
  }),
}))

vi.mock('@/services/auth/authApi', () => ({
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
}))

const mockedRequest = vi.mocked(requestPasswordReset)
const mockedReset = vi.mocked(resetPassword)

function renderWithProviders(node: ReactNode, initialEntry = '/') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>{node}</MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects a malformed email before calling the API', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ForgotPasswordPage />)

    await user.type(screen.getByLabelText('auth:forgotPassword.emailLabel'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: 'auth:forgotPassword.submit' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('errors:invalidEmail')
    expect(mockedRequest).not.toHaveBeenCalled()
  })

  it('shows the same neutral confirmation for any accepted request', async () => {
    const user = userEvent.setup()
    mockedRequest.mockResolvedValue({ status: 'accepted' })
    renderWithProviders(<ForgotPasswordPage />)

    await user.type(screen.getByLabelText('auth:forgotPassword.emailLabel'), 'learner@example.com')
    await user.click(screen.getByRole('button', { name: 'auth:forgotPassword.submit' }))

    await waitFor(() => {
      expect(mockedRequest).toHaveBeenCalledWith({ email: 'learner@example.com' })
    })
    expect(await screen.findByText('auth:forgotPassword.sentBody')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'auth:forgotPassword.continueCta' })).toHaveAttribute(
      'href',
      '/reset-password?email=learner%40example.com',
    )
  })
})

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prefills the email from the query string and submits the reset', async () => {
    const user = userEvent.setup()
    mockedReset.mockResolvedValue({ status: 'confirmed' })
    renderWithProviders(<ResetPasswordPage />, '/reset-password?email=learner%40example.com')

    expect(screen.getByLabelText('auth:resetPassword.emailLabel')).toHaveValue('learner@example.com')

    await user.type(screen.getByLabelText('auth:resetPassword.codeLabel'), '123456')
    await user.type(screen.getByLabelText('auth:resetPassword.passwordLabel'), 'Str0ng!Pass')
    await user.type(screen.getByLabelText('auth:resetPassword.confirmPasswordLabel'), 'Str0ng!Pass')
    await user.click(screen.getByRole('button', { name: 'auth:resetPassword.submit' }))

    await waitFor(() => {
      expect(mockedReset.mock.calls[0]?.[0]).toEqual({
        email: 'learner@example.com',
        confirmationCode: '123456',
        newPassword: 'Str0ng!Pass',
      })
    })
    expect(await screen.findByText('auth:resetPassword.successBody')).toBeInTheDocument()
  })

  it('blocks a non-compliant password and a mismatch before calling the API', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ResetPasswordPage />, '/reset-password?email=learner%40example.com')

    await user.type(screen.getByLabelText('auth:resetPassword.codeLabel'), '123456')
    await user.type(screen.getByLabelText('auth:resetPassword.passwordLabel'), 'weakpass')
    await user.type(screen.getByLabelText('auth:resetPassword.confirmPasswordLabel'), 'weakpass')
    await user.click(screen.getByRole('button', { name: 'auth:resetPassword.submit' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('errors:passwordRequirements')

    await user.clear(screen.getByLabelText('auth:resetPassword.passwordLabel'))
    await user.type(screen.getByLabelText('auth:resetPassword.passwordLabel'), 'Str0ng!Pass')
    await user.click(screen.getByRole('button', { name: 'auth:resetPassword.submit' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('auth:resetPassword.passwordMismatch')

    expect(mockedReset).not.toHaveBeenCalled()
  })
})
