/**
 * A student with no year group is told to add one (#154).
 *
 * The old chat page said so. Ask replaced that page, `/chat` redirects here,
 * and the sentence did not come with it — so the only person who could fix
 * it was never told, while every answer was pitched at nobody in particular.
 * The four translations were in the locale files the whole time.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { AskPanel } from '@/features/ask/AskPanel'
import { AskServerProvider } from '@/features/ask/server/askServer'
import { useAskController } from '@/features/ask/useAskController'
import type { StudentProfile } from '@/types/student'
import { createFakeAskServer, type FakeAskServer } from '../fakes/askServer'

/** The server behind Ask, in memory (#571): each test says which year group the profile has. */
let server: FakeAskServer

/** The student's profile, as the server answers it from now on. */
function profileHas(grade: string) {
  server.profile = { grade } as StudentProfile
}

function Host() {
  const controller = useAskController()
  return <AskPanel controller={controller} layout="panel" subjectId="mathematics" />
}

function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AskServerProvider value={server}>
          <Host />
        </AskServerProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  // Nothing listed: the fake's own default.
  server = createFakeAskServer()
})
afterEach(() => vi.clearAllMocks())

describe('a student with no year group', () => {
  it('is told where to add it, and the link goes to their account', async () => {
    profileHas('')

    show()

    const hint = await screen.findByRole('link', { name: i18n.t('gradeMissingHint', { ns: 'chat' }) })
    expect(hint).toHaveAttribute('href', '/me#me-grade')
  })

  it('has the composer point at it, so a screen reader hears it on the field', async () => {
    profileHas('')

    const { container } = show()

    await waitFor(() => expect(container.querySelector('#ask-grade-missing')).not.toBeNull())
    const field = container.querySelector('textarea')!
    expect(field.getAttribute('aria-describedby')).toBe('ask-grade-missing')
  })
})

describe('a student who has one', () => {
  it('is not told anything', async () => {
    profileHas('grade_6_primary')

    const { container } = show()

    // The profile has to have arrived before "no hint" means anything: the
    // first render has no profile at all, so asserting too early passes for
    // the wrong reason.
    await waitFor(() => expect(container.querySelector('textarea')?.placeholder).toBeTruthy())
    await waitFor(() => expect(server.student.getStudentProfile).toHaveBeenCalled())
    await act(async () => {
      await Promise.resolve()
    })
    expect(container.querySelector('#ask-grade-missing')).toBeNull()
    expect(container.querySelector('textarea')?.getAttribute('aria-describedby')).toBeNull()
  })
})
