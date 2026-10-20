/**
 * What the teacher activation page says when the claim or the finish step is
 * refused (#367).
 *
 * A code the page has a sentence for reads in the teacher's language. Any
 * other code — a rate limit, `application_version_not_found`, one the backend
 * adds later — used to be shown as it arrived, in snake_case, against #265
 * ("error codes never reach the screen"). It now gets the page's generic
 * sentence, and so does a refusal with no code at all.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import deAuth from '@/i18n/locales/de/auth.json'
import enAuth from '@/i18n/locales/en/auth.json'
import frAuth from '@/i18n/locales/fr/auth.json'
import itAuth from '@/i18n/locales/it/auth.json'
import { TeacherActivatePage } from '@/pages/auth/TeacherActivatePage'
import { ApiError, apiErrorFromBody } from '@/services/api/httpClient'
import { claimTeacherInvitation, consumeTeacherInvitation } from '@/services/teacher/teacherApplicationApi'
import { useAuthStore } from '@/store/authStore'

vi.mock('@/services/teacher/teacherApplicationApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/teacher/teacherApplicationApi')>(
    '@/services/teacher/teacherApplicationApi',
  )
  return { ...actual, claimTeacherInvitation: vi.fn(), consumeTeacherInvitation: vi.fn() }
})

const mockedClaim = vi.mocked(claimTeacherInvitation)
const mockedConsume = vi.mocked(consumeTeacherInvitation)

const AUTH = { de: deAuth, en: enAuth, fr: frAuth, it: itAuth } as const
const LANGUAGES = Object.keys(AUTH) as (keyof typeof AUTH)[]
const TOKEN = 'invitation-token-32-characters-long'

/** A refusal as the HTTP client builds it from the backend's body. */
function refusal(status: number, detail: Record<string, string>) {
  return apiErrorFromBody({ detail }, { status, fallback: `Request failed with status code ${status}` })
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/teacher-activate?token=${TOKEN}`]}>
        <Routes>
          <Route path="/teacher-activate" element={<TeacherActivatePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** Claims with a valid password and returns what the alert says. */
async function claimAndReadAlert() {
  const user = userEvent.setup()
  renderPage()
  await user.type(screen.getByLabelText(i18n.t('auth:register.password')), 'ValidPass12!')
  await user.type(screen.getByLabelText(i18n.t('auth:activate.confirmPassword')), 'ValidPass12!')
  await user.click(screen.getByRole('button', { name: i18n.t('auth:activate.submit') }))
  return (await screen.findByRole('alert')).textContent
}

let languageBefore = 'en'

beforeEach(() => {
  languageBefore = i18n.language
  mockedClaim.mockReset()
  mockedConsume.mockReset()
  useAuthStore.setState({ isAuthenticated: false })
})

afterEach(async () => {
  useAuthStore.setState({ isAuthenticated: false })
  await i18n.changeLanguage(languageBefore)
})

describe.each(LANGUAGES)('teacher activation errors in %s (#367)', (lang) => {
  beforeEach(async () => {
    await i18n.changeLanguage(lang)
  })

  it('reads a known code from the page’s own sentences', async () => {
    mockedClaim.mockRejectedValue(refusal(410, { code: 'invitation_expired' }))

    expect(await claimAndReadAlert()).toBe(AUTH[lang].activate.errors.invitation_expired)
  })

  it('gives an unknown code the generic sentence, never the code', async () => {
    mockedClaim.mockRejectedValue(refusal(404, { code: 'application_version_not_found' }))

    const alert = await claimAndReadAlert()
    expect(alert).toBe(AUTH[lang].activate.failed)
    expect(document.body.textContent).not.toContain('application_version_not_found')
  })

  it('gives a refusal with no code the generic sentence', async () => {
    mockedClaim.mockRejectedValue(new ApiError('Request failed with status code 500', { status: 500 }))

    expect(await claimAndReadAlert()).toBe(AUTH[lang].activate.failed)
  })

  it('never shows the code of a rate limit', async () => {
    mockedClaim.mockRejectedValue(
      refusal(429, {
        code: 'auth_request_rate_limited',
        message: 'Too many attempts. Wait a few minutes before trying again.',
      }),
    )

    const alert = await claimAndReadAlert()
    expect(document.body.textContent).not.toContain('auth_request_rate_limited')
    // The server's sentence is English: an English reader gets it, everyone
    // else the page's own sentence (#265).
    expect(alert).toBe(
      lang === 'en' ? 'Too many attempts. Wait a few minutes before trying again.' : AUTH[lang].activate.failed,
    )
  })

  it('gives an unknown code on the signed-in finish step the generic sentence', async () => {
    useAuthStore.setState({ isAuthenticated: true })
    mockedConsume.mockRejectedValue(refusal(409, { code: 'some_code_added_later' }))
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: AUTH[lang].activate.finish }))

    expect((await screen.findByRole('alert')).textContent).toBe(AUTH[lang].activate.failed)
    expect(document.body.textContent).not.toContain('some_code_added_later')
  })
})
