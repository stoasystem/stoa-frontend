/**
 * The curriculum console asks before it changes what students see (#258).
 *
 * Publish, approve and request-changes ran on the first click and could be
 * sent twice; publish sent `expectedPublishedVersionId: null` with an English
 * reason the console made up, and nothing refreshed afterwards. Invalid JSON
 * threw from the click handler, so the button did nothing. Migration apply
 * auto-filled its own confirmation, and sent whatever the editor held, not
 * the manifest that was dry-run.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { AdminCurriculumPage } from '@/pages/admin/AdminCurriculumPage'
import {
  applyCurriculumMigration,
  approveCurriculumVersion,
  dryRunCurriculumMigration,
  getCurriculumPreview,
  getCurriculumWorklist,
  patchCurriculumDraft,
  publishCurriculumVersion,
  requestCurriculumChanges,
  submitCurriculumReview,
} from '@/services/admin/curriculumApi'
import { ApiError } from '@/services/api/httpClient'
import type { CurriculumMigrationDryRunResponse, CurriculumVersion } from '@/types/curriculumOperations'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('@/services/admin/curriculumApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/admin/curriculumApi')>(
    '@/services/admin/curriculumApi',
  )
  return {
    ...actual,
    getCurriculumWorklist: vi.fn(),
    getCurriculumPreview: vi.fn(),
    patchCurriculumDraft: vi.fn(),
    submitCurriculumReview: vi.fn(),
    approveCurriculumVersion: vi.fn(),
    requestCurriculumChanges: vi.fn(),
    publishCurriculumVersion: vi.fn(),
    dryRunCurriculumMigration: vi.fn(),
    applyCurriculumMigration: vi.fn(),
  }
})

const worklist = vi.mocked(getCurriculumWorklist)
const preview = vi.mocked(getCurriculumPreview)
const patch = vi.mocked(patchCurriculumDraft)
const submit = vi.mocked(submitCurriculumReview)
const approve = vi.mocked(approveCurriculumVersion)
const requestChanges = vi.mocked(requestCurriculumChanges)
const publish = vi.mocked(publishCurriculumVersion)
const dryRun = vi.mocked(dryRunCurriculumMigration)
const apply = vi.mocked(applyCurriculumMigration)

function version(versionId: string, state: string, updatedAt: string, extra: Partial<CurriculumVersion> = {}) {
  return { publicLessonId: 'lesson-1', versionId, state, updatedAt, updatedBy: 'admin-1', ...extra }
}

// The newest published version of lesson-1 is v2; v1 is an older one, and
// lesson-2 has its own live version that must not be taken for lesson-1's.
const CANDIDATE = version('v3', 'approved', '2026-10-18T09:00:00Z', { reviewState: 'approved' })
const ITEMS = [
  CANDIDATE,
  { ...version('w1', 'published', '2026-10-18T08:30:00Z'), publicLessonId: 'lesson-2' },
  version('v2', 'published', '2026-10-17T12:00:00Z'),
  version('v1', 'published', '2026-10-01T12:00:00Z'),
]

const DRY_RUN: CurriculumMigrationDryRunResponse = {
  migrationId: 'mig-1',
  confirmationToken: 'token-from-dry-run',
  source: {},
  summary: { total: 1, creates: 1, updates: 0, skips: 0, conflicts: 0, errors: 0 },
  rows: [],
  publishReady: true,
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  vi.clearAllMocks()
  worklist.mockResolvedValue({ items: ITEMS, count: ITEMS.length })
  preview.mockImplementation(async (_lesson, versionId) => ({
    ...(ITEMS.find((item) => item.versionId === versionId) ?? CANDIDATE),
    lesson: {},
    exercises: [],
  }))
  publish.mockResolvedValue({ status: 'published' })
  approve.mockResolvedValue(CANDIDATE)
  requestChanges.mockResolvedValue(CANDIDATE)
  submit.mockResolvedValue(CANDIDATE)
  patch.mockResolvedValue(CANDIDATE)
  dryRun.mockResolvedValue(DRY_RUN)
  apply.mockResolvedValue({ ...DRY_RUN, status: 'applied' })
})
afterEach(() => {
  vi.useRealTimers()
})
afterAll(async () => {
  await i18n.changeLanguage('en')
})

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <AdminCurriculumPage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

/** Opens v3 from the worklist and goes to the review tab. */
async function openReview(user: ReturnType<typeof userEvent.setup>) {
  renderPage()
  const card = (await screen.findByText('v3', { exact: false })).closest('div.grid') as HTMLElement
  await user.click(within(card).getByRole('button', { name: 'Open' }))
  await user.click(screen.getByRole('tab', { name: 'Review' }))
  await screen.findByRole('button', { name: 'Publish' })
  // The live version is read from the worklist, so wait for it to settle.
  await waitFor(() => expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled())
}

describe('publish', () => {
  it('asks first, sends the live version and the reason the admin typed, and says it worked', async () => {
    const user = userEvent.setup()
    await openReview(user)
    const worklistReads = worklist.mock.calls.length

    await user.click(screen.getByRole('button', { name: 'Publish' }))
    expect(publish).not.toHaveBeenCalled()
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/Currently live: v2\./)).toBeInTheDocument()
    const confirm = within(dialog).getByRole('button', { name: 'Publish' })
    expect(confirm).toBeDisabled()

    await user.type(within(dialog).getByLabelText('Reason for the audit log'), 'Term 2 fixes')
    await user.click(confirm)

    await waitFor(() => expect(publish).toHaveBeenCalledTimes(1))
    expect(publish.mock.calls[0][0]).toEqual({
      publicLessonId: 'lesson-1',
      versionId: 'v3',
      expectedPublishedVersionId: 'v2',
      reason: 'Term 2 fixes',
    })
    expect(await screen.findByText('v3 is now published.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(worklist.mock.calls.length).toBeGreaterThan(worklistReads))
    // The preview of the version is read again too.
    await waitFor(() => expect(preview.mock.calls.filter(([, id]) => id === 'v3').length).toBeGreaterThan(1))
  })

  it('sends null when no version of the lesson is live, and says so', async () => {
    worklist.mockResolvedValue({ items: [CANDIDATE], count: 1 })
    const user = userEvent.setup()
    await openReview(user)

    await user.click(screen.getByRole('button', { name: 'Publish' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/No version of this lesson is live yet/)).toBeInTheDocument()
    await user.type(within(dialog).getByLabelText('Reason for the audit log'), 'First release')
    await user.click(within(dialog).getByRole('button', { name: 'Publish' }))

    await waitFor(() => expect(publish).toHaveBeenCalledTimes(1))
    expect(publish.mock.calls[0][0].expectedPublishedVersionId).toBeNull()
  })

  it('sends once on a double click, and holds every review button while it runs', async () => {
    const pending = deferred<unknown>()
    publish.mockReturnValue(pending.promise)
    const user = userEvent.setup()
    await openReview(user)

    await user.click(screen.getByRole('button', { name: 'Publish' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Reason for the audit log'), 'Release')
    await user.dblClick(within(dialog).getByRole('button', { name: 'Publish' }))

    await waitFor(() => expect(publish).toHaveBeenCalledTimes(1))
    expect(within(dialog).getByRole('button', { name: 'Publish' })).toBeDisabled()
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled()
    for (const name of ['Submit', 'Approve', 'Request changes']) {
      expect(screen.getByRole('button', { name, hidden: true })).toBeDisabled()
    }

    pending.resolve({ status: 'published' })
    expect(await screen.findByText('v3 is now published.')).toBeInTheDocument()
    expect(publish).toHaveBeenCalledTimes(1)
  })

  it('sends once when the second click lands before the page re-renders', async () => {
    const user = userEvent.setup()
    await openReview(user)

    await user.click(screen.getByRole('button', { name: 'Publish' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Reason for the audit log'), 'Release')
    const confirm = within(dialog).getByRole('button', { name: 'Publish' })
    // Same tick: the mutation is not pending yet, so nothing is disabled.
    fireEvent.click(confirm)
    fireEvent.click(confirm)

    expect(await screen.findByText('v3 is now published.')).toBeInTheDocument()
    expect(publish).toHaveBeenCalledTimes(1)
  })

  it('shows a stale-version refusal in the dialog and keeps the reason for a retry', async () => {
    publish.mockRejectedValue(new ApiError('conflict', { status: 409, detail: 'stale_pointer' }))
    const user = userEvent.setup()
    await openReview(user)

    await user.click(screen.getByRole('button', { name: 'Publish' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Reason for the audit log'), 'Release')
    await user.click(within(dialog).getByRole('button', { name: 'Publish' }))

    expect(await within(dialog).findByText(/Someone else published a different version/)).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Reason for the audit log')).toHaveValue('Release')
    expect(screen.queryByText('v3 is now published.')).not.toBeInTheDocument()
  })
})

describe('approve and request changes', () => {
  it('approve waits for confirmation', async () => {
    const user = userEvent.setup()
    await openReview(user)

    await user.click(screen.getByRole('button', { name: 'Approve' }))
    expect(approve).not.toHaveBeenCalled()
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }))

    await waitFor(() => expect(approve).toHaveBeenCalledWith('lesson-1', 'v3'))
    expect(await screen.findByText('v3 was approved.')).toBeInTheDocument()
  })

  it('cancel sends nothing', async () => {
    const user = userEvent.setup()
    await openReview(user)

    await user.click(screen.getByRole('button', { name: 'Approve' }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(approve).not.toHaveBeenCalled()
  })

  it('request changes sends the reason the admin typed', async () => {
    const user = userEvent.setup()
    await openReview(user)

    await user.click(screen.getByRole('button', { name: 'Request changes' }))
    const dialog = await screen.findByRole('dialog')
    const confirm = within(dialog).getByRole('button', { name: 'Request changes' })
    expect(confirm).toBeDisabled()
    await user.type(within(dialog).getByLabelText('Reason for the audit log'), 'Exercise 2 has no answer key')
    await user.click(confirm)

    await waitFor(() => expect(requestChanges).toHaveBeenCalledTimes(1))
    expect(requestChanges.mock.calls[0][0]).toEqual({
      publicLessonId: 'lesson-1',
      versionId: 'v3',
      reason: 'Exercise 2 has no answer key',
    })
  })

  it('submit for review is sent once when both clicks land in one tick', async () => {
    const user = userEvent.setup()
    await openReview(user)

    const button = screen.getByRole('button', { name: 'Submit' })
    fireEvent.click(button)
    fireEvent.click(button)

    expect(await screen.findByText('v3 was submitted for review.')).toBeInTheDocument()
    expect(submit).toHaveBeenCalledTimes(1)
  })

  it('submit for review is sent once on a double click', async () => {
    const pending = deferred<CurriculumVersion>()
    submit.mockReturnValue(pending.promise)
    const user = userEvent.setup()
    await openReview(user)

    await user.dblClick(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled())
    pending.resolve(CANDIDATE)

    expect(await screen.findByText('v3 was submitted for review.')).toBeInTheDocument()
    expect(submit).toHaveBeenCalledTimes(1)
  })
})

describe('invalid JSON', () => {
  it('the draft editor says so instead of doing nothing', async () => {
    const user = userEvent.setup()
    renderPage()
    const card = (await screen.findByText('v3', { exact: false })).closest('div.grid') as HTMLElement
    await user.click(within(card).getByRole('button', { name: 'Open' }))
    await user.click(screen.getByRole('tab', { name: 'Editor' }))

    const editor = screen.getByRole('textbox', { name: 'Draft patch' })
    // No English placeholder title a careless save would write.
    expect(editor).toHaveValue('{}')
    await user.clear(editor)
    await user.type(editor, '{{"title": ')
    await user.click(screen.getByRole('button', { name: 'Save draft' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('JSON is invalid')
    expect(patch).not.toHaveBeenCalled()
  })

  it('the migration manifest says so instead of doing nothing', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('tab', { name: 'Migration' }))

    const editor = screen.getByRole('textbox', { name: 'Manifest' })
    await user.clear(editor)
    await user.type(editor, 'not json')
    await user.click(screen.getByRole('button', { name: 'Dry-run' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('JSON is invalid')
    expect(dryRun).not.toHaveBeenCalled()
  })
})

describe('migration apply', () => {
  async function dryRunStarter(user: ReturnType<typeof userEvent.setup>) {
    renderPage()
    await user.click(screen.getByRole('tab', { name: 'Migration' }))
    await user.click(screen.getByRole('button', { name: 'Dry-run' }))
    await screen.findByText('Ready')
  }

  it('asks first, and sends the manifest that was dry-run with its token', async () => {
    const user = userEvent.setup()
    await dryRunStarter(user)
    const dryRunManifest = dryRun.mock.calls[0][0]
    // The token is no longer typed in for the admin.
    expect(screen.queryByDisplayValue('token-from-dry-run')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Apply migration' }))
    expect(apply).not.toHaveBeenCalled()
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('1 new, 0 updated, 0 skipped.')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Apply migration' }))

    await waitFor(() => expect(apply).toHaveBeenCalledTimes(1))
    expect(apply.mock.calls[0][0]).toEqual({
      migrationId: 'mig-1',
      manifest: dryRunManifest,
      confirmationToken: 'token-from-dry-run',
    })
    expect(await screen.findByText('Applied mig-1.')).toBeInTheDocument()
  })

  it('drops the dry run when the manifest is edited, so the edit cannot be applied unchecked', async () => {
    const user = userEvent.setup()
    await dryRunStarter(user)

    await user.type(screen.getByRole('textbox', { name: 'Manifest' }), ' ')

    expect(screen.queryByText('Ready')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Apply migration' })).not.toBeInTheDocument()
    expect(apply).not.toHaveBeenCalled()
  })
})

describe('what the console shows', () => {
  it('a failed worklist shows the error without also saying the list is empty', async () => {
    worklist.mockRejectedValue(new ApiError('boom', { status: 500 }))
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('The server could not complete this request')
    expect(screen.queryByText('No curriculum items are available.')).not.toBeInTheDocument()
  })

  it('states, dates and capabilities in the reader’s language', async () => {
    await i18n.changeLanguage('de')
    renderPage()

    expect((await screen.findAllByText('Veröffentlicht')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Freigegeben').length).toBeGreaterThan(0)
    expect(screen.getByText('Veröffentlichung')).toBeInTheDocument()
    expect(document.body.textContent).not.toContain('2026-10-18T09:00:00Z')
    expect(document.body.textContent).not.toContain('curriculum_publisher')
    expect(document.body.textContent).not.toMatch(/\bpublished\b/)
  })
})
