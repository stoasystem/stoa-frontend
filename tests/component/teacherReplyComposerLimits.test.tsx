/**
 * #332: the teacher's reply composer.
 *
 * T3 - the server's limits (stoa-backend teacher_reply_service: 20 blocks,
 *      2000 characters a text block, 500 a formula, 4000 in all, its secret
 *      markers) are checked before sending, and a 422 says which one it was.
 * T4 - queued blocks are shown and can be removed.
 * T8 - line breaks survive into the timeline; a list block is one item a line.
 * T9 - focus is not dropped after an action, the resolution note says it is
 *      required in text, and the difficulty buttons are a named group.
 *
 * #371: a stored draft is read block by block, and a refusal is read by its
 *       code first, a block too long told apart from a reply too long.
 * #388: the server sends no refusal code yet, so none is read; the message
 *       decides.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AiTeacherToolsPanel } from '@/components/teacher/AiTeacherToolsPanel'
import { RichTeacherReply } from '@/components/teacher/RichTeacherReply'
import { TeacherReplyComposer } from '@/components/teacher/TeacherReplyComposer'
import { useAddTeacherHelpRequestNoteMutation } from '@/hooks/teacher/useAddTeacherHelpRequestNoteMutation'
import i18n from '@/i18n'
import de from '@/i18n/locales/de/teacher.json'
import en from '@/i18n/locales/en/teacher.json'
import fr from '@/i18n/locales/fr/teacher.json'
import italian from '@/i18n/locales/it/teacher.json'
import { TeacherHelpRequestDetailPage } from '@/pages/teacher/TeacherHelpRequestDetailPage'
import { ApiError } from '@/services/api/httpClient'
import * as teacherApi from '@/services/teacher/teacherApi'
import type { TeacherReplyBlock } from '@/types/teacher'
import type { TeacherHelpStatus } from '@/types/teacherHelp'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/services/teacher/teacherApi', async (orig) => ({
  ...(await orig<typeof import('@/services/teacher/teacherApi')>()),
  getTeacherHelpRequestDetail: vi.fn(),
  updateTeacherHelpRequestStatus: vi.fn(),
  addTeacherHelpRequestNote: vi.fn(),
  getTeacherAssistanceSummary: vi.fn(() => new Promise(() => {})),
}))
vi.mock('@/hooks/practice/useCurriculumCatalogQuery', () => ({
  useCurriculumCatalogQuery: () => ({ data: undefined, isLoading: false, isError: false }),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

const REPLY = de.reply.label
const SEND = de.reply.send
const ADD = de.reply.addBlock

function renderComposer({ draft, isSubmitting = false }: { draft?: TeacherReplyBlock[]; isSubmitting?: boolean } = {}) {
  if (draft) sessionStorage.setItem('stoa.teacherReplyDraft.r1', JSON.stringify({ mode: 'paragraph', value: '', blocks: draft }))
  const onSubmit = vi.fn()
  const ui = (submitting: boolean) => (
    <I18nextProvider i18n={i18n}>
      <TeacherReplyComposer isSubmitting={submitting} draftKey="r1" onSubmit={onSubmit} />
    </I18nextProvider>
  )
  const view = render(ui(isSubmitting))
  return {
    onSubmit,
    setSubmitting: (submitting: boolean) => view.rerender(ui(submitting)),
    reply: () => screen.getByLabelText(REPLY),
    send: () => screen.getByRole('button', { name: SEND }),
    type: (text: string) => fireEvent.change(screen.getByLabelText(REPLY), { target: { value: text } }),
  }
}

const paragraph = (text: string): TeacherReplyBlock => ({ type: 'paragraph', text })
const message = (key: string, values?: Record<string, number>) => i18n.t(`teacher:${key}`, values)

function detail(status: TeacherHelpStatus) {
  return {
    requestId: 'r1', conversationId: 'c1', student: { id: 's1', name: 'Lea', grade: '8' },
    subject: 'mathematics', status, messages: [], notes: [],
  } as never
}

function renderDetail() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/teacher/requests/r1']}>
          <Routes><Route path="/teacher/requests/:requestId" element={<TeacherHelpRequestDetailPage />} /></Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

beforeEach(async () => {
  vi.clearAllMocks()
  sessionStorage.clear()
  await i18n.changeLanguage('de')
})

describe('T3: the server limits, checked before sending', () => {
  it('takes a text block of 2000 characters and refuses one of 2001', () => {
    const composer = renderComposer()
    composer.type('a'.repeat(2000))
    expect(composer.send()).toBeEnabled()

    composer.type('a'.repeat(2001))
    expect(screen.getByText(message('reply.unsafe.blockTooLong', { length: 2001, max: 2000 }))).toBeInTheDocument()
    expect(composer.send()).toBeDisabled()
    expect(screen.getByRole('button', { name: ADD })).toBeDisabled()
    expect(composer.reply()).toHaveAttribute('aria-invalid', 'true')
    expect(composer.reply()).toHaveAccessibleDescription(message('reply.unsafe.blockTooLong', { length: 2001, max: 2000 }))
  })

  it('takes a formula of 500 characters and refuses one of 501', async () => {
    const composer = renderComposer()
    await userEvent.click(screen.getByRole('button', { name: de.reply.modes.formula }))
    composer.type('x'.repeat(500))
    expect(composer.send()).toBeEnabled()

    composer.type('x'.repeat(501))
    expect(screen.getByText(message('reply.unsafe.blockTooLong', { length: 501, max: 500 }))).toBeInTheDocument()
    expect(composer.send()).toBeDisabled()
  })

  it('counts characters as the server does, one per emoji', () => {
    const composer = renderComposer()
    composer.type('😀'.repeat(2000))
    expect(composer.send()).toBeEnabled()
  })

  it('sends 20 blocks but not a 21st', () => {
    const composer = renderComposer({ draft: Array.from({ length: 20 }, (_, index) => paragraph(`Schritt ${index + 1}`)) })
    expect(composer.send()).toBeEnabled()

    composer.type('Noch einer')
    expect(screen.getByText(message('reply.unsafe.tooManyBlocks', { max: 20 }))).toBeInTheDocument()
    expect(composer.send()).toBeDisabled()
    expect(screen.getByRole('button', { name: ADD })).toBeDisabled()
  })

  it('refuses more than 4000 characters in all, line breaks between blocks counted', () => {
    // 2 × 2000 + one line break = 4001.
    const composer = renderComposer({ draft: [paragraph('a'.repeat(2000))] })
    composer.type('b'.repeat(1999))
    expect(composer.send()).toBeEnabled()

    composer.type('b'.repeat(2000))
    expect(screen.getByText(message('reply.unsafe.tooLong', { length: 4001, max: 4000 }))).toBeInTheDocument()
    expect(composer.send()).toBeDisabled()
  })

  it.each([
    ['an S3 address', 'Siehe s3://bucket/datei'],
    ['an amazonaws link', 'https://bucket.amazonaws.com/x'],
    ['a password', 'password=geheim'],
    ['a cookie', 'cookie=abc'],
    ['a secret key name', 'SecretAccessKey: x'],
    ['an AWS access key', 'Schlüssel AKIAABCDEFGHIJKLMNOP hier'],
  ])('refuses %s, as the server does', (_, text) => {
    const composer = renderComposer()
    composer.type(text)
    expect(screen.getByText(de.reply.unsafe.privateMarkers)).toBeInTheDocument()
    expect(composer.send()).toBeDisabled()
  })

  it('lets a lower-case lookalike of an access key through, as the server does', () => {
    const composer = renderComposer()
    composer.type('akiaabcdefghijklmnop')
    expect(composer.send()).toBeEnabled()
  })

  it('still lets maths through (#268)', () => {
    const composer = renderComposer()
    composer.type('0 < a < 1 und set one = 1')
    expect(composer.send()).toBeEnabled()
  })
})

describe('T3: a reply the server refuses says why', () => {
  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
  }

  it.each([
    ['teacher reply contains unsafe raw HTML', 'html'],
    ['teacher reply contains private markers', 'privateMarkers'],
    ['teacher reply contains private credentials', 'privateMarkers'],
    ['rich_content blocks must contain 1 to 20 blocks', 'tooManyBlocks'],
    ['text exceeds 2000 characters', 'blockTooLong'],
    ['latex exceeds 500 characters', 'blockTooLong'],
    ['teacher reply fallback exceeds 4000 characters', 'tooLong'],
    ['content exceeds 4000 characters', 'tooLong'],
  ])('"%s"', async (sentence, reason) => {
    await refuse(new ApiError(sentence, { status: 422, detail: sentence }))
    expect(toast.error).toHaveBeenCalledWith(refusedBecause(reason))
  })

  it('keeps the general message for a refusal it does not know', async () => {
    vi.mocked(teacherApi.addTeacherHelpRequestNote).mockRejectedValue(new ApiError('something else', { status: 422 }))
    const { result } = renderHook(() => useAddTeacherHelpRequestNoteMutation(), { wrapper })
    act(() => result.current.mutate({ requestId: 'r1', content: 'x' } as never))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(de.toasts.replyRefused))
  })

  async function refuse(error: ApiError) {
    vi.mocked(teacherApi.addTeacherHelpRequestNote).mockRejectedValue(error)
    const { result } = renderHook(() => useAddTeacherHelpRequestNoteMutation(), { wrapper })
    act(() => result.current.mutate({ requestId: 'r1', content: 'x' } as never))
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
  }

  const refusedBecause = (reason: string) =>
    de.toasts.replyRefusedBecause[reason as keyof typeof de.toasts.replyRefusedBecause]

  // #388: stoa-backend sends no code for a refused reply, so the codes #371
  // guessed say nothing; the message still decides.
  it.each([
    'teacher_reply_unsafe_html',
    'teacher_reply_private_markers',
    'teacher_reply_private_credentials',
    'teacher_reply_too_many_blocks',
    'teacher_reply_block_too_long',
    'teacher_reply_too_long',
  ])('does not read the guessed code %s', async (code) => {
    await refuse(new ApiError('reworded by the server', { status: 422, code }))
    expect(toast.error).toHaveBeenCalledWith(de.toasts.replyRefused)
  })

  it('reads the message, not a code the server does not send', async () => {
    await refuse(new ApiError('teacher reply fallback exceeds 4000 characters', { status: 422, code: 'teacher_reply_block_too_long' }))
    expect(toast.error).toHaveBeenCalledWith(de.toasts.replyRefusedBecause.tooLong)
  })

  it('falls back to the message for a code it does not know', async () => {
    await refuse(new ApiError('text exceeds 2000 characters', { status: 422, code: 'something_new' }))
    expect(toast.error).toHaveBeenCalledWith(de.toasts.replyRefusedBecause.blockTooLong)
  })

  it('keeps the general message for an unknown code with an unknown message', async () => {
    await refuse(new ApiError('something else', { status: 422, code: 'constructor' }))
    expect(toast.error).toHaveBeenCalledWith(de.toasts.replyRefused)
  })
})

describe('#371: a stored draft is read block by block', () => {
  function storeDraft(blocks: unknown[]) {
    sessionStorage.setItem('stoa.teacherReplyDraft.r1', JSON.stringify({ mode: 'paragraph', value: '', blocks }))
  }

  it('drops the blocks it cannot render and keeps the rest', () => {
    storeDraft([
      { type: 'paragraph' },
      { type: 'formula', text: 'x = 1' },
      { type: 'paragraph', text: 42 },
      { type: 'video', text: 'unbekannt' },
      { text: 'ohne Typ' },
      { type: 'paragraph', text: '   ' },
      null,
      'Erster Schritt',
      paragraph('bleibt'),
      { type: 'formula', latex: '2x = 4' },
      { type: 'quote', text: 'Zitat', extra: true },
    ])
    const composer = renderComposer()

    const queued = screen.getByRole('list', { name: message('reply.queued', { count: 3 }) })
    expect(within(queued).getByText('bleibt')).toBeInTheDocument()
    expect(within(queued).getByText('2x = 4')).toBeInTheDocument()
    expect(within(queued).getByText('Zitat')).toBeInTheDocument()
    expect(composer.send()).toBeEnabled()
    expect(JSON.parse(sessionStorage.getItem('stoa.teacherReplyDraft.r1') ?? '{}').blocks).toEqual([
      paragraph('bleibt'),
      { type: 'formula', latex: '2x = 4' },
      { type: 'quote', text: 'Zitat' },
    ])
  })

  it('keeps the request page up for a draft with a block missing its text', async () => {
    storeDraft([{ type: 'paragraph' }, { type: 'formula' }])
    vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail('in_progress'))
    renderDetail()

    expect(await screen.findByLabelText(REPLY)).toHaveValue('')
    expect(screen.queryByText(message('reply.queued', { count: 2 }))).toBeNull()
    expect(sessionStorage.getItem('stoa.teacherReplyDraft.r1')).toBeNull()
  })
})

describe('T4: queued blocks', () => {
  it('are shown, and each can be removed', async () => {
    const composer = renderComposer()
    composer.type('Erster Schritt')
    await userEvent.click(screen.getByRole('button', { name: ADD }))
    composer.type('Zweiter Schritt')
    await userEvent.click(screen.getByRole('button', { name: ADD }))

    const queued = screen.getByRole('list', { name: message('reply.queued', { count: 2 }) })
    expect(within(queued).getByText('Erster Schritt')).toBeInTheDocument()
    expect(within(queued).getByText('Zweiter Schritt')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: message('reply.removeBlock', { number: 1 }) }))
    const left = screen.getByRole('list', { name: message('reply.queued', { count: 1 }) })
    expect(within(left).queryByText('Erster Schritt')).toBeNull()
    expect(within(left).getByText('Zweiter Schritt')).toBeInTheDocument()

    await userEvent.click(composer.send())
    expect(composer.onSubmit.mock.calls[0]?.[1]).toEqual({ version: 1, blocks: [paragraph('Zweiter Schritt')] })
  })

  it('removing one also leaves the stored draft', async () => {
    renderComposer({ draft: [paragraph('weg'), paragraph('bleibt')] })
    await userEvent.click(screen.getByRole('button', { name: message('reply.removeBlock', { number: 1 }) }))
    expect(JSON.parse(sessionStorage.getItem('stoa.teacherReplyDraft.r1') ?? '{}').blocks).toEqual([paragraph('bleibt')])
  })
})

describe('T8: line breaks and lists', () => {
  it('keeps the line breaks of a paragraph', () => {
    render(<RichTeacherReply content={{ version: 1, blocks: [paragraph('Zeile eins\nZeile zwei')] }} fallback="" />)
    const shown = screen.getByText(/Zeile eins/)
    expect(shown.textContent).toBe('Zeile eins\nZeile zwei')
    expect(shown).toHaveClass('whitespace-pre-wrap')
  })

  it.each([
    ['unordered_list', 'list-disc'],
    ['ordered_list', 'list-decimal'],
  ] as const)('shows a %s as one item a line', (type, marker) => {
    render(<RichTeacherReply content={{ version: 1, blocks: [{ type, text: 'Kürzen\n\nAusklammern\nPrüfen' }] }} fallback="" />)
    const list = screen.getByRole('list')
    expect(list).toHaveClass(marker)
    expect(within(list).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Kürzen', 'Ausklammern', 'Prüfen'])
  })

  it('sends a list typed with its own bullets as plain items', async () => {
    const composer = renderComposer()
    await userEvent.click(screen.getByRole('button', { name: de.reply.modes.unordered_list }))
    composer.type('- Kürzen\n* Ausklammern\n\n1. Prüfen\n')
    await userEvent.click(composer.send())
    expect(composer.onSubmit.mock.calls[0]?.[1].blocks).toEqual([{ type: 'unordered_list', text: 'Kürzen\nAusklammern\nPrüfen' }])
  })
})

describe('T9: focus and labels', () => {
  it('gives focus back to the reply after a block is added or removed', async () => {
    const composer = renderComposer()
    composer.type('Block')
    await userEvent.click(screen.getByRole('button', { name: ADD }))
    expect(composer.reply()).toHaveFocus()

    await userEvent.click(screen.getByRole('button', { name: message('reply.removeBlock', { number: 1 }) }))
    expect(composer.reply()).toHaveFocus()
  })

  it('keeps the reply focusable while it is sent, and focuses it again once sent', () => {
    const composer = renderComposer()
    composer.type('Hallo')
    composer.reply().focus()
    composer.setSubmitting(true)
    expect(composer.reply()).toBeEnabled()
    expect(composer.reply()).toHaveAttribute('readonly')
    expect(composer.reply()).toHaveFocus()

    // The disabled send button let go of the focus.
    act(() => (document.activeElement as HTMLElement).blur())
    composer.setSubmitting(false)
    expect(composer.reply()).toHaveFocus()
  })

  it('focuses the emptied reply once a reply is sent', async () => {
    const composer = renderComposer()
    composer.onSubmit.mockImplementation((_content, _rich, onSuccess: () => void) => onSuccess())
    composer.type('Hallo')
    await userEvent.click(composer.send())
    expect(composer.reply()).toHaveValue('')
    expect(composer.reply()).toHaveFocus()
  })

  it('says in text that the resolution note is required', async () => {
    vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail('in_progress'))
    renderDetail()
    const note = await screen.findByLabelText(de.detail.resolutionNote)
    expect(note).not.toHaveAttribute('placeholder')
    expect(note).toHaveAccessibleDescription(de.detail.resolutionNotePlaceholder)
    expect(screen.getByRole('button', { name: de.markResolved })).toHaveAccessibleDescription(de.detail.resolutionNotePlaceholder)
  })

  it('puts the focus on the request after a status change', async () => {
    vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail('pending'))
    let finish: (value: unknown) => void = () => {}
    vi.mocked(teacherApi.updateTeacherHelpRequestStatus).mockReturnValue(new Promise((resolve) => { finish = resolve }) as never)
    renderDetail()
    await userEvent.click(await screen.findByRole('button', { name: de.markInProgress }))

    // The pressed button is disabled now: focus stays on it, going nowhere.
    expect(screen.getByRole('button', { name: de.markInProgress })).toBeDisabled()
    await act(async () => finish({ requestId: 'r1', status: 'in_progress' }))
    await waitFor(() => expect(document.activeElement).toHaveAttribute('tabindex', '-1'))
    expect(document.activeElement).toHaveTextContent('Lea')
  })

  it('names the difficulty buttons as a group', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={new QueryClient()}>
          <AiTeacherToolsPanel request={detail('in_progress')} canAct />
        </QueryClientProvider>
      </I18nextProvider>,
    )
    const group = screen.getByRole('group', { name: de.aiTools.exercise.difficulty })
    expect(within(group).getAllByRole('button')).toHaveLength(3)
  })
})

describe('the new copy', () => {
  const bundles = { de, en, fr, it: italian }

  it('is in all four languages, with the placeholders filled', () => {
    for (const [language, bundle] of Object.entries(bundles)) {
      for (const key of ['blockTooLong', 'tooLong'] as const) {
        expect(bundle.reply.unsafe[key], `${language} ${key}`).toMatch(/\{\{length\}\}.*\{\{max\}\}|\{\{max\}\}.*\{\{length\}\}/)
      }
      expect(bundle.reply.unsafe.tooManyBlocks, language).toContain('{{max}}')
      expect(bundle.reply.removeBlock, language).toContain('{{number}}')
      for (const reason of ['html', 'privateMarkers', 'tooManyBlocks', 'blockTooLong', 'tooLong'] as const) {
        expect(bundle.toasts.replyRefusedBecause[reason], `${language} ${reason}`).toBeTruthy()
      }
      // #371: a block too long and a reply too long are not the same toast.
      expect(bundle.toasts.replyRefusedBecause.blockTooLong, language).not.toBe(bundle.toasts.replyRefusedBecause.tooLong)
    }
  })

  it('addresses teachers as Sie and vous, Italian informal, Swiss spelling', () => {
    const german = [...Object.values(de.reply.unsafe), de.reply.removeBlock, ...Object.values(de.toasts.replyRefusedBecause)]
    for (const text of german) {
      expect(text).not.toMatch(/\b(du|dich|dein|deine)\b/i)
      expect(text).not.toContain('ß')
    }
    expect(Object.values(de.toasts.replyRefusedBecause).every((text) => /\b(Sie|Ihre)\b/.test(text))).toBe(true)
    expect(Object.values(fr.toasts.replyRefusedBecause).every((text) => /\bVotre\b/.test(text) && /\bVeuillez\b/i.test(text))).toBe(true)
    expect(Object.values(italian.toasts.replyRefusedBecause).every((text) => /\btua\b/i.test(text))).toBe(true)
  })
})
