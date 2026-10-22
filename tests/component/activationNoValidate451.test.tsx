/**
 * The two activation forms answer with their own checks, not the browser's
 * (#451).
 *
 * - Without `noValidate`, an empty `required` field stopped the submit with
 *   the browser's own prompt, in the browser's language, and the page's
 *   error, `aria-invalid` and error id (#409) never ran. jsdom stops the
 *   submit the same way, so the empty-field cases fail without the fix.
 * - A date of birth typed only in part reads as '' and was sent as "no date".
 *   jsdom has no partially typed dates, so the field is given the validity a
 *   browser reports for one (Chromium: `value` '' and `badInput` true).
 *
 * Through the real API layer against a mocked backend.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import deAdmin from '@/i18n/locales/de/admin.json'
import enAdmin from '@/i18n/locales/en/admin.json'
import enAuth from '@/i18n/locales/en/auth.json'
import enErrors from '@/i18n/locales/en/errors.json'
import frAdmin from '@/i18n/locales/fr/admin.json'
import itAdmin from '@/i18n/locales/it/admin.json'
import { ActivateAccountPage } from '@/pages/auth/ActivateAccountPage'
import { TeacherActivatePage } from '@/pages/auth/TeacherActivatePage'
import { useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

const TOKEN = 'invitation-token-32-characters-long'
const GOOD = 'ValidPass12!'

function renderAt(path: string, url: string, page: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path={path} element={page} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

type Page = {
  name: string
  open: () => void
  claimUrl: string
  copy: { confirmPassword: string; submit: string; success: string; passwordMismatch: string }
}

const PAGES: Page[] = [
  {
    name: 'the account activation',
    open: () => renderAt('/activate', `/activate?token=${TOKEN}`, <ActivateAccountPage />),
    claimUrl: 'https://api.test/auth/invitations/claim',
    copy: enAdmin.activation,
  },
  {
    name: 'the teacher activation',
    open: () => renderAt('/teacher-activate', `/teacher-activate?token=${TOKEN}`, <TeacherActivatePage />),
    claimUrl: 'https://api.test/teacher-applications/activation/claim',
    copy: enAuth.activate,
  },
]

/** Every claim the backend is sent, answered as a success. */
function recordClaims(page: Page) {
  const claims: Record<string, unknown>[] = []
  mswServer.use(
    http.post(page.claimUrl, async ({ request }) => {
      claims.push((await request.json()) as Record<string, unknown>)
      return HttpResponse.json({ status: 'activated', email: 'ada@example.com' })
    }),
  )
  return claims
}

/** Types what is given, leaves the rest empty, and submits. */
async function submit(page: Page, { password = '', confirm = '' }: { password?: string; confirm?: string }) {
  const user = userEvent.setup()
  if (password) await user.type(screen.getByLabelText(enAuth.register.password), password)
  if (confirm) await user.type(screen.getByLabelText(page.copy.confirmPassword), confirm)
  await user.click(screen.getByRole('button', { name: page.copy.submit }))
}

/** Exactly the field labelled `label` is marked invalid and reads the alert. */
async function expectOnlyInvalid(label: string, message: string) {
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent(message)
  for (const field of document.querySelectorAll<HTMLInputElement>('form input')) {
    const name = document.querySelector(`label[for="${field.id}"]`)?.textContent
    if (name === label) {
      expect(field, name).toHaveAttribute('aria-invalid', 'true')
      expect(field.getAttribute('aria-describedby')?.split(' ')[0]).toBe(alert.id)
    } else {
      expect(field, name ?? field.id).not.toHaveAttribute('aria-invalid')
    }
  }
}

/** What a browser reports for a date typed only in part: no value, and bad input. */
function typeHalfADate(field: HTMLElement) {
  expect(field).toHaveValue('')
  Object.defineProperty(field, 'validity', { configurable: true, value: { badInput: true, valid: false } })
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
beforeEach(async () => {
  await i18n.changeLanguage('en')
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})
afterEach(() => {
  mswServer.resetHandlers()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})
afterAll(() => mswServer.close())

describe.each(PAGES)('$name', (page) => {
  it('answers an empty password with its own rule, tied to the password field', async () => {
    const claims = recordClaims(page)
    page.open()

    await submit(page, {})

    await expectOnlyInvalid(enAuth.register.password, enErrors.passwordRequirements)
    expect(claims).toEqual([])
  })

  it('answers an empty confirmation as a mismatch, tied to the confirmation field', async () => {
    const claims = recordClaims(page)
    page.open()

    await submit(page, { password: GOOD })

    await expectOnlyInvalid(page.copy.confirmPassword, page.copy.passwordMismatch)
    expect(claims).toEqual([])
  })
})

describe('the account activation, its date of birth', () => {
  const page = PAGES[0]

  it('answers a date typed only in part, tied to the date field, and sends nothing', async () => {
    const claims = recordClaims(page)
    page.open()
    typeHalfADate(screen.getByLabelText(enAdmin.activation.dateOfBirth))

    await submit(page, { password: GOOD, confirm: GOOD })

    await expectOnlyInvalid(enAdmin.activation.dateOfBirth, enAdmin.activation.dateOfBirthIncomplete)
    expect(claims).toEqual([])
  })

  it.each([
    ['en', enAdmin],
    ['de', deAdmin],
    ['fr', frAdmin],
    ['it', itAdmin],
  ])('says so in %s', async (language, copy) => {
    recordClaims(page)
    await i18n.changeLanguage(language)
    page.open()
    typeHalfADate(screen.getByLabelText(copy.activation.dateOfBirth))
    const user = userEvent.setup()
    await user.type(document.getElementById('activation-password') as HTMLElement, GOOD)
    await user.type(document.getElementById('activation-password-confirm') as HTMLElement, GOOD)

    await user.click(screen.getByRole('button', { name: copy.activation.submit }))

    expect(await screen.findByRole('alert')).toHaveTextContent(copy.activation.dateOfBirthIncomplete)
  })

  it('still sends a date left empty as no date', async () => {
    const claims = recordClaims(page)
    page.open()

    await submit(page, { password: GOOD, confirm: GOOD })

    await screen.findByText(enAdmin.activation.success)
    expect(claims).toEqual([{ token: TOKEN, password: GOOD }])
  })

  it('sends a whole date as typed', async () => {
    const claims = recordClaims(page)
    page.open()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(enAdmin.activation.dateOfBirth), '2012-03-04')

    await submit(page, { password: GOOD, confirm: GOOD })

    await waitFor(() => expect(claims).toEqual([{ token: TOKEN, password: GOOD, dateOfBirth: '2012-03-04' }]))
  })
})
