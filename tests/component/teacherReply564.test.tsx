/**
 * #564: a teacher's reply as one module. Everything here goes through
 * `useTeacherReply` alone, with an in-memory server in place of the API: the
 * draft and its storage, the queued blocks, the check before sending, when it
 * may be sent, and what sending does -- the toasts, the list and stats read
 * again, the pictures settled.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TeacherReplyAdapter, TeacherReplyBody } from '@/features/teacherReply/teacherReplyAdapter'
import { useTeacherReply } from '@/features/teacherReply/useTeacherReply'
import i18n from '@/i18n'
import de from '@/i18n/locales/de/teacher.json'
import { ApiError } from '@/services/api/httpClient'
import { uploadFile } from '@/services/files/fileApi'
import { teacherQueryKeys } from '@/services/teacher/teacherQueryKeys'
import type { TeacherHelpRequestNote, TeacherReplyBlock } from '@/types/teacher'

vi.mock('@/services/files/fileApi', async (orig) => ({
  ...(await orig<typeof import('@/services/files/fileApi')>()),
  uploadFile: vi.fn(),
}))
// jsdom draws nothing: what a photo becomes is prepareImage508's.
vi.mock('@/services/files/prepareImage', async (orig) => ({
  ...(await orig<typeof import('@/services/files/prepareImage')>()),
  prepareImage: vi.fn(async (file: File) => file),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))
const uploadMock = vi.mocked(uploadFile)

const DRAFT_KEY = 'stoa.teacherReplyDraft.r1'
const paragraph = (text: string): TeacherReplyBlock => ({ type: 'paragraph', text })

/** The server, in memory: it keeps what it was sent, and answers as told. */
function memoryServer() {
  const sent: Array<{ requestId: string; body: TeacherReplyBody }> = []
  let answer: () => Promise<TeacherHelpRequestNote> = async () =>
    ({ id: `n${sent.length}`, note: '', createdAt: '2026-11-02T10:00:00Z' }) as TeacherHelpRequestNote
  const adapter: TeacherReplyAdapter = {
    addNote: (requestId, body) => {
      sent.push({ requestId, body })
      return answer()
    },
  }
  return {
    adapter,
    sent,
    refuse: (error: unknown) => {
      answer = () => Promise.reject(error)
    },
    hold: () => {
      let finish: () => void = () => undefined
      answer = () =>
        new Promise((resolve) => {
          finish = () => resolve({ id: 'n1' } as TeacherHelpRequestNote)
        })
      return () => finish()
    },
  }
}

function setup({ requestId = 'r1', server = memoryServer() }: { requestId?: string; server?: ReturnType<typeof memoryServer> } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
  const hook = renderHook(({ id }) => useTeacherReply(id, { adapter: server.adapter }), {
    wrapper,
    initialProps: { id: requestId as string | undefined },
  })
  const reply = () => hook.result.current
  return {
    server,
    reply,
    rerender: (id: string | undefined) => hook.rerender({ id }),
    unmount: hook.unmount,
    type: (text: string) => act(() => reply().setValue(text)),
    add: () => {
      let added = false
      act(() => {
        added = reply().addBlock()
      })
      return added
    },
    send: async () => {
      let sent = false
      await act(async () => {
        sent = await reply().send()
      })
      return sent
    },
    invalidated: () => invalidate.mock.calls.map(([filters]) => JSON.stringify(filters?.queryKey)),
  }
}

const LIST_KEY = JSON.stringify(teacherQueryKeys.helpRequests())
const STATS_KEY = JSON.stringify(teacherQueryKeys.stats())

const photo = () => new File([new Uint8Array(2048)], 'tafel.png', { type: 'image/png' })
const uploaded = (uploadId: string) => ({
  uploadId,
  expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  filename: 'tafel.png',
  mimeType: 'image/png',
  sizeBytes: 2048,
})

async function choosePicture(reply: () => ReturnType<typeof useTeacherReply>) {
  act(() => reply().attachments.view.add([photo()]))
  await waitFor(() => expect(reply().attachments.view.drafts[0]?.state).toBe('ready'))
}

beforeEach(async () => {
  vi.clearAllMocks()
  sessionStorage.clear()
  uploadMock.mockReset()
  await i18n.changeLanguage('de')
})

describe('the draft', () => {
  it('is kept per request in this tab, and read back', () => {
    const first = setup()
    first.type('Hallo Lea')
    act(() => first.reply().setMode('formula'))
    expect(JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? '{}')).toEqual({ mode: 'formula', value: 'Hallo Lea', blocks: [] })
    first.unmount()

    const again = setup()
    expect(again.reply().value).toBe('Hallo Lea')
    expect(again.reply().mode).toBe('formula')
    expect(setup({ requestId: 'r2' }).reply().value).toBe('')
  })

  it('reads another request\'s draft when the request changes', () => {
    sessionStorage.setItem('stoa.teacherReplyDraft.r2', JSON.stringify({ mode: 'code', value: 'für r2', blocks: [] }))
    const reply = setup()
    reply.type('für r1')
    reply.rerender('r2')
    expect(reply.reply().value).toBe('für r2')
    expect(reply.reply().mode).toBe('code')
    expect(JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? '{}').value).toBe('für r1')
  })

  it('takes no picture to another request: the tray empties, and what is still going up is stopped', async () => {
    let signal: AbortSignal | undefined
    uploadMock.mockResolvedValueOnce(uploaded('up-1'))
    uploadMock.mockImplementationOnce(({ signal: given }) => {
      signal = given
      return new Promise(() => {})
    })
    const reply = setup()
    await choosePicture(reply.reply)
    act(() => reply.reply().attachments.view.add([photo()]))
    await waitFor(() => expect(signal).toBeDefined())

    reply.rerender('r2')
    expect(reply.reply().attachments.view.drafts).toEqual([])
    expect(signal?.aborted).toBe(true)
    reply.type('Für r2')
    await reply.send()
    expect(reply.server.sent[0]).toMatchObject({ requestId: 'r2', body: { attachmentIds: [] } })
  })

  it('drops what it cannot render and keeps the rest (#371)', () => {
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        mode: 'video',
        value: '',
        blocks: [
          { type: 'paragraph' },
          { type: 'formula', text: 'x = 1' },
          { type: 'video', text: 'unbekannt' },
          null,
          'Erster Schritt',
          paragraph('bleibt'),
          { type: 'formula', latex: '2x = 4' },
          { type: 'quote', text: 'Zitat', extra: true },
        ],
      }),
    )
    const reply = setup()
    expect(reply.reply().mode).toBe('paragraph')
    expect(reply.reply().blocks).toEqual([paragraph('bleibt'), { type: 'formula', latex: '2x = 4' }, { type: 'quote', text: 'Zitat' }])
    expect(JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? '{}').blocks).toEqual(reply.reply().blocks)
  })

  it('starts empty from storage that is not a draft at all', () => {
    sessionStorage.setItem(DRAFT_KEY, '{not json')
    expect(setup().reply().blocks).toEqual([])
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ value: 3, blocks: 'x' }))
    expect(setup().reply().value).toBe('')
  })
})

describe('the queued blocks (#332)', () => {
  it('queue what is typed, and come out again', () => {
    const reply = setup()
    reply.type('Erster Schritt')
    expect(reply.add()).toBe(true)
    reply.type('Zweiter Schritt')
    reply.add()
    expect(reply.reply().value).toBe('')
    expect(reply.reply().blocks).toEqual([paragraph('Erster Schritt'), paragraph('Zweiter Schritt')])

    act(() => reply.reply().removeBlock(0))
    expect(reply.reply().blocks).toEqual([paragraph('Zweiter Schritt')])
    expect(JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? '{}').blocks).toEqual([paragraph('Zweiter Schritt')])
  })

  it('queue nothing when nothing is typed', () => {
    const reply = setup()
    reply.type('   ')
    expect(reply.add()).toBe(false)
    expect(reply.reply().blocks).toEqual([])
  })

  it('make a list typed with its own bullets one plain item a line', () => {
    const reply = setup()
    act(() => reply.reply().setMode('unordered_list'))
    reply.type('- Kürzen\n* Ausklammern\n\n1. Prüfen\n')
    expect(reply.reply().previewBlocks).toEqual([{ type: 'unordered_list', text: 'Kürzen\nAusklammern\nPrüfen' }])
  })
})

describe('the check before sending', () => {
  it.each([
    ['HTML', [], '<img src=x onerror=alert(1)>', { reason: 'html' }],
    ['a private marker', [], 'Siehe s3://bucket/datei', { reason: 'privateMarkers' }],
    ['a block too long', [], 'a'.repeat(2001), { reason: 'blockTooLong', values: { length: 2001, max: 2000 } }],
    ['a 21st block', Array.from({ length: 20 }, (_, index) => paragraph(`Schritt ${index}`)), 'Noch einer', { reason: 'tooManyBlocks', values: { max: 20 } }],
    ['a reply too long', [paragraph('a'.repeat(2000))], 'b'.repeat(2000), { reason: 'tooLong', values: { length: 4001, max: 4000 } }],
  ])('refuses %s, and queues it not', (_, queued, typed, problem) => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ mode: 'paragraph', value: '', blocks: queued }))
    const reply = setup()
    reply.type(typed)
    expect(reply.reply().problem).toEqual(problem)
    expect(reply.reply().canSend).toBe(false)
    expect(reply.add()).toBe(false)
  })

  it('lets maths through (#268)', () => {
    const reply = setup()
    reply.type('0 < a < 1 und set one = 1')
    expect(reply.reply().problem).toBeNull()
    expect(reply.reply().canSend).toBe(true)
  })
})

describe('when it may be sent', () => {
  it('not empty', () => {
    const reply = setup()
    expect(reply.reply().canSend).toBe(false)
    reply.type('  ')
    expect(reply.reply().canSend).toBe(false)
  })

  it('not while one is on its way', async () => {
    const server = memoryServer()
    const finish = server.hold()
    const reply = setup({ server })
    reply.type('Hallo')
    let sending: Promise<boolean> = Promise.resolve(false)
    act(() => {
      sending = reply.reply().send()
    })
    await waitFor(() => expect(reply.reply().sending).toBe(true))
    expect(reply.reply().canSend).toBe(false)
    expect(await act(() => reply.reply().send())).toBe(false)

    await act(async () => {
      finish()
      await sending
    })
    expect(reply.reply().sending).toBe(false)
    expect(server.sent).toHaveLength(1)
  })

  it('not while a picture is still going up', async () => {
    let finish: (value: ReturnType<typeof uploaded>) => void = () => undefined
    uploadMock.mockReturnValue(new Promise((resolve) => (finish = resolve)))
    const reply = setup()
    reply.type('Schauen Sie die Skizze an.')
    act(() => reply.reply().attachments.view.add([photo()]))
    await waitFor(() => expect(reply.reply().canSend).toBe(false))

    await act(async () => finish(uploaded('up-1')))
    await waitFor(() => expect(reply.reply().canSend).toBe(true))
  })

  it('not with pictures and no words', async () => {
    uploadMock.mockResolvedValue(uploaded('up-1'))
    const reply = setup()
    await choosePicture(reply.reply)
    expect(reply.reply().canSend).toBe(false)
    expect(await reply.send()).toBe(false)
    expect(reply.server.sent).toEqual([])
  })

  it('not without a request', async () => {
    const reply = setup()
    reply.rerender(undefined)
    reply.type('Hallo')
    expect(await reply.send()).toBe(false)
    expect(reply.server.sent).toEqual([])
  })
})

describe('sending', () => {
  it('sends the reply and its pictures, then empties the draft and the tray', async () => {
    uploadMock.mockResolvedValue(uploaded('up-1'))
    const reply = setup()
    await choosePicture(reply.reply)
    reply.type('Erster Schritt')
    reply.add()
    act(() => reply.reply().setMode('formula'))
    reply.type('2x = 4')

    expect(await reply.send()).toBe(true)
    expect(reply.server.sent).toEqual([
      {
        requestId: 'r1',
        body: {
          content: 'Erster Schritt\n2x = 4',
          richContent: { version: 1, blocks: [paragraph('Erster Schritt'), { type: 'formula', latex: '2x = 4' }] },
          attachmentIds: [{ uploadId: 'up-1' }],
        },
      },
    ])
    expect(reply.reply()).toMatchObject({ mode: 'paragraph', value: '', blocks: [] })
    expect(reply.reply().attachments.view.drafts).toEqual([])
    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull()
    expect(toast.success).toHaveBeenCalledWith(de.toasts.replySent)
    expect(reply.invalidated()).toEqual(expect.arrayContaining([LIST_KEY, STATS_KEY]))
  })

  it('names no pictures when it carries none', async () => {
    const reply = setup()
    reply.type('Hallo')
    await reply.send()
    expect(reply.server.sent[0]?.body.attachmentIds).toEqual([])
  })
})

describe('a reply the server would not take', () => {
  it('a picture it would not take is to be chosen again, and the words stay', async () => {
    uploadMock.mockResolvedValue(uploaded('up-1'))
    const reply = setup()
    reply.server.refuse(new ApiError('gone', { status: 404, code: 'upload_not_found' }))
    await choosePicture(reply.reply)
    reply.type('Schauen Sie die Skizze an.')

    expect(await reply.send()).toBe(false)
    expect(toast.error).toHaveBeenCalledWith(de.toasts.replyImagesExpired)
    expect(reply.reply().attachments.view.drafts[0]).toMatchObject({ state: 'failed', problem: 'expired' })
    expect(reply.reply().value).toBe('Schauen Sie die Skizze an.')
    expect(reply.reply().conflict).toBe(false)
  })

  it('a request that moved on (409) is a conflict, and the list and stats are read again', async () => {
    const reply = setup()
    reply.server.refuse(new ApiError('changed', { status: 409, code: 'help_request_changed' }))
    reply.type('Hallo')

    await reply.send()
    await waitFor(() => expect(reply.reply().conflict).toBe(true))
    expect(toast.error).toHaveBeenCalledWith(de.toasts.replyConflict)
    expect(reply.invalidated()).toEqual(expect.arrayContaining([LIST_KEY, STATS_KEY]))
    expect(reply.reply().value).toBe('Hallo')

    // The next reply that goes out is not refused for it.
    reply.server.hold()
    act(() => void reply.reply().send())
    await waitFor(() => expect(reply.reply().conflict).toBe(false))
  })

  it('a 422 is said by its code', async () => {
    uploadMock.mockResolvedValue(uploaded('up-1'))
    const reply = setup()
    reply.server.refuse(new ApiError('expired', { status: 422, code: 'upload_expired' }))
    await choosePicture(reply.reply)
    reply.type('Hallo')

    await reply.send()
    expect(toast.error).toHaveBeenCalledWith(de.toasts.replyImagesExpired)
    expect(reply.reply().attachments.view.drafts[0]).toMatchObject({ state: 'failed', problem: 'expired' })
  })

  it('a 422 is said by its sentence while the server sends no code for it', async () => {
    uploadMock.mockResolvedValue(uploaded('up-1'))
    const reply = setup()
    reply.server.refuse(new ApiError('text exceeds 2000 characters', { status: 422 }))
    await choosePicture(reply.reply)
    reply.type('Hallo')

    await reply.send()
    expect(toast.error).toHaveBeenCalledWith(de.toasts.replyRefusedBecause.blockTooLong)
    expect(reply.reply().attachments.view.drafts[0]).toMatchObject({ state: 'ready' })
    expect(reply.invalidated()).not.toContain(LIST_KEY)
  })

  it('a 422 it cannot read keeps the general message', async () => {
    const reply = setup()
    reply.server.refuse(new ApiError('something else', { status: 422 }))
    reply.type('Hallo')
    await reply.send()
    expect(toast.error).toHaveBeenCalledWith(de.toasts.replyRefused)
  })

  it('any other failure says so, and leaves the draft and the pictures alone', async () => {
    uploadMock.mockResolvedValue(uploaded('up-1'))
    const reply = setup()
    reply.server.refuse(new ApiError('down', { status: 500 }))
    await choosePicture(reply.reply)
    reply.type('Hallo')

    expect(await reply.send()).toBe(false)
    expect(toast.error).toHaveBeenCalledWith(de.toasts.replyFailed)
    expect(reply.reply().attachments.view.drafts[0]).toMatchObject({ state: 'ready' })
    expect(reply.reply().value).toBe('Hallo')
    expect(reply.reply().conflict).toBe(false)
    expect(reply.invalidated()).toEqual([])
  })
})
