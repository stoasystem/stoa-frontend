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
import { readFailedMessages, readPendingMessage, writePendingMessage } from '@/lib/pendingChatMessages'
import { ApiError, httpClient } from '@/services/api/httpClient'
import { getConversation, sendConversationMessage } from '@/services/chat/chatApi'
import { problemFor } from '@/services/files/attachmentProblems'
import { uploadFile } from '@/services/files/fileApi'

vi.mock('@/services/api/httpClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/api/httpClient')>()),
  httpClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

// jsdom draws nothing; shrinking a photo is prepareImage508's.
vi.mock('@/services/files/prepareImage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/files/prepareImage')>()),
  prepareImage: vi.fn(async (file: File) => file),
}))

const post = vi.mocked(httpClient.post)
const get = vi.mocked(httpClient.get)

const photo = () => new File([new Uint8Array(2048)], 'exercise.png', { type: 'image/png' })

/** The intent's 30 minutes, from now. */
let expiresAt: string

/**
 * The upload API as it answers: intent, part, then `complete` with `status`,
 * or with the 422 a file that does not pass is refused with.
 */
function answerUploads(complete: Record<string, unknown> | ApiError) {
  post.mockImplementation(async (url: string) => {
    if (url === '/files/intents') {
      return {
        data: {
          uploadId: 'up-1',
          expiresAt,
          maxBytes: 10 * 1024 * 1024,
          chunkBytes: 5 * 1024 * 1024,
          acceptedTypes: ['image/png'],
          status: 'pending_upload',
        },
      }
    }
    // The part's bytes go to S3 on this URL (#516; uploadDirectS3516).
    if (url === '/files/up-1/parts/1') {
      return { data: { uploadId: 'up-1', partNumber: 1, url: 'https://s3.example/part', method: 'PUT', headers: {} } }
    }
    if (url === '/files/up-1/complete') {
      if (complete instanceof ApiError) throw complete
      return { data: { uploadId: 'up-1', ...complete } }
    }
    throw new Error(`unexpected POST ${url}`)
  })
}

const invalid = () => new ApiError('Invalid.', { status: 422, code: 'upload_invalid' })

beforeEach(() => {
  expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
  answerUploads({ status: 'validated', attachment: null })
  vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 200 })))
})

afterEach(() => {
  vi.unstubAllGlobals()
  sessionStorage.clear()
  vi.clearAllMocks()
})

describe('an upload that passed', () => {
  it('is the validated upload, though `complete` names no attachment', async () => {
    await expect(uploadFile({ file: photo() })).resolves.toEqual({
      uploadId: 'up-1',
      expiresAt,
      filename: 'exercise.png',
      mimeType: 'image/png',
      sizeBytes: 2048,
    })
    expect(post).toHaveBeenCalledWith('/files/up-1/complete', { partCount: 1 }, expect.anything())
  })

  it('is refused with the 422 a file that does not pass gets, in words the tray has', async () => {
    answerUploads(invalid())

    const refused = await uploadFile({ file: photo() }).catch((error: unknown) => error)

    expect(refused).toBeInstanceOf(ApiError)
    expect(problemFor(refused)).toBe(problemFor(invalid()))
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
    answerUploads(invalid())
    const { result } = renderHook(() => useAttachmentUploads())

    act(() => result.current.add([photo()]))
    await waitFor(() => expect(result.current.drafts[0]?.state).toBe('failed'))

    expect(result.current.drafts[0]?.problem).toBe(problemFor(invalid()))
    expect(result.current.readyReferences).toEqual([])
  })
})

describe('an upload past its 30 minutes', () => {
  async function readyWith(expiry: string) {
    expiresAt = expiry
    const { result } = renderHook(() => useAttachmentUploads())
    act(() => result.current.add([photo()]))
    await waitFor(() => expect(result.current.drafts[0]?.state).toBe('ready'))
    return result
  }

  it('is failed as `expired` before the question goes out, which is held', async () => {
    const result = await readyWith(new Date(Date.now() + 60 * 1000).toISOString())

    let held = false
    act(() => {
      held = result.current.expireStale()
    })

    expect(held).toBe(true)
    expect(result.current.drafts[0]).toMatchObject({ state: 'failed', problem: 'expired' })
    expect(result.current.readyReferences).toEqual([])
  })

  it('is sent while it has time left (the negative control)', async () => {
    const result = await readyWith(new Date(Date.now() + 20 * 60 * 1000).toISOString())

    let held = true
    act(() => {
      held = result.current.expireStale()
    })

    expect(held).toBe(false)
    expect(result.current.readyReferences).toEqual([{ uploadId: 'up-1' }])
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

  it('keeps only references the backend takes on a failed one too, to send again', () => {
    sessionStorage.setItem(
      'stoa_failed_chat_messages:c1',
      JSON.stringify([
        {
          owner: 'u-1',
          student: {
            id: 's1',
            conversationId: 'c1',
            role: 'student',
            content: 'Here it is',
            createdAt: '2026-10-29T10:00:00Z',
            status: 'failed',
            retryPayload: { content: 'Here it is', attachmentIds: [{ uploadId: 'up-1' }, 'att-3', {}] },
          },
        },
      ]),
    )

    expect(readFailedMessages('c1', 'u-1')[0].student.retryPayload.attachmentIds).toEqual([{ uploadId: 'up-1' }])
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

  it('names them so in the answer to a message sent without streaming, too', async () => {
    const message = (id: string, role: string, attachments?: unknown[]) => ({
      id,
      conversationId: 'c1',
      role,
      content: 'x',
      createdAt: '2026-10-29T10:00:00Z',
      ...(attachments ? { attachments } : {}),
    })
    post.mockResolvedValue({
      data: {
        studentMessage: message('s1', 'student', [
          {
            attachmentId: 'att-1',
            filename: 'a.jpg',
            mediaType: 'image/jpeg',
            sizeBytes: 9,
            status: 'active',
            createdAt: '2026-10-29T10:00:00Z',
          },
        ]),
        assistantMessage: message('a1', 'assistant'),
      },
    })

    const sent = await sendConversationMessage('c1', { content: 'x', attachmentIds: [{ uploadId: 'up-1' }] })

    expect(sent.studentMessage.attachments).toMatchObject([{ id: 'att-1', mimeType: 'image/jpeg' }])
    expect('attachments' in sent.assistantMessage).toBe(false)
  })
})
