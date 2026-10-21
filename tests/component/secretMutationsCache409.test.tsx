/**
 * The sign-in and the activations do not leave a password or an invitation
 * token in the query client's cache (#409).
 *
 * A mutation keeps its variables in the client's mutation cache until it is
 * collected, five minutes after nothing shows it any more by default. The
 * password change already collected its own at once (`gcTime: 0`); the
 * sign-in and the two activations kept the password, and the activations the
 * token, for those five minutes after their page had gone.
 *
 * The client here keeps the library's default, as the app's does, so it is
 * each hook's own setting that is under test.
 */
import { QueryClient, QueryClientProvider, type UseMutationResult } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { useClaimInvitationMutation } from '@/hooks/admin/useAdminAccounts'
import { useLoginMutation } from '@/hooks/auth/useLoginMutation'
import {
  useClaimTeacherInvitationMutation,
  useConsumeTeacherInvitationMutation,
} from '@/hooks/teacher/useTeacherApplication'
import { useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

const PASSWORD = 'Secret!Pass123'
const TOKEN = 'invitation-token-32-characters-long'

const refused = () => HttpResponse.json({ detail: { code: 'refused', message: 'refused' } }, { status: 400 })
const accepted = () => HttpResponse.json({ status: 'activated', email: 'ada@example.com' })

const CASES: { name: string; url: string; reply: () => Response; secret: string; use: () => unknown; variables: unknown }[] = [
  {
    name: 'the sign-in',
    url: 'https://api.test/auth/login',
    reply: refused,
    secret: PASSWORD,
    use: () => useLoginMutation(),
    variables: { email: 'ada@example.com', password: PASSWORD },
  },
  {
    name: 'the account activation',
    url: 'https://api.test/auth/invitations/claim',
    reply: accepted,
    secret: PASSWORD,
    use: () => useClaimInvitationMutation(),
    variables: { token: TOKEN, password: PASSWORD, dateOfBirth: '' },
  },
  {
    name: 'the teacher activation',
    url: 'https://api.test/teacher-applications/activation/claim',
    reply: accepted,
    secret: PASSWORD,
    use: () => useClaimTeacherInvitationMutation(),
    variables: { token: TOKEN, password: PASSWORD },
  },
  {
    name: 'the teacher activation’s finish step',
    url: 'https://api.test/teacher-applications/activation/consume',
    reply: accepted,
    secret: TOKEN,
    use: () => useConsumeTeacherInvitationMutation(),
    variables: TOKEN,
  },
]

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  mswServer.resetHandlers()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})
afterAll(() => mswServer.close())

describe.each(CASES)('$name', ({ url, reply, secret, use, variables }) => {
  it('keeps no variables in the cache once it has settled and its page is gone', async () => {
    mswServer.use(http.post(url, reply))
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const { result, unmount } = renderHook(() => use() as UseMutationResult<unknown, Error, unknown>, { wrapper })

    result.current.mutate(variables)
    await waitFor(() => expect(result.current.isPending || result.current.isIdle).toBe(false))
    // Control: while the page shows it, the mutation does hold the secret.
    expect(JSON.stringify(client.getMutationCache().getAll().map((m) => m.state.variables))).toContain(secret)

    unmount()

    await waitFor(() => expect(client.getMutationCache().getAll()).toHaveLength(0))
  })

  it('keeps no variables in the cache once it settles after its page has gone', async () => {
    let answer: () => void = () => {}
    let answered = false
    mswServer.use(
      http.post(url, async () => {
        await new Promise<void>((resolve) => {
          answer = resolve
        })
        answered = true
        return reply()
      }),
    )
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const { result, unmount } = renderHook(() => use() as UseMutationResult<unknown, Error, unknown>, { wrapper })

    result.current.mutate(variables)
    await waitFor(() => expect(result.current.isPending).toBe(true))
    unmount()
    // Still on its way: the request needs its variables until it settles.
    expect(client.getMutationCache().getAll()).toHaveLength(1)

    answer()
    await waitFor(() => expect(answered).toBe(true))
    await waitFor(() => expect(client.getMutationCache().getAll()).toHaveLength(0))
  })
})
