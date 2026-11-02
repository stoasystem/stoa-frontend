/*
 * A photo by QR for a new question (#554, stoa-backend#191): the code is made
 * for no conversation, and followed by the upload it reserved.
 *
 *   - a code is made with no conversation open, and with one;
 *   - the computer asks after it by its upload, never by a conversation;
 *   - the card belongs to the question it was opened for: sending a new
 *     question's first message gives it a conversation and keeps the card,
 *     while opening another conversation closes it.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePhoneUploadCode } from '@/features/uploads/usePhoneUploadCode'
import { createUploadCode, readUploadCode, readUploadCodePhoto } from '@/services/files/uploadCodeApi'

vi.mock('@/services/files/uploadCodeApi', () => ({
  createUploadCode: vi.fn(),
  readUploadCode: vi.fn(),
  readUploadCodePhoto: vi.fn(),
}))

const UPLOAD_ID = 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2'
const inTen = () => new Date(Date.now() + 10 * 60 * 1000).toISOString()

function setUp(start: string | null) {
  vi.mocked(createUploadCode).mockResolvedValue({ codeId: 'b2'.repeat(16), code: 'x.y', expiresAt: inTen(), uploadId: UPLOAD_ID })
  vi.mocked(readUploadCode).mockResolvedValue({ codeId: 'b2'.repeat(16), status: 'waiting', expiresAt: inTen(), redeemedAt: null, uploadId: null })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
  return renderHook(({ conversationId }: { conversationId: string | null }) => usePhoneUploadCode(conversationId), {
    wrapper,
    initialProps: { conversationId: start },
  })
}

afterEach(() => vi.clearAllMocks())

describe('a code for a new question', () => {
  it('is made with no conversation open, and followed by the upload it reserved', async () => {
    const hook = setUp(null)
    act(() => hook.result.current.start())
    await waitFor(() => expect(hook.result.current.view?.step).toBe('waiting'))
    expect(createUploadCode).toHaveBeenCalledWith()
    await waitFor(() => expect(readUploadCode).toHaveBeenCalledWith(UPLOAD_ID, expect.anything()))
    expect(readUploadCodePhoto).not.toHaveBeenCalled()
  })

  it('keeps its card when the first message gives the question its conversation', async () => {
    const hook = setUp(null)
    act(() => hook.result.current.start())
    await waitFor(() => expect(hook.result.current.view?.step).toBe('waiting'))
    hook.rerender({ conversationId: 'c-new' })
    expect(hook.result.current.view?.step).toBe('waiting')
  })

  it('closes its card when another conversation is opened', async () => {
    const hook = setUp('c1')
    act(() => hook.result.current.start())
    await waitFor(() => expect(hook.result.current.view?.step).toBe('waiting'))
    expect(createUploadCode).toHaveBeenCalledWith()
    hook.rerender({ conversationId: 'c2' })
    expect(hook.result.current.view).toBeNull()
    hook.rerender({ conversationId: null })
    expect(hook.result.current.view).toBeNull()
  })
})
