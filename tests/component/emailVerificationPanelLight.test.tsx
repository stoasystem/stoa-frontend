/**
 * Registration's email verification card stays exactly as it was when the
 * sign-in page gained a sky version of it (#53). The snapshots were first
 * written from the panel as it stood before #53 and must not change unless
 * registration is being restyled on purpose.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { EmailVerificationPanel } from '@/components/auth/EmailVerificationPanel'
import { ApiError } from '@/services/api/httpClient'
import { resendEmailVerification } from '@/services/auth/authApi'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => (options?.email ? `${key} ${String(options.email)}` : key),
    i18n: { language: 'en', resolvedLanguage: 'en' },
  }),
}))

vi.mock('@/services/auth/authApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/auth/authApi')>()),
  confirmEmailVerification: vi.fn(),
  resendEmailVerification: vi.fn(),
}))

function renderRegisterPanel() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <EmailVerificationPanel email="ada@example.com" role="student" source="register" />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("registration's email verification card", () => {
  it('keeps its light look', () => {
    const { container } = renderRegisterPanel()

    const card = container.firstElementChild as HTMLElement
    expect(card.className).toBe('rounded-lg border border-border/70 bg-card/90 p-5')
    expect(container.querySelector('[data-surface], [data-variant]')).toBeNull()
    expect(container.innerHTML).toMatchSnapshot()
  })

  it('keeps its light error line', async () => {
    vi.mocked(resendEmailVerification).mockRejectedValue(new ApiError('Too many requests', { status: 429 }))
    const user = userEvent.setup()
    const { container } = renderRegisterPanel()

    await user.click(screen.getByRole('button', { name: 'auth:verification.resendCta' }))

    const alert = await screen.findByRole('alert')
    expect(alert.className).toBe('rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive')
    expect(alert.querySelector('svg')).toBeNull()
    expect(container.innerHTML).toMatchSnapshot()
  })
})
