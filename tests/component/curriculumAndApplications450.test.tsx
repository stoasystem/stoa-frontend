/**
 * The curriculum console and the teacher applications page, from the
 * 2026-10-22 check of map #396's leftovers (#450).
 *
 * 1. After a publish was refused with stale_pointer, the open dialog kept the
 *    live version the backend had just refused, so Publish in it was refused
 *    again; only cancelling and reopening read the new one.
 * 2. The Evidence tab read whatever the field held: after the first load every
 *    keystroke sent a request, with the raw, untrimmed id, and the `..` check
 *    of #418 read the untrimmed id too.
 * 3. Two `role="status"` lines were `empty:hidden`, so `display: none` and out
 *    of the accessibility tree until their text arrived, which is when a
 *    screen reader may not announce them; the attachment tray's "Adding…"
 *    status was mounted together with its text, the same problem.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, isInaccessible, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { compile } from 'tailwindcss'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AttachmentTray } from '@/features/uploads/AttachmentTray'
import type { AttachmentDraft } from '@/features/uploads/useAttachmentUploads'
import i18n from '@/i18n'
import deAdmin from '@/i18n/locales/de/admin.json'
import enAdmin from '@/i18n/locales/en/admin.json'
import frAdmin from '@/i18n/locales/fr/admin.json'
import itAdmin from '@/i18n/locales/it/admin.json'
import { AdminCurriculumPage } from '@/pages/admin/AdminCurriculumPage'
import { AdminTeacherApplicationsPage } from '@/pages/admin/AdminTeacherApplicationsPage'
import { CurriculumActionDialog } from '@/pages/admin/CurriculumActionDialog'
import { adminQueryKeys } from '@/services/admin/adminQueryKeys'
import {
  applyCurriculumMigration,
  dryRunCurriculumMigration,
  getCurriculumMigrationEvidence,
  getCurriculumPreview,
  getCurriculumWorklist,
  publishCurriculumVersion,
  submitCurriculumReview,
} from '@/services/admin/curriculumApi'
import { ApiError } from '@/services/api/httpClient'
import type { CurriculumMigrationDryRunResponse, CurriculumVersion, CurriculumWorklistResponse } from '@/types/curriculumOperations'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('@/services/admin/curriculumApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/admin/curriculumApi')>()),
  getCurriculumWorklist: vi.fn(),
  getCurriculumPreview: vi.fn(),
  getCurriculumMigrationEvidence: vi.fn(),
  submitCurriculumReview: vi.fn(),
  publishCurriculumVersion: vi.fn(),
  dryRunCurriculumMigration: vi.fn(),
  applyCurriculumMigration: vi.fn(),
}))

const reissueMutate = vi.fn()
vi.mock('@/hooks/teacher/useTeacherApplication', () => ({
  useTeacherApplicationsQuery: (reviewState: string) => {
    const items = reviewState === 'approved' ? [APPROVED_APPLICATION] : []
    return { isPending: false, isSuccess: true, isError: false, error: null, data: { reviewState, items, count: items.length } }
  },
  useTeacherApplicationDetailQuery: () => ({ data: undefined, isPending: false, isError: false, error: null }),
  useReviewTeacherApplicationMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useReissueTeacherInvitationMutation: () => ({ mutate: reissueMutate, isPending: false }),
}))

const APPROVED_APPLICATION = {
  applicationId: 'app-1',
  version: 2,
  reviewState: 'approved',
  fullName: 'Lea Muster',
  verifiedEmail: 'lea@example.ch',
  subjects: ['math'],
}

const worklist = vi.mocked(getCurriculumWorklist)
const preview = vi.mocked(getCurriculumPreview)
const evidence = vi.mocked(getCurriculumMigrationEvidence)
const submit = vi.mocked(submitCurriculumReview)
const publish = vi.mocked(publishCurriculumVersion)
const dryRun = vi.mocked(dryRunCurriculumMigration)
const apply = vi.mocked(applyCurriculumMigration)

function version(versionId: string, state: string, updatedAt: string, extra: Partial<CurriculumVersion> = {}) {
  return { publicLessonId: 'lesson-1', versionId, state, updatedAt, updatedBy: 'admin-1', ...extra }
}

// lesson-1: v2 is live, v3 is approved and waiting to be published. Someone
// else publishes v5 while v3's dialog is open.
const LIVE = version('v2', 'published', '2026-10-17T12:00:00Z')
const CANDIDATE = version('v3', 'approved', '2026-10-18T09:00:00Z', { reviewState: 'approved' })
const PUBLISHED_ELSEWHERE = version('v5', 'published', '2026-10-19T08:00:00Z')
const ITEMS = [CANDIDATE, LIVE]

const STALE_POINTER = () => new ApiError('conflict', { status: 409, detail: 'stale_pointer' })

const DRY_RUN: CurriculumMigrationDryRunResponse = {
  migrationId: 'mig-1',
  confirmationToken: 'token-from-dry-run',
  source: {},
  summary: { total: 1, creates: 1, updates: 0, skips: 0, conflicts: 0, errors: 0 },
  rows: [],
  publishReady: true,
}

function evidenceOf(migrationId: string) {
  return { ...DRY_RUN, migrationId, status: 'applied', appliedBy: `operator-of-${migrationId}` }
}

/** The worklist the backend holds now; every read answers from it. */
let items: CurriculumVersion[]

beforeEach(async () => {
  await i18n.changeLanguage('en')
  vi.clearAllMocks()
  items = ITEMS
  worklist.mockImplementation(async () => ({ items, count: items.length }))
  preview.mockImplementation(async (_lesson, versionId) => ({
    ...(items.find((item) => item.versionId === versionId) ?? CANDIDATE),
    lesson: {},
    exercises: [],
  }))
  evidence.mockImplementation(async (migrationId) => evidenceOf(migrationId))
  submit.mockResolvedValue(CANDIDATE)
  publish.mockResolvedValue({ status: 'published' })
  dryRun.mockResolvedValue(DRY_RUN)
  apply.mockResolvedValue(evidenceOf('mig-1'))
})

const styles: HTMLStyleElement[] = []
afterEach(async () => {
  for (const style of styles.splice(0)) style.remove()
  await i18n.changeLanguage('en')
})

function renderPage(page: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>{page}</MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
  return client
}

const copy = enAdmin.curriculum

async function openVersion(user: ReturnType<typeof userEvent.setup>, versionId: string) {
  const card = (await screen.findByText(new RegExp(`^${versionId} ·`))).closest('div.grid') as HTMLElement
  await user.click(within(card).getByRole('button', { name: copy.worklist.open }))
  await user.click(screen.getByRole('tab', { name: copy.tabs.review }))
}

async function openPublishDialog(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() => expect(screen.getByRole('button', { name: copy.review.publish })).toBeEnabled())
  await user.click(screen.getByRole('button', { name: copy.review.publish }))
  const dialog = await screen.findByRole('dialog')
  await user.type(within(dialog).getByLabelText(copy.confirm.reason), 'Release')
  return dialog
}

const confirmButton = (dialog: HTMLElement) => within(dialog).getByRole('button', { name: copy.confirm.submit.publish })

describe('#450: a publish refused as stale, in the dialog still open', () => {
  it('shows the version live now, and Publish there sends that one', async () => {
    publish.mockImplementationOnce(async () => {
      items = [PUBLISHED_ELSEWHERE, ...ITEMS]
      throw STALE_POINTER()
    })
    const user = userEvent.setup()
    renderPage(<AdminCurriculumPage />)
    await openVersion(user, 'v3')
    const dialog = await openPublishDialog(user)
    expect(within(dialog).getByText(/^Currently live: v2\./)).toBeInTheDocument()

    await user.click(confirmButton(dialog))
    expect(await within(dialog).findByText(copy.errors.code.stale_pointer)).toHaveAttribute('role', 'alert')
    // The same line, now naming the version the backend holds; the reason stays.
    expect(await within(dialog).findByText(/^Currently live: v5\./)).toHaveAttribute('role', 'status')
    expect(within(dialog).getByLabelText(copy.confirm.reason)).toHaveValue('Release')

    await waitFor(() => expect(confirmButton(dialog)).toBeEnabled())
    await user.click(confirmButton(dialog))
    await waitFor(() => expect(publish).toHaveBeenCalledTimes(2))
    expect(publish.mock.calls.map(([input]) => input.expectedPublishedVersionId)).toEqual(['v2', 'v5'])
    expect(await screen.findByText('v3 is now published.')).toBeInTheDocument()
  })

  it('holds Publish while the worklist is read again, and says why', async () => {
    let answer: (response: CurriculumWorklistResponse) => void = () => {}
    publish.mockImplementationOnce(async () => {
      items = [PUBLISHED_ELSEWHERE, ...ITEMS]
      worklist.mockImplementationOnce(() => new Promise((resolve) => (answer = resolve)))
      throw STALE_POINTER()
    })
    const user = userEvent.setup()
    renderPage(<AdminCurriculumPage />)
    await openVersion(user, 'v3')
    const dialog = await openPublishDialog(user)

    await user.click(confirmButton(dialog))
    await within(dialog).findByText(copy.errors.code.stale_pointer)
    expect(within(dialog).getByRole('status')).toHaveTextContent(copy.confirm.liveVersionReading)
    expect(confirmButton(dialog)).toBeDisabled()
    // Leaving is still possible.
    expect(within(dialog).getByRole('button', { name: copy.confirm.cancel })).toBeEnabled()

    act(() => answer({ items, count: items.length }))
    expect(await within(dialog).findByText(/^Currently live: v5\./)).toBeInTheDocument()
    expect(confirmButton(dialog)).toBeEnabled()
    expect(publish).toHaveBeenCalledTimes(1)
  })

  it.each([
    { read: 'fails', answer: () => Promise.reject(new ApiError('down', { status: 503 })) },
    { read: 'is refused', answer: async () => ({ items: [], count: 0, permissionDenied: true }) },
  ])('when the read again $read, keeps the version it showed and lets Publish go', async ({ answer }) => {
    publish.mockImplementationOnce(async () => {
      worklist.mockImplementationOnce(answer)
      throw STALE_POINTER()
    })
    const user = userEvent.setup()
    renderPage(<AdminCurriculumPage />)
    await openVersion(user, 'v3')
    const dialog = await openPublishDialog(user)

    await user.click(confirmButton(dialog))
    await within(dialog).findByText(copy.errors.code.stale_pointer)
    await waitFor(() => expect(confirmButton(dialog)).toBeEnabled())
    // Not "nothing is live": the read said nothing about it.
    expect(within(dialog).getByRole('status')).toHaveTextContent(/^Currently live: v2\./)
  })

  it('never swaps in a version the dialog did not show: a read with no refusal leaves it as shown', async () => {
    const user = userEvent.setup()
    const client = renderPage(<AdminCurriculumPage />)
    await openVersion(user, 'v3')
    const dialog = await openPublishDialog(user)

    // The worklist moves on while the dialog is open, without a refusal.
    items = [PUBLISHED_ELSEWHERE, ...ITEMS]
    const reads = worklist.mock.calls.length
    await act(() => client.invalidateQueries({ queryKey: adminQueryKeys.curriculumWorklistAll() }))
    await waitFor(() => expect(worklist.mock.calls.length).toBeGreaterThan(reads))

    expect(within(dialog).getByText(/^Currently live: v2\./)).toBeInTheDocument()
    await user.click(confirmButton(dialog))
    await waitFor(() => expect(publish).toHaveBeenCalledTimes(1))
    // What it showed is what it sent; the backend's stale check decides.
    expect(publish.mock.calls[0][0].expectedPublishedVersionId).toBe('v2')
  })

  it.each([
    { language: 'en', admin: enAdmin },
    { language: 'de', admin: deAdmin },
    { language: 'fr', admin: frAdmin },
    { language: 'it', admin: itAdmin },
  ])('says it is checking the live version in $language', async ({ language, admin }) => {
    await i18n.changeLanguage(language)
    render(
      <I18nextProvider i18n={i18n}>
        <CurriculumActionDialog
          action={{ kind: 'publish', publicLessonId: 'lesson-1', versionId: 'v3', liveVersionId: 'v2' }}
          pending={false}
          error={null}
          liveVersionReading
          onCancel={() => {}}
          onConfirm={() => {}}
        />
      </I18nextProvider>,
    )
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('status')).toHaveTextContent(admin.curriculum.confirm.liveVersionReading)
    await userEvent.type(within(dialog).getByLabelText(admin.curriculum.confirm.reason), 'Release')
    expect(within(dialog).getByRole('button', { name: admin.curriculum.confirm.submit.publish })).toBeDisabled()
  })
})

describe('#450: the Evidence tab reads the id it was given, not the one being typed', () => {
  async function openEvidence() {
    const user = userEvent.setup()
    renderPage(<AdminCurriculumPage />)
    await user.click(screen.getByRole('tab', { name: copy.tabs.evidence }))
    return user
  }
  const field = () => screen.getByLabelText(copy.evidence.idLabel)
  const load = () => screen.getByRole('button', { name: copy.evidence.load })
  /** Let a read the page should not make start, so it would be seen. */
  const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 20)))

  it('typing after a load sends nothing and keeps the evidence on screen; Load reads the trimmed id', async () => {
    const user = await openEvidence()
    await user.type(field(), 'mig-1')
    await user.click(load())
    expect(await screen.findByText(/operator-of-mig-1/)).toBeInTheDocument()
    expect(evidence.mock.calls).toEqual([['mig-1']])

    await user.type(field(), '2')
    await settle()
    expect(evidence).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/operator-of-mig-1/)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    await user.clear(field())
    await user.type(field(), '  mig-2 ')
    await user.click(load())
    expect(await screen.findByText(/operator-of-mig-2/)).toBeInTheDocument()
    expect(evidence.mock.calls).toEqual([['mig-1'], ['mig-2']])
  })

  it.each([' .. ', '. '])('says %j is not valid once trimmed, and reads nothing for it', async (typed) => {
    const user = await openEvidence()
    await user.type(field(), typed)
    await user.click(load())

    expect(await screen.findByText(copy.evidence.invalidId)).toHaveAttribute('role', 'alert')
    await settle()
    expect(evidence).not.toHaveBeenCalled()
  })

  it('Load on the same id reads it again, so one asked for too early can be asked for again', async () => {
    evidence.mockRejectedValueOnce(new ApiError('not found', { status: 404, detail: 'migration_not_found' }))
    const user = await openEvidence()
    await user.type(field(), 'mig-1')
    await user.click(load())
    expect(await screen.findByText(copy.errors.code.migration_not_found)).toBeInTheDocument()

    await user.click(load())
    expect(await screen.findByText(/operator-of-mig-1/)).toBeInTheDocument()
    expect(evidence.mock.calls).toEqual([['mig-1'], ['mig-1']])
  })

  it('a dry run fills in its id without reading it; the apply reads its evidence', async () => {
    const user = userEvent.setup()
    renderPage(<AdminCurriculumPage />)
    await user.click(screen.getByRole('tab', { name: copy.tabs.migration }))
    await user.click(screen.getByRole('button', { name: copy.migration.dryRun }))
    await screen.findByText(copy.migration.ready)
    await settle()
    // The backend keeps evidence only once a migration is applied.
    expect(evidence).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: copy.migration.apply }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: copy.migration.apply }))
    await screen.findByText('Applied mig-1.')
    await waitFor(() => expect(evidence.mock.calls).toEqual([['mig-1']]))

    await user.click(screen.getByRole('tab', { name: copy.tabs.evidence }))
    expect(field()).toHaveValue('mig-1')
    expect(await screen.findByText(/operator-of-mig-1/)).toBeInTheDocument()
  })
})

/**
 * jsdom applies no Tailwind, so here `empty:hidden` is a class like any other
 * and an empty line carrying it looks present. This compiles the classes of
 * every live region on the page with the real Tailwind and puts the rules in
 * the document, so `isInaccessible` - how `getByRole` leaves out what is not
 * in the accessibility tree - meets the `display: none` a browser would.
 * Tailwind nests a variant (`.empty\:hidden { &:empty { … } }`) and jsdom
 * reads no nesting, so that one level is flattened; anything else nested
 * fails the test rather than being dropped.
 */
async function applyTailwindToStatusLines() {
  const classes = new Set<string>()
  for (const element of document.querySelectorAll('[role="status"]')) element.classList.forEach((name) => classes.add(name))
  const compiler = await compile('@tailwind utilities;', {
    loadStylesheet: async (id) => {
      throw new Error(`no stylesheet expected, asked for ${id}`)
    },
  })
  const css = compiler
    .build([...classes])
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/([^{}]+?)\s*\{\s*&([^{}]+?)\s*\{([^{}]*)\}\s*\}/g, '$1$2 {$3}')
  if (/[&@]/.test(css)) throw new Error(`a rule this test cannot flatten:\n${css}`)
  const style = document.createElement('style')
  style.textContent = css
  document.head.append(style)
  styles.push(style)
}

describe('#450: status lines are in the accessibility tree before their text arrives', () => {
  it('the curriculum review notice, which alone says a submit for review worked', async () => {
    const user = userEvent.setup()
    renderPage(<AdminCurriculumPage />)
    await openVersion(user, 'v3')
    const line = screen.getByRole('status')
    expect(line).toBeEmptyDOMElement()
    await applyTailwindToStatusLines()
    expect(isInaccessible(line)).toBe(false)

    await user.click(screen.getByRole('button', { name: copy.review.submit }))
    await waitFor(() => expect(line).toHaveTextContent('v3 was submitted for review.'))
    expect(screen.getByRole('status')).toBe(line)
    expect(line).not.toHaveClass('sr-only')
  })

  it('the teacher applications message line, which alone says a resend worked', async () => {
    reissueMutate.mockImplementation((_input, options) => options.onSuccess({ invitationDelivered: true }))
    const user = userEvent.setup()
    renderPage(<AdminTeacherApplicationsPage />)
    await user.click(screen.getByRole('button', { name: enAdmin.teacherApplications.states.approved }))
    await user.click(screen.getByRole('button', { name: /Lea Muster/ }))
    const line = screen.getByRole('status')
    expect(line).toBeEmptyDOMElement()
    await applyTailwindToStatusLines()
    expect(isInaccessible(line)).toBe(false)

    await user.click(screen.getByRole('button', { name: enAdmin.teacherApplications.resend }))
    expect(line).toHaveTextContent(enAdmin.teacherApplications.resent)
    expect(screen.getByRole('status')).toBe(line)
    expect(line).not.toHaveClass('sr-only')
  })

  it('the attachment tray, before the first file is chosen', async () => {
    const draft = (localId: string, filename: string, state: AttachmentDraft['state']): AttachmentDraft => ({
      localId,
      filename,
      sizeBytes: 1024,
      mimeType: 'image/png',
      state,
    })
    const tray = (drafts: AttachmentDraft[]) => (
      <I18nextProvider i18n={i18n}>
        <AttachmentTray drafts={drafts} overflow={false} onRemove={() => {}} />
      </I18nextProvider>
    )
    const { rerender } = render(tray([]))
    const line = screen.getByRole('status')
    expect(line).toBeEmptyDOMElement()

    rerender(tray([draft('a', 'exercise.png', 'uploading')]))
    // The same node, now holding the words: that is what gets announced.
    expect(screen.getByRole('status')).toBe(line)
    expect(line).toHaveTextContent('Adding exercise.png…')
    // The row still says it on screen.
    expect(screen.getByText('Adding…')).toBeInTheDocument()

    rerender(tray([draft('a', 'exercise.png', 'ready'), draft('b', 'notes.pdf', 'uploading')]))
    expect(screen.getByRole('status')).toBe(line)
    expect(line).toHaveTextContent(/^Adding notes\.pdf…$/)

    rerender(tray([draft('a', 'exercise.png', 'ready'), draft('b', 'notes.pdf', 'ready')]))
    expect(line).toBeEmptyDOMElement()
  })
})
