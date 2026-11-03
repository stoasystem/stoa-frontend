/**
 * #511 (stoa-backend#141): a help request offered to a teacher leaves a
 * notification in the bell, which opens that request, and a reminder email,
 * which the teacher can switch off on /teacher/profile. The bell notification
 * cannot be switched off.
 *
 * Driven through the real API layer against a mocked backend, so what is
 * checked is what reaches `PATCH /notifications/preferences`.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Suspense } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { AppRoutes } from '@/app/router/AppRoutes'
import { TeacherNotificationSettingsCard } from '@/components/teacher/TeacherNotificationSettingsCard'
import {
  useUpdateDispatchEmailMutation,
  useUpdateNotificationPreferencesMutation,
} from '@/hooks/notifications/useNotificationPreferences'
import i18n from '@/i18n'
import deTeacher from '@/i18n/locales/de/teacher.json'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

const de = deTeacher.profile.notifications
const LANGUAGES = ['de', 'en', 'fr', 'it'] as const

const MATRIX = {
  admin_operations: { in_app: true, realtime: true, email_digest: false, push: false },
  teacher_responses: { in_app: false, realtime: false, email_digest: true, push: false },
}

function backend({ dispatchEmail = true, saveFails = false } = {}) {
  const patches: unknown[] = []
  let stored = dispatchEmail
  const body = () => ({
    userId: 't-1',
    preferences: MATRIX,
    dispatchEmail: stored,
    supportedCategories: Object.keys(MATRIX),
    supportedChannels: ['email_digest', 'in_app', 'push', 'realtime'],
    updatedAt: null,
  })
  mswServer.use(
    http.get('https://api.test/notifications/preferences', () => HttpResponse.json(body())),
    http.patch('https://api.test/notifications/preferences', async ({ request }) => {
      const sent = (await request.json()) as { dispatchEmail?: boolean }
      patches.push(sent)
      if (saveFails) return new HttpResponse(null, { status: 500 })
      if (typeof sent.dispatchEmail === 'boolean') stored = sent.dispatchEmail
      return HttpResponse.json(body())
    }),
  )
  return patches
}

function client() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}

function renderCard() {
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client()}>
        <TeacherNotificationSettingsCard />
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

async function dispatchSwitch() {
  return screen.findByRole('switch', { name: de.dispatchEmail.title })
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
beforeEach(async () => {
  await i18n.changeLanguage('de')
})
afterEach(() => {
  mswServer.resetHandlers()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})
afterAll(() => mswServer.close())

describe('the dispatch email switch', () => {
  it('is on /teacher/profile, even when the profile itself does not load', async () => {
    backend()
    mswServer.use(
      http.get('https://api.test/teachers/me/profile', () => new HttpResponse(null, { status: 500 })),
      http.get('https://api.test/notifications', () => HttpResponse.json({ items: [], count: 0 })),
    )
    useAuthStore.setState({
      user: { id: 't-1', name: 'Anna Keller', email: 'anna@example.com', role: 'teacher' } as CurrentUser,
      accessToken: 'token',
      isAuthenticated: true,
    })
    render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client()}>
          <MemoryRouter initialEntries={['/teacher/profile']}>
            <Suspense fallback={null}>
              <AppRoutes />
            </Suspense>
          </MemoryRouter>
        </QueryClientProvider>
      </I18nextProvider>,
    )

    expect(await screen.findByText(de.title, {}, { timeout: 5_000 })).toBeInTheDocument()
    expect(await dispatchSwitch()).toBeChecked()
  })

  it('reads the stored value: off when the teacher turned it off', async () => {
    backend({ dispatchEmail: false })
    renderCard()

    expect(await dispatchSwitch()).not.toBeChecked()
  })

  it('says the bell notification stays, and offers no switch for it', async () => {
    backend()
    renderCard()

    await dispatchSwitch()
    expect(screen.getByText(de.description)).toBeInTheDocument()
    expect(screen.getAllByRole('switch')).toHaveLength(1)
  })

  it('turns the email off with the switch alone, leaving the matrix to the backend', async () => {
    const patches = backend()
    renderCard()

    await userEvent.click(await dispatchSwitch())

    await waitFor(() => expect(patches).toEqual([{ dispatchEmail: false }]))
    await waitFor(async () => expect(await dispatchSwitch()).not.toBeChecked())
  })

  it('turns it back on', async () => {
    const patches = backend({ dispatchEmail: false })
    renderCard()

    await userEvent.click(await dispatchSwitch())

    await waitFor(() => expect(patches).toEqual([{ dispatchEmail: true }]))
    await waitFor(async () => expect(await dispatchSwitch()).toBeChecked())
  })

  it('says when the change was not saved, and keeps showing what is stored', async () => {
    backend({ saveFails: true })
    renderCard()

    await userEvent.click(await dispatchSwitch())

    expect(await screen.findByRole('alert')).toHaveTextContent(de.saveFailed)
    expect(await dispatchSwitch()).toBeChecked()
  })

  // Read from the files, not through i18n, which would fall back to another
  // language for a missing key.
  it.each(LANGUAGES)('has its copy in %s', async (lng) => {
    const teacher = (await import(`@/i18n/locales/${lng}/teacher.json`)).default
    const copy = teacher.profile.notifications
    for (const text of [
      copy.title,
      copy.description,
      copy.dispatchEmail.title,
      copy.dispatchEmail.body,
      copy.loading,
      copy.unavailable,
      copy.saveFailed,
    ]) {
      expect(typeof text === 'string' && text.length > 0, `${lng}`).toBe(true)
    }
  })

  it('addresses the teacher with "Sie" in German', () => {
    const german = [de.description, de.dispatchEmail.body, de.saveFailed].join(' ')
    expect(german).toMatch(/\bIhnen\b|\bSie\b/)
    expect(german).not.toMatch(/\b(du|dir|dich|dein\w*)\b/i)
  })
})

/*
 * The switch and the matrix are written by two mutations, and each PATCH is
 * answered with the whole stored record, which goes straight into the cache.
 * Two writes in flight at once could land in either order, and the older
 * answer would then show over the newer; they wait for each other instead.
 */
describe('a dispatch email write and a matrix write', () => {
  it('go one after the other, never both at once', async () => {
    const order: string[] = []
    let release = () => {}
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    let inFlight = 0
    let most = 0
    mswServer.use(
      http.get('https://api.test/notifications/preferences', () =>
        HttpResponse.json({
          userId: 't-1',
          preferences: MATRIX,
          dispatchEmail: true,
          supportedCategories: Object.keys(MATRIX),
          supportedChannels: ['email_digest', 'in_app', 'push', 'realtime'],
          updatedAt: null,
        }),
      ),
      http.patch('https://api.test/notifications/preferences', async ({ request }) => {
        const sent = (await request.json()) as Record<string, unknown>
        const which = 'dispatchEmail' in sent ? 'dispatchEmail' : 'matrix'
        inFlight += 1
        most = Math.max(most, inFlight)
        order.push(`start ${which}`)
        if (which === 'matrix') await held
        order.push(`end ${which}`)
        inFlight -= 1
        return HttpResponse.json({
          userId: 't-1',
          preferences: MATRIX,
          dispatchEmail: which === 'dispatchEmail' ? sent.dispatchEmail : true,
          supportedCategories: Object.keys(MATRIX),
          supportedChannels: ['email_digest', 'in_app', 'push', 'realtime'],
          updatedAt: null,
        })
      }),
    )
    const queryClient = client()
    const { result } = renderHook(
      () => ({ matrix: useUpdateNotificationPreferencesMutation(), dispatch: useUpdateDispatchEmailMutation() }),
      { wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider> },
    )

    act(() => result.current.matrix.mutate((matrix) => matrix))
    await waitFor(() => expect(order).toEqual(['start matrix']))
    act(() => result.current.dispatch.mutate(false))
    // Give the second write every chance to go out early.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(order).toEqual(['start matrix'])

    release()
    await waitFor(() => expect(order).toEqual(['start matrix', 'end matrix', 'start dispatchEmail', 'end dispatchEmail']))
    expect(most).toBe(1)
  })
})
