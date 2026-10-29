/**
 * The hand-off from an upload to the message that carries it (#507).
 *
 * `POST /files/{id}/complete` answers `{"status":"validated","attachment":null}`
 * for every upload that passes, by design: the attachment is made when a
 * message carries `{uploadId}` (stoa-backend `complete_upload`,
 * `SendMessageRequest.attachmentIds`; #495). `uploadFile` threw on exactly that
 * answer, and the composer's own tests never saw it, because they answered
 * `uploadFile` itself. These answer only `httpClient`, with the shapes the
 * backend's OpenAPI gives, and follow the upload to the reference a message
 * sends -- and the conversation read back, whose files come as
 * `AttachmentSummary`.
 */
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAttachmentUploads } from '@/features/uploads/useAttachmentUploads'
import { readPendingMessage, writePendingMessage } from '@/lib/pendingChatMessages'
import { httpClient } from '@/services/api/httpClient'
import { getConversation } from '@/services/chat/chatApi'
import { problemFor } from '@/services/files/attachmentProblems'
import { UploadRejectedError, uploadFile } from '@/services/files/fileApi'

vi.mock('@/services/api/httpClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/api/httpClient')>()),
  httpClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const post = vi.mocked(httpClient.post)
const put = vi.mocked(httpClient.put)
const get = vi.mocked(httpClient.get)

const photo = () => new File([new Uint8Array(2048)], 'exercise.png', { type: 'image/png' })

/** The upload API as it answers: intent, part, then `complete` with `status`. */
function answerUploads(complete: Record<string, unknown>) {
  post.mockImplementation(async (url: string) => {
    if (url === '/files/intents') {
      return {
        data: {
          uploadId: 'up-1',
          expiresAt: '2026-10-29T10:30:00Z',
          maxBytes: 10 * 1024 * 1024,
          chunkBytes: 5 * 1024 * 1024,
          acceptedTypes: ['image/png'],
          status: 'pending_upload',
        },
      }
    }
    if (url === '/files/up-1/complete') return { data: { uploadId: 'up-1', ...complete } }
    throw new Error(`unexpected POST ${url}`)
  })
  put.mockResolvedValue({ data: {} })
}

beforeEach(() => {
  answerUploads({ status: 'validated', attachment: null })
})

afterEach(() => {
  sessionStorage.clear()
  vi.clearAllMocks()
})

describe('an upload that passed', () => {
  it('is the validated upload, though `complete` names no attachment', async () => {
    await expect(uploadFile({ file: photo() })).resolves.toEqual({
      uploadId: 'up-1',
      filename: 'exercise.png',
      mimeType: 'image/png',
      sizeBytes: 2048,
    })
    expect(post).toHaveBeenCalledWith('/files/up-1/complete', { partCount: 1 })
  })

  it('is refused when `complete` says it did not pass, in words the tray has', async () => {
    answerUploads({ status: 'invalid', attachment: null })

    const refused = await uploadFile({ file: photo() }).catch((error: unknown) => error)

    expect(refused).toBeInstanceOf(UploadRejectedError)
    expect(problemFor(refused)).toBe('unsupported')
  })

  it('is not taken as done while the server is still on it', async () => {
    answerUploads({ status: 'validating', attachment: null })

    await expect(uploadFile({ file: photo() })).rejects.toThrow('validating')
  })
})

describe('the composer, from upload to reference', () => {
  it('is ready with `{uploadId}`, the reference the message sends', async () => {
    const { result } = renderHook(() => useAttachmentUploads())

    act(() => result.current.add([photo()]))
    await waitFor(() => expect(result.current.drafts[0]?.state).toBe('ready'))

    expect(result.current.readyReferences).toEqual([{ uploadId: 'up-1' }])
    expect(result.current.readyAttachments).toMatchObject([{ id: 'up-1', filename: 'exercise.png' }])
    expect(result.current.drafts[0]?.problem).toBeUndefined()
  })

  it('fails the file, and sends nothing for it, when the upload did not pass (the negative control)', async () => {
    answerUploads({ status: 'invalid', attachment: null })
    const { result } = renderHook(() => useAttachmentUploads())

    act(() => result.current.add([photo()]))
    await waitFor(() => expect(result.current.drafts[0]?.state).toBe('failed'))

    expect(result.current.drafts[0]?.problem).toBe('unsupported')
    expect(result.current.readyReferences).toEqual([])
  })
})

describe('a message waiting in the tab', () => {
  it('keeps its references through a reload, and drops what the backend would refuse', () => {
    sessionStorage.setItem(
      'stoa_pending_chat_message:c1',
      JSON.stringify({
        idempotencyKey: 'k1',
        content: 'Here it is',
        askedAt: '2026-10-29T10:00:00Z',
        attachmentIds: [
          { uploadId: 'up-1' },
          { attachmentId: 'att-2' },
          'att-3',
          { uploadId: 'up-4', attachmentId: 'att-4' },
        ],
      }),
    )

    expect(readPendingMessage('c1')?.attachmentIds).toEqual([{ uploadId: 'up-1' }, { attachmentId: 'att-2' }])
  })

  it('round-trips what it wrote', () => {
    writePendingMessage('c1', {
      idempotencyKey: 'k1',
      content: 'Here it is',
      askedAt: '2026-10-29T10:00:00Z',
      attachmentIds: [{ uploadId: 'up-1' }],
    })

    expect(readPendingMessage('c1')?.attachmentIds).toEqual([{ uploadId: 'up-1' }])
  })
})

describe('the conversation read back', () => {
  it('names each file the way the thread reads it', async () => {
    get.mockResolvedValue({
      data: {
        id: 'c1',
        title: 'Linear equations',
        subject: 'math',
        grade: '8',
        updatedAt: '2026-10-29T10:00:00Z',
        messages: [
          {
            id: 'm1',
            conversationId: 'c1',
            role: 'student',
            content: 'Here it is',
            createdAt: '2026-10-29T10:00:00Z',
            attachments: [
              {
                attachmentId: 'att-1',
                filename: 'exercise.jpg',
                mediaType: 'image/jpeg',
                sizeBytes: 2048,
                status: 'active',
                createdAt: '2026-10-29T10:00:00Z',
              },
            ],
          },
          { id: 'm2', conversationId: 'c1', role: 'assistant', content: 'Let me see.', createdAt: '2026-10-29T10:00:01Z' },
        ],
      },
    })

    const conversation = await getConversation('c1')

    expect(conversation.messages[0].attachments).toEqual([
      {
        id: 'att-1',
        filename: 'exercise.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 2048,
        status: 'uploaded',
        createdAt: '2026-10-29T10:00:00Z',
      },
    ])
    expect('attachments' in conversation.messages[1]).toBe(false)
  })
})
