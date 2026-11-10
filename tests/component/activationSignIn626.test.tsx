/**
 * The activation pages' way to the sign-in when the browser is already signed
 * in as somebody else (#626).
 *
 * Seen in production on 2026-11-10: an administrator, signed in, activated
 * student S26-0003 in the same browser and clicked "Sign in". The sign-in page
 * goes straight into any account the browser is signed in as, so they landed
 * back in the administrator's account, believing they were on the student's.
 *
 * Now both pages name the two accounts, sign the first one out on request and
 * open the sign-in form on the new account's address; signed in as nobody they
 * are the plain link they were, carrying the address when the page has one.
 * Before claiming, a page opened while signed in says which account it is on.
 *
 * The pages run against mocked API functions and the real sign-out; `/login`
 * is the real EntryPage, with the form reduced to the address it opens on.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/components/auth/LoginForm', () => ({
  LoginForm: ({ initialEmail = '' }: { initialEmail?: string }) => (
    <form aria-label="sign in" data-email={initialEmail} />
  ),
}))
vi.mock('@/services/api/backendPrewarm', () => ({ prewarmBackend: () => false }))
vi.mock('@/services/auth/authApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/auth/authApi')>('@/services/auth/authApi')
  return { ...actual, logout: vi.fn(async () => ({ kind: 'ok' as const })) }
})
vi.mock('@/services/admin/accountsApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/admin/accountsApi')>('@/services/admin/accountsApi')
  return { ...actual, claimInvitation: vi.fn() }
})
vi.mock('@/services/teacher/teacherApplicationApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/teacher/teacherApplicationApi')>(
    '@/services/teacher/teacherApplicationApi',
  )
  return { ...actual, claimTeacherInvitation: vi.fn(), consumeTeacherInvitation: vi.fn() }
})

import i18n from '@/i18n'
import deAuth from '@/i18n/locales/de/auth.json'
import enAdmin from '@/i18n/locales/en/admin.json'
import enAuth from '@/i18n/locales/en/auth.json'
import frAuth from '@/i18n/locales/fr/auth.json'
import itAuth from '@/i18n/locales/it/auth.json'
import { EntryPage } from '@/pages/entry/EntryPage'
import { ActivateAccountPage } from '@/pages/auth/ActivateAccountPage'
import { TeacherActivatePage } from '@/pages/auth/TeacherActivatePage'
import { claimInvitation } from '@/services/admin/accountsApi'
import { logout } from '@/services/auth/authApi'
import { claimTeacherInvitation, consumeTeacherInvitation } from '@/services/teacher/teacherApplicationApi'
import { type CurrentUser, TOKEN_KEY, useAuthStore } from '@/store/authStore'

const mockedClaim = vi.mocked(claimInvitation)
const mockedTeacherClaim = vi.mocked(claimTeacherInvitation)
const mockedConsume = vi.mocked(consumeTeacherInvitation)

const TOKEN = 'invitation-token-32-characters-long'
const GOOD = 'ValidPass12!'
const H = enAuth.activationHandoff

const ADMIN = { id: 'admin-1', name: 'Ada Admin', email: 'ada@stoa.test', role: 'admin' } as CurrentUser

function signedInAs(user: CurrentUser) {
  sessionStorage.setItem(TOKEN_KEY, 'admin-token')
  useAuthStore.setState({ user, accessToken: 'admin-token', isAuthenticated: true })
}

/** Where a page left for, and with what: the activation page itself, else the location. */
function Elsewhere() {
  const location = useLocation()
  return <p data-testid="elsewhere">{location.pathname}</p>
}

function open(path: '/activate' | '/teacher-activate', page: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`${path}?token=${TOKEN}`]}>
        <Routes>
          <Route path={path} element={page} />
          <Route path="/login" element={<EntryPage />} />
          <Route path="*" element={<Elsewhere />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function claimStudent() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(enAuth.register.password), GOOD)
  await user.type(screen.getByLabelText(enAdmin.activation.confirmPassword), GOOD)
  await user.click(screen.getByRole('button', { name: enAdmin.activation.submit }))
  await screen.findByText(enAdmin.activation.success)
  return user
}

async function claimTeacher() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(enAuth.register.password), GOOD)
  await user.type(screen.getByLabelText(enAuth.activate.confirmPassword), GOOD)
  await user.click(screen.getByRole('button', { name: enAuth.activate.submit }))
  await screen.findByText(enAuth.activate.success)
  return user
}

function fill(template: string, values: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key])
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  localStorage.clear()
  sessionStorage.clear()
  mockedClaim.mockReset()
  mockedTeacherClaim.mockReset()
  mockedConsume.mockReset()
  vi.mocked(logout).mockClear()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

afterEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

describe('the account activation page (#626)', () => {
  const STUDENT = { status: 'active', userId: 'student-3', role: 'student' as const, accountNumber: 'S26-0003' }

  it('says, before the claim, which account the browser is on', () => {
    signedInAs(ADMIN)
    open('/activate', <ActivateAccountPage />)

    expect(screen.getByRole('status')).toHaveTextContent(fill(H.beforeClaim, { current: 'Ada Admin' }))
  })

  it('says nothing of it when nobody is signed in', () => {
    open('/activate', <ActivateAccountPage />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('signs the administrator out and opens the sign-in on the student, not the administrator’s home', async () => {
    signedInAs(ADMIN)
    mockedClaim.mockResolvedValue({ ...STUDENT, email: 'kid@stoa.test' })
    open('/activate', <ActivateAccountPage />)
    const user = await claimStudent()

    const values = { current: 'Ada Admin', activated: 'kid@stoa.test' }
    expect(screen.getByTestId('activation-switch')).toHaveTextContent(fill(H.signedInAs, values))
    expect(screen.getByTestId('activation-switch')).toHaveTextContent(fill(H.activated, values))
    // No plain link that the sign-in would turn into the administrator's account.
    expect(screen.queryByRole('link', { name: enAdmin.activation.signIn })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: fill(H.switch, values) }))

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(logout).toHaveBeenCalledWith('admin-token')
    expect(await screen.findByRole('form', { name: 'sign in' })).toHaveAttribute('data-email', 'kid@stoa.test')
    expect(screen.queryByTestId('elsewhere')).not.toBeInTheDocument()
  })

  it('names the account number while the claim answers without an address, and opens an empty form', async () => {
    signedInAs(ADMIN)
    mockedClaim.mockResolvedValue(STUDENT)
    open('/activate', <ActivateAccountPage />)
    const user = await claimStudent()

    const values = { current: 'Ada Admin', activated: 'S26-0003' }
    await user.click(screen.getByRole('button', { name: fill(H.switch, values) }))

    expect(await screen.findByRole('form', { name: 'sign in' })).toHaveAttribute('data-email', '')
  })

  it('keeps the plain link when nobody is signed in, with the address carried along', async () => {
    mockedClaim.mockResolvedValue({ ...STUDENT, email: 'kid@stoa.test' })
    open('/activate', <ActivateAccountPage />)
    const user = await claimStudent()

    expect(screen.queryByTestId('activation-switch')).not.toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: enAdmin.activation.signIn }))

    expect(await screen.findByRole('form', { name: 'sign in' })).toHaveAttribute('data-email', 'kid@stoa.test')
    expect(logout).not.toHaveBeenCalled()
  })

  it('offers no switch when the browser is signed in as the very account activated', async () => {
    signedInAs({ ...ADMIN, id: 'student-3' })
    mockedClaim.mockResolvedValue(STUDENT)
    open('/activate', <ActivateAccountPage />)
    await claimStudent()

    expect(screen.queryByTestId('activation-switch')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: enAdmin.activation.signIn })).toBeInTheDocument()
  })
})

describe('the teacher activation page (#626)', () => {
  const TEACHER = { status: 'active', userId: 'teacher-9', applicationId: 'app-1', applicationVersion: 1 }

  it('says, before finishing, which account it would finish for, and signs out onto the same link', async () => {
    signedInAs(ADMIN)
    open('/teacher-activate', <TeacherActivatePage />)

    expect(screen.getByText(fill(H.beforeFinish, { current: 'Ada Admin' }))).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: fill(H.signOutFirst, { current: 'Ada Admin' }) }))

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(screen.queryByTestId('elsewhere')).not.toBeInTheDocument()
    // Signed out on the same link, the invitation is claimed with a password.
    expect(await screen.findByRole('button', { name: enAuth.activate.submit })).toBeInTheDocument()
    expect(mockedConsume).not.toHaveBeenCalled()
  })

  it('offers the switch when finishing opened a teacher account apart from the signed-in one', async () => {
    // One address may hold one account per role: a student account finishing
    // the invitation gets a teacher account of its own.
    const student = { id: 'student-1', name: 'Sam', email: 'sam@stoa.test', role: 'student' } as CurrentUser
    signedInAs(student)
    mockedConsume.mockResolvedValue(TEACHER)
    open('/teacher-activate', <TeacherActivatePage />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: enAuth.activate.finish }))
    await screen.findByText(enAuth.activate.success)

    const values = { current: 'Sam', activated: 'sam@stoa.test' }
    await user.click(screen.getByRole('button', { name: fill(H.switch, values) }))

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(await screen.findByRole('form', { name: 'sign in' })).toHaveAttribute('data-email', 'sam@stoa.test')
  })

  it('keeps the plain link when finishing activated the signed-in account itself', async () => {
    signedInAs({ ...ADMIN, id: 'teacher-9' })
    mockedConsume.mockResolvedValue(TEACHER)
    open('/teacher-activate', <TeacherActivatePage />)
    await userEvent.setup().click(screen.getByRole('button', { name: enAuth.activate.finish }))
    await screen.findByText(enAuth.activate.success)

    expect(screen.queryByTestId('activation-switch')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: enAuth.activate.signIn })).toBeInTheDocument()
  })

  it('keeps the plain link after a claim signed in as nobody, with the address carried along', async () => {
    mockedTeacherClaim.mockResolvedValue({ ...TEACHER, email: 'teach@stoa.test' })
    open('/teacher-activate', <TeacherActivatePage />)
    const user = await claimTeacher()

    await user.click(screen.getByRole('link', { name: enAuth.activate.signIn }))

    expect(await screen.findByRole('form', { name: 'sign in' })).toHaveAttribute('data-email', 'teach@stoa.test')
  })

  it('names "the new account" when a claim made while signed in answers without an address', async () => {
    mockedTeacherClaim.mockResolvedValue(TEACHER)
    open('/teacher-activate', <TeacherActivatePage />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(enAuth.register.password), GOOD)
    await user.type(screen.getByLabelText(enAuth.activate.confirmPassword), GOOD)
    // Signed in from another tab while the password was being chosen.
    await user.click(screen.getByRole('button', { name: enAuth.activate.submit }))
    signedInAs(ADMIN)

    expect(
      await screen.findByRole('button', { name: fill(H.switchToNew, { current: 'Ada Admin' }) }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('activation-switch')).toHaveTextContent(H.activatedUnnamed)
  })
})

describe('the switch in every language (#626)', () => {
  const AUTH = { de: deAuth, en: enAuth, fr: frAuth, it: itAuth }
  const placeholders = (text: string) => [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort()

  it.each(Object.keys(AUTH) as (keyof typeof AUTH)[])('%s has every sentence, with the same names in it', (lang) => {
    const own = AUTH[lang].activationHandoff as Record<string, string>
    expect(Object.keys(own).sort()).toEqual(Object.keys(H).sort())
    for (const [key, english] of Object.entries(H as Record<string, string>)) {
      expect(own[key].trim(), `${lang} ${key}`).not.toBe('')
      expect(placeholders(own[key]), `${lang} ${key}`).toEqual(placeholders(english))
    }
  })
})
