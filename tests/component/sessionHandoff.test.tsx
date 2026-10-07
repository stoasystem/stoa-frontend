/**
 * One person signs out and the next one signs in on the same tab while the
 * first person's requests are still on their way (#34). Whatever those requests
 * bring back belongs to the person who sent them: it must not end up in the
 * next person's storage or cache, and a 401 they carry must not sign the next
 * person out.
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryClient } from '@/app/query/queryClient'
import { useSignOut } from '@/hooks/auth/useSignOut'
import { useCreateConversationMutation } from '@/hooks/chat/useCreateConversationMutation'
import { PENDING_MESSAGE_KEY_PREFIX, rememberPendingMessage } from '@/lib/pendingChatMessages'
import { TAB_TOKEN_KEY } from '@/lib/devSessions'
import {
  CHECKOUT_OPERATION_STORAGE_KEY,
  createCheckoutSession,
  getCheckoutOperation,
  supersedeCheckoutCommand,
} from '@/services/billing/billingApi'
import { getConversations } from '@/services/chat/chatApi'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'
import { type CurrentUser, TOKEN_KEY, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

const ada = { id: 'u-a', name: 'Ada', email: 'ada@example.com', role: 'parent' } as CurrentUser
const bea = { id: 'u-b', name: 'Bea', email: 'bea@example.com', role: 'parent' } as CurrentUser

// A request of A's that is answered when the test says so.
function gate() {
  let open!: () => void
  const opened = new Promise<void>((resolve) => {
    open = resolve
  })
  return { opened, open }
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/billing']}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

function renderAsAda() {
  localStorage.setItem(TOKEN_KEY, 'token-a')
  useAuthStore.setState({ user: ada, accessToken: 'token-a', isAuthenticated: true })
  const { result } = renderHook(
    () => ({
      ...useSignOut(),
      createConversation: useCreateConversationMutation({
        // What the Ask panel does with a conversation it created.
        onCreated: (conversation) =>
          rememberPendingMessage(conversation.id, {
            idempotencyKey: 'initial-a',
            content: "A's first question",
            askedAt: '2026-09-27T10:00:00Z',
          }),
      }),
    }),
    { wrapper },
  )
  return result
}

async function adaLeavesAndBeaSignsIn(result: ReturnType<typeof renderAsAda>) {
  await act(() => result.current.signOut())
  act(() => useAuthStore.getState().setAuth(bea, 'token-b'))
}

function expectBeaStillSignedIn() {
  expect(localStorage.getItem(TOKEN_KEY)).toBe('token-b')
  expect(useAuthStore.getState().accessToken).toBe('token-b')
  expect(useAuthStore.getState().user?.id).toBe('u-b')
  expect(useAuthStore.getState().isAuthenticated).toBe(true)
}

function pendingMessageKeys() {
  return Object.keys(sessionStorage).filter((key) => key.startsWith(PENDING_MESSAGE_KEY_PREFIX))
}

const originalLocation = window.location
const assign = vi.fn()

describe("the first person's late answers after the next one signed in", () => {
  beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    queryClient.clear()
    assign.mockReset()
    Object.defineProperty(window, 'location', {
      value: { assign, pathname: '/billing' },
      writable: true,
      configurable: true,
    })
    mswServer.use(http.post('https://api.test/auth/logout', () => new HttpResponse(null, { status: 204 })))
  })
  afterEach(() => {
    mswServer.resetHandlers()
    queryClient.clear()
    useAuthStore.getState().clearAuth()
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true, configurable: true })
    vi.restoreAllMocks()
  })
  afterAll(() => mswServer.close())

  it("does not sign the next person out with a 401 the first person's request earned", async () => {
    const late = gate()
    const served = gate()
    mswServer.use(
      http.get('https://api.test/conversations', async () => {
        served.open()
        await late.opened
        return HttpResponse.json({ detail: { code: 'invalid_token', message: 'expired' } }, { status: 401 })
      }),
    )
    const result = renderAsAda()
    // Called outside the cache, because clearing the cache only stops reading
    // the answer; the request itself is still on its way and still answered.
    const request = getConversations()
    await served.opened

    await adaLeavesAndBeaSignsIn(result)
    late.open()
    await expect(request).rejects.toBeTruthy()

    expectBeaStillSignedIn()
    expect(assign).not.toHaveBeenCalled()
  })

  it('does not sign anyone out with a 401 for a request sent before anyone signed in', async () => {
    localStorage.removeItem(TOKEN_KEY)
    const late = gate()
    const served = gate()
    mswServer.use(
      http.get('https://api.test/conversations', async ({ request }) => {
        // Sent without a session, so it carried no Authorization header.
        expect(request.headers.get('authorization')).toBeNull()
        served.open()
        await late.opened
        return HttpResponse.json({ detail: 'not signed in' }, { status: 401 })
      }),
    )
    const request = getConversations()
    await served.opened

    act(() => useAuthStore.getState().setAuth(bea, 'token-b'))
    late.open()
    await expect(request).rejects.toBeTruthy()

    expectBeaStillSignedIn()
    expect(assign).not.toHaveBeenCalled()
  })

  it("still signs a person out with a 401 their own request earned", async () => {
    mswServer.use(
      http.get('https://api.test/conversations', () =>
        HttpResponse.json({ detail: 'expired' }, { status: 401 }),
      ),
    )
    act(() => useAuthStore.getState().setAuth(bea, 'token-b'))

    await expect(getConversations()).rejects.toBeTruthy()

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(assign).toHaveBeenCalledWith('/login')
  })

  it("keeps the first person's late checkout out of the next person's tab", async () => {
    const late = gate()
    const served = gate()
    const keys: Array<string | null> = []
    mswServer.use(
      http.post('https://api.test/parents/me/subscription/checkout', async ({ request }) => {
        keys.push(request.headers.get('idempotency-key'))
        if (request.headers.get('authorization') === 'Bearer token-a') {
          served.open()
          await late.opened
        }
        const who = request.headers.get('authorization') === 'Bearer token-a' ? 'a' : 'b'
        return HttpResponse.json({
          checkoutRef: `ref-${who}`,
          commandState: 'pending',
          checkoutSessionId: `cs-${who}`,
          checkoutUrl: '',
          safeActions: [],
          targetPlan: 'family',
          beneficiaries: [],
        })
      }),
    )
    const result = renderAsAda()
    const adaCheckout = createCheckoutSession({ plan: 'family' as never, beneficiaryIds: [] })
    await served.opened

    await adaLeavesAndBeaSignsIn(result)
    // Nothing of A's checkout is left once A has signed out.
    expect(sessionStorage.getItem(CHECKOUT_OPERATION_STORAGE_KEY)).toBeNull()
    late.open()
    await adaCheckout.catch(() => undefined)

    expect(getCheckoutOperation()).toBeNull()
    expectBeaStillSignedIn()

    // B starts a checkout of her own, under a key of her own.
    await expect(createCheckoutSession({ plan: 'family' as never, beneficiaryIds: [] })).resolves.toEqual(
      expect.objectContaining({ checkoutRef: 'ref-b' }),
    )
    expect(getCheckoutOperation()?.checkoutRef).toBe('ref-b')
    expect(keys).toHaveLength(2)
    expect(keys[1]).not.toBe(keys[0])
  })

  it("keeps the first person's late replacement checkout out of the next person's tab", async () => {
    const late = gate()
    const served = gate()
    mswServer.use(
      http.post('https://api.test/parents/me/subscription/checkout/ref-a/supersede', async () => {
        served.open()
        await late.opened
        return HttpResponse.json({
          checkoutRef: 'ref-a-successor',
          commandState: 'pending',
          checkoutUrl: '',
          safeActions: [],
        })
      }),
    )
    const result = renderAsAda()
    sessionStorage.setItem(
      CHECKOUT_OPERATION_STORAGE_KEY,
      JSON.stringify({ idempotencyKey: 'key-of-a-checkout', checkoutRef: 'ref-a' }),
    )
    const adaReplacement = supersedeCheckoutCommand('ref-a', { plan: 'family' as never, beneficiaryIds: [] })
    await served.opened

    await adaLeavesAndBeaSignsIn(result)
    late.open()
    await adaReplacement.catch(() => undefined)

    expect(getCheckoutOperation()).toBeNull()
    expectBeaStillSignedIn()
  })

  it("keeps the first person's late new conversation out of the next person's tab", async () => {
    const late = gate()
    const served = gate()
    mswServer.use(
      http.post('https://api.test/conversations', async () => {
        served.open()
        await late.opened
        return HttpResponse.json({
          id: 'conv-a',
          title: "A's question",
          subject: 'math',
          updatedAt: '2026-09-27T10:00:00Z',
          messages: [],
        })
      }),
    )
    const result = renderAsAda()
    act(() => result.current.createConversation.mutate({ subject: 'math' } as never))
    await served.opened

    await adaLeavesAndBeaSignsIn(result)
    late.open()
    await waitFor(() => expect(result.current.createConversation.isError).toBe(true))

    expect(queryClient.getQueryData(chatQueryKeys.conversations())).toBeUndefined()
    expect(queryClient.getQueryData(chatQueryKeys.conversation('conv-a'))).toBeUndefined()
    expect(pendingMessageKeys()).toEqual([])
    expectBeaStillSignedIn()
  })

  it("keeps the first person's late query answer out of the next person's cache", async () => {
    const late = gate()
    const served = gate()
    mswServer.use(
      http.get('https://api.test/conversations', async ({ request }) => {
        if (request.headers.get('authorization') === 'Bearer token-a') {
          served.open()
          await late.opened
          return HttpResponse.json({ items: [{ id: 'conv-a', title: "A's question" }] })
        }
        return HttpResponse.json({ items: [] })
      }),
    )
    const result = renderAsAda()
    void queryClient.prefetchQuery({ queryKey: chatQueryKeys.conversations(), queryFn: getConversations })
    await served.opened

    await adaLeavesAndBeaSignsIn(result)
    late.open()
    await act(() => delay(50))

    expect(queryClient.getQueryData(chatQueryKeys.conversations())).toBeUndefined()
    await expect(
      queryClient.fetchQuery({ queryKey: chatQueryKeys.conversations(), queryFn: getConversations }),
    ).resolves.toEqual({ items: [] })
    expectBeaStillSignedIn()
  })
})

describe('signing out of a tab pinned to one role', () => {
  beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => {
    mswServer.resetHandlers()
    queryClient.clear()
    vi.restoreAllMocks()
  })
  afterAll(() => mswServer.close())
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('leaves the session the rest of the browser shares, which was never revoked', async () => {
    const revoked: unknown[] = []
    mswServer.use(
      http.post('https://api.test/auth/logout', async ({ request }) => {
        revoked.push(await request.json())
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const result = renderAsAda()
    sessionStorage.setItem(TAB_TOKEN_KEY, 'token-pinned')

    await act(() => result.current.signOut())

    expect(revoked).toEqual([{ access_token: 'token-pinned' }])
    expect(sessionStorage.getItem(TAB_TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(TOKEN_KEY)).toBe('token-a')
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('clears the shared session too when it is the very one this tab revoked', async () => {
    mswServer.use(http.post('https://api.test/auth/logout', () => new HttpResponse(null, { status: 204 })))
    const result = renderAsAda()
    sessionStorage.setItem(TAB_TOKEN_KEY, 'token-a')

    await act(() => result.current.signOut())

    expect(sessionStorage.getItem(TAB_TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })
})
