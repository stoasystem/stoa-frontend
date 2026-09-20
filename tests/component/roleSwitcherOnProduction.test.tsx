/**
 * Whether the switcher appears where the accounts under test actually live.
 *
 * The rest of the RoleSwitcher tests run with a build that is not
 * production-facing, so a gate on the build changes nothing there and they all
 * stay green while the deployed site shows nothing. That is exactly what
 * happened: the gate shipped, every test passed, and the one place the feature
 * was for was the one place it did not work.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/auth/authApi', () => ({ login: vi.fn() }))
vi.mock('@/lib/env', () => ({
  isProductionFacing: true,
  apiBaseUrl: 'https://api.stoaedu.ch',
  showCheckoutPreview: false,
  enablePayment: false,
}))

import { RoleSwitcher } from '@/components/dev/RoleSwitcher'
import { useAuthStore } from '@/store/authStore'

function renderSwitcher() {
  const client = new QueryClient()
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
  return render(<RoleSwitcher />, { wrapper: Wrapper })
}

function signedInAs(email: string, role = 'student') {
  useAuthStore.setState({
    user: { id: 'u1', email, role, name: 'Someone' },
    isAuthenticated: true,
  } as never)
}

describe('on the deployed site', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ user: null, isAuthenticated: false } as never)
  })

  it('is offered to a test-domain account with nothing asked for first', () => {
    signedInAs('admin@test.stoaedu.ch', 'admin')

    renderSwitcher()

    expect(screen.getByRole('button', { name: /Testing as/ })).toBeInTheDocument()
  })

  it('is still withheld from a real address', () => {
    signedInAs('a.real.parent@gmail.com', 'parent')

    renderSwitcher()

    expect(screen.queryByRole('button', { name: /Testing as/ })).not.toBeInTheDocument()
  })

  it('is offered to a real address once that browser has asked', () => {
    localStorage.setItem('stoa_role_switcher', 'on')
    signedInAs('a.real.parent@gmail.com', 'parent')

    renderSwitcher()

    expect(screen.getByRole('button', { name: /Testing as/ })).toBeInTheDocument()
  })
})
