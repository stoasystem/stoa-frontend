/**
 * #563: the one viewer for the pictures in a help request's thread, the
 * student's (#513) and the teacher's (#510). Every case runs against both
 * scopes and both looks, through a reader in memory: an id answers a blob, or
 * a refusal with its status.
 *
 * P1 - a picture is a named thumbnail that opens larger, with the keyboard,
 *      and gives focus back; its address is let go when it leaves the screen.
 * P2 - one this reader may not read (403/404) is read once; one removed is
 *      not read; what came back as SVG, HTML or no type is not drawn, a JPEG
 *      and a type with parameters are; any other failure can be read again.
 * P3 - a picture is read once: not on a poll, a language switch, or when it
 *      leaves the screen and comes back; a later failed read keeps it shown.
 * P4 - a file that is not a picture is only named.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AttachmentPictures,
  type AttachmentPicture,
  type AttachmentPicturesCopy,
  type AttachmentPicturesLook,
} from '@/features/attachments/AttachmentPictures'
import type { AttachmentReader } from '@/features/attachments/attachmentReaders'
import i18n from '@/i18n'
import { ApiError } from '@/services/api/httpClient'

const copy: AttachmentPicturesCopy = {
  label: 'Pictures',
  loading: 'Loading',
  failed: 'Could not load',
  unavailable: 'Cannot be shown',
  retry: 'Try again',
  alt: (name) => `Picture ${name}`,
  open: (name) => `Open ${name}`,
  retryNamed: (name) => `Try again: ${name}`,
}

type Answer = Blob | number
const png = () => new Blob(['png'], { type: 'image/png' })

/** A reader in memory: each id answers a blob, or is refused with a status. */
function memoryReader(scope: readonly unknown[], answers: Record<string, Answer>) {
  const read = vi.fn(async (attachmentId: string) => {
    const answer = answers[attachmentId]
    if (answer instanceof Blob) return answer
    throw new ApiError('refused', { status: answer ?? 404 })
  })
  return { scope, read } satisfies AttachmentReader
}

function file(overrides: Partial<AttachmentPicture> = {}): AttachmentPicture {
  return { id: 'att-1', filename: 'tafel.png', mediaType: 'image/png', available: true, ...overrides }
}

const created: string[] = []
const revoked: string[] = []

beforeEach(async () => {
  created.length = 0
  revoked.length = 0
  // jsdom has no object URLs.
  URL.createObjectURL = vi.fn(() => {
    const url = `blob:test/${created.length + 1}`
    created.push(url)
    return url
  })
  URL.revokeObjectURL = vi.fn((url: string) => {
    revoked.push(url)
  })
  await i18n.changeLanguage('de')
})

/** Long enough for a retry the module should not make (`retryDelay: 0`). */
const settle = () => act(async () => new Promise((resolve) => setTimeout(resolve, 50)))

const scopes: { side: AttachmentPicturesLook; scope: readonly unknown[]; countAttribute: string }[] = [
  { side: 'student', scope: ['student'], countAttribute: 'data-teacher-images' },
  { side: 'teacher', scope: ['teacher-help', 'r1'], countAttribute: 'data-help-attachments' },
]

describe.each(scopes)('the $side viewer', ({ side, scope, countAttribute }) => {
  function renderPictures(reader: AttachmentReader, attachments: AttachmentPicture[]) {
    // The module's retry rule is what is under test; no wait between tries.
    const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } })
    const tree = (next: AttachmentPicture[]) => (
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>
          <AttachmentPictures look={side} reader={reader} copy={copy} attachments={next} />
        </QueryClientProvider>
      </I18nextProvider>
    )
    const view = render(tree(attachments))
    return { client, rerender: (next: AttachmentPicture[]) => view.rerender(tree(next)) }
  }

  describe('P1: a picture', () => {
    it('is a named thumbnail, read by its id, that opens larger', async () => {
      const reader = memoryReader(scope, { 'att-1': png() })
      renderPictures(reader, [file()])

      const list = screen.getByRole('list', { name: copy.label })
      expect(list).toHaveAttribute(countAttribute, '1')
      const open = await screen.findByRole('button', { name: copy.open('tafel.png') })
      const thumbnail = within(open).getByRole('img')
      expect(thumbnail).toHaveAttribute('alt', copy.alt('tafel.png'))
      expect(thumbnail).toHaveAttribute('src', 'blob:test/1')
      expect(reader.read).toHaveBeenCalledWith('att-1')

      await userEvent.click(open)
      const dialog = await screen.findByRole('dialog', { name: 'tafel.png' })
      expect(within(dialog).getByRole('img', { name: copy.alt('tafel.png') })).toHaveAttribute('src', 'blob:test/1')
      // Still drawn from it: the address is not let go while it is on screen.
      expect(revoked).toEqual([])
    })

    it('opens with the keyboard, closes with Escape, and gives focus back', async () => {
      renderPictures(memoryReader(scope, { 'att-1': png() }), [file()])
      const open = await screen.findByRole('button', { name: copy.open('tafel.png') })

      open.focus()
      await userEvent.keyboard('{Enter}')
      expect(await screen.findByRole('dialog', { name: 'tafel.png' })).toBeInTheDocument()

      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      expect(open).toHaveFocus()
    })

    it('lets its address go when it leaves the screen', async () => {
      const { rerender } = renderPictures(memoryReader(scope, { 'att-1': png() }), [file()])
      await screen.findByRole('button', { name: copy.open('tafel.png') })

      rerender([])
      await waitFor(() => expect(revoked).toEqual(['blob:test/1']))
      expect(screen.queryByRole('list')).toBeNull()
    })
  })

  describe('P2: a picture that cannot be shown', () => {
    it.each([403, 404])('is a placeholder on a %i, read once', async (status) => {
      const reader = memoryReader(scope, { 'att-1': status })
      renderPictures(reader, [file()])

      const placeholder = await screen.findByText(copy.unavailable)
      expect(placeholder.closest('[data-attachment-state]')).toHaveAttribute('data-attachment-state', 'unavailable')
      expect(screen.queryByRole('button', { name: copy.retryNamed('tafel.png') })).toBeNull()
      expect(screen.queryByRole('button', { name: copy.open('tafel.png') })).toBeNull()
      await settle()
      expect(reader.read).toHaveBeenCalledTimes(1)
    })

    it('is a placeholder when it was removed, and is not read', async () => {
      const reader = memoryReader(scope, { 'att-1': png() })
      renderPictures(reader, [file({ available: false })])

      expect(screen.getByText(copy.unavailable).parentElement).toHaveAttribute('title', 'tafel.png')
      await settle()
      expect(reader.read).not.toHaveBeenCalled()
    })

    it.each(['image/svg+xml', 'text/html', 'application/octet-stream', ''])(
      'is a placeholder when what came back is %j, and gets no address',
      async (type) => {
        renderPictures(memoryReader(scope, { 'att-1': new Blob(['<svg/>'], { type }) }), [file()])

        expect(await screen.findByText(copy.unavailable)).toBeInTheDocument()
        expect(screen.queryByRole('img')).toBeNull()
        expect(created).toEqual([])
      },
    )

    it('is a placeholder when the browser cannot draw what came back', async () => {
      renderPictures(memoryReader(scope, { 'att-1': png() }), [file()])
      const open = await screen.findByRole('button', { name: copy.open('tafel.png') })

      fireEvent.error(within(open).getByRole('img'))
      expect(await screen.findByText(copy.unavailable)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: copy.open('tafel.png') })).toBeNull()
    })

    it('draws a JPEG, and a type with parameters', async () => {
      const reader = memoryReader(scope, {
        'att-1': new Blob(['jpg'], { type: 'image/jpeg' }),
        'att-2': new Blob(['png'], { type: 'image/PNG; foo=bar' }),
      })
      renderPictures(reader, [file(), file({ id: 'att-2', filename: 'heft.png' })])

      expect(await screen.findByRole('button', { name: copy.open('tafel.png') })).toBeInTheDocument()
      expect(await screen.findByRole('button', { name: copy.open('heft.png') })).toBeInTheDocument()
    })

    it('can be read again after any other failure', async () => {
      const answers: Record<string, Answer> = { 'att-1': 500 }
      const reader = memoryReader(scope, answers)
      renderPictures(reader, [file()])

      // After the one retry.
      const failed = await screen.findByText(copy.failed)
      expect(failed.closest('[data-attachment-state]')).toHaveAttribute('data-attachment-state', 'failed')
      await settle()
      expect(reader.read).toHaveBeenCalledTimes(2)
      expect(screen.queryByText(copy.unavailable)).toBeNull()

      answers['att-1'] = png()
      const retry = screen.getByRole('button', { name: copy.retryNamed('tafel.png') })
      expect(retry).toHaveTextContent(copy.retry)
      await userEvent.click(retry)
      expect(await screen.findByRole('button', { name: copy.open('tafel.png') })).toBeInTheDocument()
      expect(reader.read).toHaveBeenCalledTimes(3)
    })

    it('is loading until it is read', async () => {
      let answer: (blob: Blob) => void = () => undefined
      const reader: AttachmentReader = { scope, read: () => new Promise((resolve) => (answer = resolve)) }
      renderPictures(reader, [file()])

      const loading = screen.getByText(copy.loading)
      expect(loading).toHaveAttribute('data-attachment-state', 'loading')
      expect(loading).toHaveAttribute('aria-busy', 'true')
      await act(async () => answer(png()))
      expect(await screen.findByRole('button', { name: copy.open('tafel.png') })).toBeInTheDocument()
    })
  })

  describe('P3: a picture is read once', () => {
    it('not again on a poll, nor when a language switch invalidates every query', async () => {
      const reader = memoryReader(scope, { 'att-1': png() })
      const { client, rerender } = renderPictures(reader, [file()])
      await screen.findByRole('button', { name: copy.open('tafel.png') })

      // A poll hands over a new copy of the same thread.
      rerender([file()])
      // What AppProviders does on `languageChanged`.
      await act(async () => {
        await client.invalidateQueries()
      })
      await settle()
      expect(reader.read).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('button', { name: copy.open('tafel.png') })).toBeInTheDocument()
    })

    it('not again when it leaves the screen and comes back', async () => {
      const reader = memoryReader(scope, { 'att-1': png() })
      const { rerender } = renderPictures(reader, [file()])
      await screen.findByRole('button', { name: copy.open('tafel.png') })

      rerender([])
      rerender([file()])
      expect(await screen.findByRole('button', { name: copy.open('tafel.png') })).toBeInTheDocument()
      expect(reader.read).toHaveBeenCalledTimes(1)
    })

    it('keeps a picture on screen when a later read of it fails', async () => {
      const answers: Record<string, Answer> = { 'att-1': png() }
      const { client } = renderPictures(memoryReader(scope, answers), [file()])
      await screen.findByRole('button', { name: copy.open('tafel.png') })

      answers['att-1'] = 500
      const query = client.getQueryCache().find({ queryKey: ['attachment-content', ...scope, 'att-1'], exact: true })
      expect(query).toBeDefined()
      await act(async () => {
        await query?.fetch().catch(() => undefined)
      })
      await waitFor(() => expect(query?.state.status).toBe('error'))
      expect(screen.getByRole('button', { name: copy.open('tafel.png') })).toBeInTheDocument()
      expect(screen.queryByText(copy.failed)).toBeNull()
    })
  })

  describe('P4: a file that is not a picture', () => {
    it('is only named, and is not read', async () => {
      const reader = memoryReader(scope, { 'att-1': png() })
      renderPictures(reader, [file({ filename: 'notizen.pdf', mediaType: 'application/pdf' })])

      expect(screen.getByText('notizen.pdf')).toBeInTheDocument()
      expect(screen.queryByRole('img')).toBeNull()
      expect(screen.queryByText(copy.unavailable)).toBeNull()
      await settle()
      expect(reader.read).not.toHaveBeenCalled()
    })
  })

  it('shows nothing, and reads nothing, without files', () => {
    const reader = memoryReader(scope, {})
    renderPictures(reader, [])
    expect(screen.queryByRole('list')).toBeNull()
    expect(document.querySelector(`[${countAttribute}]`)).toBeNull()
    expect(reader.read).not.toHaveBeenCalled()
  })
})

it('reads the same id through two scopes as two files', async () => {
  const student = memoryReader(['student'], { 'att-1': png() })
  const teacher = memoryReader(['teacher-help', 'r1'], { 'att-1': png() })
  const client = new QueryClient()
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <AttachmentPictures look="student" reader={student} copy={copy} attachments={[file()]} />
        <AttachmentPictures look="teacher" reader={teacher} copy={copy} attachments={[file()]} />
      </QueryClientProvider>
    </I18nextProvider>,
  )

  // findAllByRole settles on the first match: under load the second viewer may not be
  // there yet, so wait for both.
  await waitFor(() =>
    expect(screen.getAllByRole('button', { name: copy.open('tafel.png') })).toHaveLength(2),
  )
  expect(student.read).toHaveBeenCalledTimes(1)
  expect(teacher.read).toHaveBeenCalledTimes(1)
})
