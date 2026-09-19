import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProtectedRoute } from '@/app/router/ProtectedRoute'
import { UserMenu } from '@/components/common/UserMenu'
import deAuth from '@/i18n/locales/de/auth.json'
import enAuth from '@/i18n/locales/en/auth.json'
import frAuth from '@/i18n/locales/fr/auth.json'
import itAuth from '@/i18n/locales/it/auth.json'
import deCommon from '@/i18n/locales/de/common.json'
import enCommon from '@/i18n/locales/en/common.json'
import frCommon from '@/i18n/locales/fr/common.json'
import itCommon from '@/i18n/locales/it/common.json'
import { ChangePasswordPage } from '@/pages/auth/ChangePasswordPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { confirmPasswordChange, requestPasswordChange } from '@/services/auth/authApi'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en', language: 'en' },
  }),
}))

vi.mock('@/services/auth/authApi', () => ({
  requestPasswordChange: vi.fn(),
  confirmPasswordChange: vi.fn(),
}))

const mockedRequest = vi.mocked(requestPasswordChange)
const mockedConfirm = vi.mocked(confirmPasswordChange)

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

function signIn(role: UserRole, mustChangePassword = false) {
  useAuthStore.setState({
    user: {
      id: 'u-1',
      name: 'Ada',
      email: 'ada@example.com',
      role,
      mustChangePassword,
    } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
}

describe('the password change entry point', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
  })

  const roles: UserRole[] = ['student', 'parent', 'teacher', 'admin']

  it.each(roles)('is offered to a signed-in %s in the sidebar account menu', (role) => {
    signIn(role)

    renderWithProviders(<UserMenu />)

    expect(screen.getByRole('link', { name: 'actions.changePassword' })).toHaveAttribute(
      'href',
      '/settings/password',
    )
  })

  it('is offered in the top bar account menu too', () => {
    signIn('student')

    renderWithProviders(<UserMenu variant="top" />)

    expect(screen.getByRole('link', { name: 'actions.changePassword' })).toHaveAttribute(
      'href',
      '/settings/password',
    )
  })

  it('is not offered to a visitor who is not signed in', () => {
    renderWithProviders(<UserMenu />)

    expect(screen.queryByRole('link', { name: 'actions.changePassword' })).not.toBeInTheDocument()
  })

  it('carries its own wording in every supported language, with no English fallback', () => {
    const labels = {
      de: deCommon.actions.changePassword,
      en: enCommon.actions.changePassword,
      fr: frCommon.actions.changePassword,
      it: itCommon.actions.changePassword,
    }

    for (const [language, label] of Object.entries(labels)) {
      expect(label, `${language} is missing the label`).toBeTruthy()
    }
    expect(new Set(Object.values(labels)).size).toBe(4)
    for (const language of ['de', 'fr', 'it'] as const) {
      expect(labels[language]).not.toBe(labels.en)
    }
  })

  it('explains an undelivered code in every supported language', () => {
    const messages = {
      de: deAuth.changePassword.errors.password_change_code_delivery_failed,
      en: enAuth.changePassword.errors.password_change_code_delivery_failed,
      fr: frAuth.changePassword.errors.password_change_code_delivery_failed,
      it: itAuth.changePassword.errors.password_change_code_delivery_failed,
    }

    for (const [language, message] of Object.entries(messages)) {
      expect(message, `${language} is missing the message`).toBeTruthy()
    }
    expect(new Set(Object.values(messages)).size).toBe(4)
  })
})

describe('RegisterPage', () => {
  it('explains that accounts come from an administrator and offers no form', () => {
    renderWithProviders(<RegisterPage />)

    expect(screen.getByText('register.closed.body')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'register.closed.signInCta' })).toHaveAttribute(
      'href',
      '/login',
    )
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /register/i })).not.toBeInTheDocument()
  })
})

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    ['student', '/dashboard'],
    ['parent', '/parent'],
    ['teacher', '/tutor'],
    ['admin', '/admin'],
  ] as const)('sends %s back into the app, never to the login screen', (role, home) => {
    // The route lives inside ProtectedRoute and Cognito's change_password does
    // not revoke tokens, so the visitor is still signed in on every exit here.
    signIn(role)
    renderWithProviders(<ChangePasswordPage />)

    const back = screen.getByRole('link', { name: 'common:actions.back' })
    expect(back).toHaveAttribute('href', home)
    expect(screen.queryByRole('link', { name: /sign|login/i })).not.toBeInTheDocument()
  })

  it('asks for the current password first and never shows the code fields early', () => {
    renderWithProviders(<ChangePasswordPage />)

    expect(screen.getByLabelText('auth:changePassword.currentPasswordLabel')).toBeInTheDocument()
    expect(screen.queryByLabelText('auth:changePassword.codeLabel')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('auth:changePassword.newPasswordLabel')).not.toBeInTheDocument()
  })

  it('walks current password, emailed code and new password in that order', async () => {
    const user = userEvent.setup()
    mockedRequest.mockResolvedValue({
      status: 'sent',
      maskedRecipient: 'l******@example.com',
      expiresAt: 1_790_000_000,
    })
    mockedConfirm.mockResolvedValue({ status: 'changed' })
    renderWithProviders(<ChangePasswordPage />)

    await user.type(
      screen.getByLabelText('auth:changePassword.currentPasswordLabel'),
      'Old!Pass123',
    )
    await user.click(screen.getByRole('button', { name: 'auth:changePassword.sendCodeCta' }))

    await waitFor(() => {
      expect(mockedRequest.mock.calls[0]?.[0]).toEqual({ currentPassword: 'Old!Pass123' })
    })
    expect(await screen.findByText('auth:changePassword.sentBody')).toBeInTheDocument()

    await user.type(screen.getByLabelText('auth:changePassword.codeLabel'), '123456')
    await user.type(screen.getByLabelText('auth:changePassword.newPasswordLabel'), 'New!Pass123')
    await user.type(
      screen.getByLabelText('auth:changePassword.confirmPasswordLabel'),
      'New!Pass123',
    )
    await user.click(screen.getByRole('button', { name: 'auth:changePassword.submit' }))

    await waitFor(() => {
      expect(mockedConfirm.mock.calls[0]?.[0]).toEqual({
        currentPassword: 'Old!Pass123',
        code: '123456',
        newPassword: 'New!Pass123',
      })
    })
    expect(await screen.findByText('auth:changePassword.successBody')).toBeInTheDocument()
  })

  it('blocks a non-compliant password and a mismatch before calling the API', async () => {
    const user = userEvent.setup()
    mockedRequest.mockResolvedValue({
      status: 'sent',
      maskedRecipient: 'l******@example.com',
      expiresAt: 1_790_000_000,
    })
    renderWithProviders(<ChangePasswordPage />)

    await user.type(
      screen.getByLabelText('auth:changePassword.currentPasswordLabel'),
      'Old!Pass123',
    )
    await user.click(screen.getByRole('button', { name: 'auth:changePassword.sendCodeCta' }))
    await screen.findByLabelText('auth:changePassword.codeLabel')

    await user.type(screen.getByLabelText('auth:changePassword.codeLabel'), '123456')
    await user.type(screen.getByLabelText('auth:changePassword.newPasswordLabel'), 'weakpass')
    await user.type(screen.getByLabelText('auth:changePassword.confirmPasswordLabel'), 'weakpass')
    await user.click(screen.getByRole('button', { name: 'auth:changePassword.submit' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('errors:passwordRequirements')

    await user.clear(screen.getByLabelText('auth:changePassword.newPasswordLabel'))
    await user.type(screen.getByLabelText('auth:changePassword.newPasswordLabel'), 'New!Pass123')
    await user.click(screen.getByRole('button', { name: 'auth:changePassword.submit' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'auth:changePassword.passwordMismatch',
    )

    expect(mockedConfirm).not.toHaveBeenCalled()
  })
})

describe('an account an administrator has reset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
  })

  function renderGuarded(initialEntry: string) {
    return renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/chat" element={<p>chat screen</p>} />
          <Route path="/settings/password" element={<p>password screen</p>} />
        </Route>
      </Routes>,
      initialEntry,
    )
  }

  it('is sent to the password change from anywhere else in the app', async () => {
    signIn('student', true)

    renderGuarded('/chat')

    expect(await screen.findByText('password screen')).toBeInTheDocument()
    expect(screen.queryByText('chat screen')).not.toBeInTheDocument()
  })

  it('is left alone once it is already on the password change', async () => {
    signIn('student', true)

    renderGuarded('/settings/password')

    expect(await screen.findByText('password screen')).toBeInTheDocument()
  })

  it('does not move an account that was never reset', async () => {
    // Negative control: it is the flag that redirects, not the guard itself.
    signIn('student')

    renderGuarded('/chat')

    expect(await screen.findByText('chat screen')).toBeInTheDocument()
  })

  it('is told why it is here, and is offered no way back out', () => {
    signIn('student', true)

    renderWithProviders(<ChangePasswordPage />)

    expect(screen.getByText('auth:changePassword.forcedTitle')).toBeInTheDocument()
    expect(screen.getByText('auth:changePassword.forcedBody')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'common:actions.back' })).not.toBeInTheDocument()
  })

  it('keeps that notice to itself when nothing was reset', () => {
    signIn('student')

    renderWithProviders(<ChangePasswordPage />)

    expect(screen.queryByText('auth:changePassword.forcedTitle')).not.toBeInTheDocument()
  })

  it('is released the moment the change goes through', async () => {
    const user = userEvent.setup()
    mockedRequest.mockResolvedValue({
      status: 'sent',
      maskedRecipient: 'l******@example.com',
      expiresAt: 1_790_000_000,
    })
    mockedConfirm.mockResolvedValue({ status: 'changed' })
    signIn('student', true)
    renderWithProviders(<ChangePasswordPage />)

    await user.type(
      screen.getByLabelText('auth:changePassword.currentPasswordLabel'),
      'Temp!Pass123',
    )
    await user.click(screen.getByRole('button', { name: 'auth:changePassword.sendCodeCta' }))
    await screen.findByLabelText('auth:changePassword.codeLabel')

    await user.type(screen.getByLabelText('auth:changePassword.codeLabel'), '123456')
    await user.type(screen.getByLabelText('auth:changePassword.newPasswordLabel'), 'New!Pass123')
    await user.type(
      screen.getByLabelText('auth:changePassword.confirmPasswordLabel'),
      'New!Pass123',
    )
    await user.click(screen.getByRole('button', { name: 'auth:changePassword.submit' }))

    expect(await screen.findByText('auth:changePassword.successBody')).toBeInTheDocument()
    await waitFor(() => {
      expect(useAuthStore.getState().user?.mustChangePassword).toBe(false)
    })
  })

  it('reads that explanation in every supported language, with no English fallback', () => {
    const copy = {
      de: [deAuth.changePassword.forcedTitle, deAuth.changePassword.forcedBody],
      en: [enAuth.changePassword.forcedTitle, enAuth.changePassword.forcedBody],
      fr: [frAuth.changePassword.forcedTitle, frAuth.changePassword.forcedBody],
      it: [itAuth.changePassword.forcedTitle, itAuth.changePassword.forcedBody],
    }

    for (const [language, lines] of Object.entries(copy)) {
      for (const line of lines) {
        expect(line, `${language} is missing a line`).toBeTruthy()
      }
    }
    for (const index of [0, 1]) {
      expect(new Set(Object.values(copy).map((lines) => lines[index])).size).toBe(4)
      for (const language of ['de', 'fr', 'it'] as const) {
        expect(copy[language][index]).not.toBe(copy.en[index])
      }
    }
  })
})
