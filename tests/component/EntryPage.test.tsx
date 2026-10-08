/**
 * The app domain's front door. A student who comes back every day must not
 * have to get past a page selling them what they already pay for.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
  Trans: ({ children }: { children?: ReactNode }) => children ?? null,
}))

vi.mock('@/components/auth/LoginForm', () => ({
  LoginForm: () => <form aria-label="sign in" />,
}))

import { useAuthStore } from '@/store/authStore'
import { EntryPage } from '@/pages/entry/EntryPage'

// Since #45 the root is the student's star map, and the router shows EntryPage
// there only to a visitor who is not a student (routeGuards.test.tsx). The
// entry page itself is exercised at /login, where it always renders.
function renderAt(entry = '/login') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/login" element={<EntryPage />} />
          <Route path="/" element={<p>the student app</p>} />
          <Route path="/parent" element={<p>the parent app</p>} />
          <Route path="/tutor" element={<p>the teacher app</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function signedInAs(role: string) {
  useAuthStore.setState({
    user: { id: 'u1', email: 'someone@test', role, name: 'Someone' },
    isAuthenticated: true,
  } as never)
}

describe('arriving at the app domain', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false } as never)
  })

  it('asks a stranger to sign in', () => {
    renderAt()

    expect(screen.getByRole('form', { name: 'sign in' })).toBeInTheDocument()
  })

  it('takes a student straight to their own app', () => {
    signedInAs('student')

    renderAt()

    expect(screen.getByText('the student app')).toBeInTheDocument()
    expect(screen.queryByRole('form', { name: 'sign in' })).not.toBeInTheDocument()
  })

  it('does not ask someone already signed in to sign in again', () => {
    // /login and the root answer the same way, so a stale bookmark or a
    // redirect left over from an expired session lands in the app.
    signedInAs('student')

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<EntryPage />} />
            <Route path="/" element={<p>the student app</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText('the student app')).toBeInTheDocument()
  })

  it('takes a parent and a teacher to theirs', () => {
    signedInAs('parent')
    const parent = renderAt()
    expect(screen.getByText('the parent app')).toBeInTheDocument()
    parent.unmount()

    signedInAs('teacher')
    renderAt()
    expect(screen.getByText('the teacher app')).toBeInTheDocument()
  })
})

describe('signing in as somebody else', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false } as never)
  })

  it('shows the form to someone who is already signed in and asked for it', () => {
    // 「添加账号」 in the account menu goes to /login?add=1. This page sends
    // anyone with a session straight back to their own app, so the button
    // looked like it did nothing at all.
    signedInAs('student')

    renderAt('/login?add=1')

    expect(screen.getByRole('form', { name: 'sign in' })).toBeInTheDocument()
    expect(screen.queryByText('the student app')).not.toBeInTheDocument()
  })

  it('still sends them home when they did not ask for it', () => {
    signedInAs('student')

    renderAt('/login')

    expect(screen.getByText('the student app')).toBeInTheDocument()
  })

  it('does not take any other value for it', () => {
    signedInAs('student')

    renderAt('/login?add=0')

    expect(screen.getByText('the student app')).toBeInTheDocument()
  })
})
