/**
 * #332: the teacher's reply composer.
 *
 * What the reply may be -- the server's limits, its secret markers, a stored
 * draft read block by block (#371), a refusal read by its code first (#388) --
 * is the reply module's, held through `useTeacherReply` in teacherReply564 and
 * through its rules in replyRules564. These hold the composer's wiring to it:
 *
 * T3 - a reply that may not go says why, on the field, and sends nothing.
 * T4 - queued blocks are shown and can be removed.
 * T8 - line breaks survive into the timeline; a list block is one item a line.
 * T9 - focus is not dropped after an action, the resolution note says it is
 *      required in text, and the difficulty buttons are a named group.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AiTeacherToolsPanel } from '@/components/teacher/AiTeacherToolsPanel'
import { RichTeacherReply } from '@/components/teacher/RichTeacherReply'
import { TeacherReplyComposer } from '@/features/teacherReply/TeacherReplyComposer'
import type { TeacherReplyAdapter } from '@/features/teacherReply/teacherReplyAdapter'
import { useTeacherReply } from '@/features/teacherReply/useTeacherReply'
import i18n from '@/i18n'
import de from '@/i18n/locales/de/teacher.json'
import en from '@/i18n/locales/en/teacher.json'
import fr from '@/i18n/locales/fr/teacher.json'
import italian from '@/i18n/locales/it/teacher.json'
import { TeacherHelpRequestDetailPage } from '@/pages/teacher/TeacherHelpRequestDetailPage'
import * as teacherApi from '@/services/teacher/teacherApi'
import type { TeacherHelpRequestNote, TeacherReplyBlock } from '@/types/teacher'
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

function Composer({ adapter }: { adapter: TeacherReplyAdapter }) {
  const reply = useTeacherReply('r1', { adapter })
  return <TeacherReplyComposer reply={reply} />
}

/** The composer over an in-memory server that answers once `answer()` is called. */
function renderComposer({ draft }: { draft?: TeacherReplyBlock[] } = {}) {
  if (draft) sessionStorage.setItem('stoa.teacherReplyDraft.r1', JSON.stringify({ mode: 'paragraph', value: '', blocks: draft }))
  let answer: () => void = () => undefined
  const addNote = vi.fn<TeacherReplyAdapter['addNote']>(
    () => new Promise<TeacherHelpRequestNote>((resolve) => (answer = () => resolve({ id: 'n1' } as TeacherHelpRequestNote))),
  )
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={new QueryClient()}>
        <Composer adapter={{ addNote }} />
      </QueryClientProvider>
    </I18nextProvider>,
  )
  return {
    addNote,
    answer: () => act(async () => answer()),
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

describe('T3: a reply that may not go', () => {
  it('says why on the field, and neither queues nor sends it', () => {
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

  it('says a reason without numbers in its own words', () => {
    const composer = renderComposer()
    composer.type('Siehe s3://bucket/datei')
    expect(screen.getByText(de.reply.unsafe.privateMarkers)).toBeInTheDocument()
    expect(composer.send()).toBeDisabled()
  })
})

describe('#371: a stored draft', () => {
  it('with a block missing its text keeps the request page up', async () => {
    sessionStorage.setItem(
      'stoa.teacherReplyDraft.r1',
      JSON.stringify({ mode: 'paragraph', value: '', blocks: [{ type: 'paragraph' }, { type: 'formula' }] }),
    )
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
    expect(composer.addNote.mock.calls[0]?.[1].richContent).toEqual({ version: 1, blocks: [paragraph('Zweiter Schritt')] })
  })

  it('come back from the stored draft', () => {
    renderComposer({ draft: [paragraph('weg'), paragraph('bleibt')] })
    expect(screen.getByRole('list', { name: message('reply.queued', { count: 2 }) })).toBeInTheDocument()
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

  it('offers the list mode, pressed once chosen', async () => {
    renderComposer()
    const list = screen.getByRole('button', { name: de.reply.modes.unordered_list })
    await userEvent.click(list)
    expect(list).toHaveAttribute('aria-pressed', 'true')
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

  it('keeps the reply focusable while it is sent, and focuses it again once sent', async () => {
    const composer = renderComposer()
    composer.type('Hallo')
    composer.reply().focus()
    fireEvent.submit(composer.reply().closest('form')!)
    await waitFor(() => expect(composer.reply()).toHaveAttribute('readonly'))
    expect(composer.reply()).toBeEnabled()
    expect(composer.reply()).toHaveFocus()

    // The disabled send button let go of the focus.
    act(() => (document.activeElement as HTMLElement).blur())
    await composer.answer()
    await waitFor(() => expect(composer.reply()).toHaveFocus())
  })

  it('focuses the emptied reply once a reply is sent', async () => {
    const composer = renderComposer()
    composer.type('Hallo')
    await userEvent.click(composer.send())
    await composer.answer()
    await waitFor(() => expect(composer.reply()).toHaveValue(''))
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
