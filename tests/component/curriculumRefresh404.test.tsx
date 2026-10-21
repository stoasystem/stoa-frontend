/**
 * A curriculum write refreshes every read it changed (#404).
 *
 * A saved patch refreshed only the worklist and the preview, so after fixing
 * the blocking issues the review tab still said "Not ready to publish", the
 * diff was the old one and the audit had no `patch_draft`. An applied
 * migration refreshed only its own evidence, so after a manifest with
 * `publish: true` the worklist kept the old live version, and the next publish
 * of that lesson sent it and was refused with 409 stale_pointer. A refused
 * publish refreshed nothing either, though the backend audits the refusal and
 * the refusal means the worklist's live version is out of date.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import {
  useApplyCurriculumMigrationMutation,
  useApproveCurriculumVersionMutation,
  usePatchCurriculumDraftMutation,
  usePublishCurriculumVersionMutation,
  useRequestCurriculumChangesMutation,
  useSubmitCurriculumReviewMutation,
} from '@/hooks/admin/useCurriculumOperationsQuery'
import { AdminCurriculumPage } from '@/pages/admin/AdminCurriculumPage'
import { adminQueryKeys } from '@/services/admin/adminQueryKeys'
import {
  applyCurriculumMigration,
  approveCurriculumVersion,
  dryRunCurriculumMigration,
  getCurriculumAudit,
  getCurriculumDiff,
  getCurriculumPreview,
  getCurriculumValidationPreview,
  getCurriculumWorklist,
  patchCurriculumDraft,
  publishCurriculumVersion,
  requestCurriculumChanges,
  submitCurriculumReview,
} from '@/services/admin/curriculumApi'
import { ApiError } from '@/services/api/httpClient'
import type {
  CurriculumAuditEvent,
  CurriculumMigrationDryRunResponse,
  CurriculumVersion,
} from '@/types/curriculumOperations'

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
    getCurriculumValidationPreview: vi.fn(),
    getCurriculumAudit: vi.fn(),
    getCurriculumDiff: vi.fn(),
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
const validation = vi.mocked(getCurriculumValidationPreview)
const audit = vi.mocked(getCurriculumAudit)
const diff = vi.mocked(getCurriculumDiff)
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

// lesson-1: v2 is live, v3 is approved and waiting to be published, v4 is a
// draft with a blocking issue.
const LIVE = version('v2', 'published', '2026-10-17T12:00:00Z')
const CANDIDATE = version('v3', 'approved', '2026-10-18T09:00:00Z', { reviewState: 'approved' })
const DRAFT = version('v4', 'draft', '2026-10-18T10:00:00Z')
const ITEMS = [DRAFT, CANDIDATE, LIVE]

function event(operation: string, versionId: string): CurriculumAuditEvent {
  return {
    eventId: `event-${operation}`,
    publicLessonId: 'lesson-1',
    versionId,
    operation,
    actorId: 'admin-1',
    actorCapabilities: ['curriculum_author'],
  }
}

const DRY_RUN: CurriculumMigrationDryRunResponse = {
  migrationId: 'mig-1',
  confirmationToken: 'token-from-dry-run',
  source: {},
  summary: { total: 1, creates: 1, updates: 0, skips: 0, conflicts: 0, errors: 0 },
  rows: [],
  publishReady: true,
}

const STALE_POINTER = () => new ApiError('conflict', { status: 409, detail: 'stale_pointer' })

/** What the backend holds; the mocks answer from it, so a read after a write sees the write. */
let server: { items: CurriculumVersion[]; fixed: boolean; events: CurriculumAuditEvent[] }

beforeEach(async () => {
  await i18n.changeLanguage('en')
  vi.clearAllMocks()
  server = { items: ITEMS, fixed: false, events: [event('create_draft', 'v4')] }
  worklist.mockImplementation(async () => ({ items: server.items, count: server.items.length }))
  preview.mockImplementation(async (_lesson, versionId) => ({
    ...(server.items.find((item) => item.versionId === versionId) ?? DRAFT),
    lesson: { title: server.fixed ? 'Fixed title' : '' },
    exercises: [],
  }))
  validation.mockImplementation(async (publicLessonId, versionId) => ({
    publicLessonId,
    versionId,
    status: server.fixed ? 'valid' : 'invalid',
    publishReady: server.fixed,
    issues: server.fixed ? [] : [{ severity: 'blocking', field: 'lesson.title', message: 'title is required' }],
    issueCount: server.fixed ? 0 : 1,
  }))
  audit.mockImplementation(async (publicLessonId) => ({
    publicLessonId,
    items: server.events,
    count: server.events.length,
  }))
  diff.mockImplementation(async (publicLessonId, fromVersionId, toVersionId) => {
    const changes = server.fixed ? [{ path: 'lesson.title', type: 'changed', before: 'Live title', after: 'Fixed title' }] : []
    return { publicLessonId, fromVersionId, toVersionId, changes, changeCount: changes.length }
  })
  patch.mockImplementation(async ({ versionId }) => {
    server.fixed = true
    server.events = [event('patch_draft', versionId), ...server.events]
    return { ...DRAFT, lesson: { title: 'Fixed title' }, exercises: [] }
  })
  submit.mockResolvedValue(CANDIDATE)
  approve.mockResolvedValue(CANDIDATE)
  requestChanges.mockResolvedValue(CANDIDATE)
  publish.mockResolvedValue({ status: 'published' })
  dryRun.mockResolvedValue(DRY_RUN)
  apply.mockResolvedValue({ ...DRY_RUN, status: 'applied' })
})
afterAll(async () => {
  await i18n.changeLanguage('en')
})

function newQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  })
}

describe('what each write marks stale', () => {
  const OTHER = 'lesson-2'
  const keys = {
    worklist: adminQueryKeys.curriculumWorklist(),
    worklistInReview: adminQueryKeys.curriculumWorklist('in_review'),
    preview: adminQueryKeys.curriculumPreview('lesson-1', 'v4'),
    validation: adminQueryKeys.curriculumValidation('lesson-1', 'v4'),
    audit: adminQueryKeys.curriculumAudit('lesson-1'),
    diffFromLive: adminQueryKeys.curriculumDiff('lesson-1', 'v2', 'v4'),
    diffToDraft: adminQueryKeys.curriculumDiff('lesson-1', 'v4', 'v3'),
    otherPreview: adminQueryKeys.curriculumPreview(OTHER, 'w1'),
    otherValidation: adminQueryKeys.curriculumValidation(OTHER, 'w1'),
    otherAudit: adminQueryKeys.curriculumAudit(OTHER),
    otherDiff: adminQueryKeys.curriculumDiff(OTHER, 'w0', 'w1'),
    evidence: adminQueryKeys.curriculumMigrationEvidence('mig-0'),
  }
  type Key = keyof typeof keys
  const ALL = Object.keys(keys) as Key[]

  function seeded() {
    const queryClient = newQueryClient()
    for (const key of ALL) queryClient.setQueryData(keys[key], { seeded: key })
    // Not the curriculum console's: no curriculum write may touch it.
    queryClient.setQueryData(adminQueryKeys.accountsAll(), { seeded: 'accounts' })
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const stale = () => ALL.filter((key) => queryClient.getQueryState(keys[key])?.isInvalidated)
    const accountsStale = () => queryClient.getQueryState(adminQueryKeys.accountsAll())?.isInvalidated
    return { wrapper, stale, accountsStale }
  }

  type Wrapper = ReturnType<typeof seeded>['wrapper']
  const target = { publicLessonId: 'lesson-1', versionId: 'v4' }
  const VERSION_STEP: Key[] = ['worklist', 'worklistInReview', 'preview', 'audit']

  it('a patch: the version, its validation and every diff of the lesson, no other lesson', async () => {
    const { wrapper, stale } = seeded()
    const { result } = renderHook(() => usePatchCurriculumDraftMutation(), { wrapper })

    await result.current.mutateAsync({ ...target, payload: {} })

    await waitFor(() =>
      expect(stale()).toEqual(['worklist', 'worklistInReview', 'preview', 'validation', 'audit', 'diffFromLive', 'diffToDraft']),
    )
  })

  const reviewSteps: Record<string, (wrapper: Wrapper) => Promise<unknown>> = {
    'submit for review': (wrapper) =>
      renderHook(() => useSubmitCurriculumReviewMutation(), { wrapper }).result.current.mutateAsync(target),
    approve: (wrapper) =>
      renderHook(() => useApproveCurriculumVersionMutation(), { wrapper }).result.current.mutateAsync(target),
    'request changes': (wrapper) =>
      renderHook(() => useRequestCurriculumChangesMutation(), { wrapper }).result.current.mutateAsync({ ...target, reason: 'r' }),
    publish: (wrapper) =>
      renderHook(() => usePublishCurriculumVersionMutation(), { wrapper }).result.current.mutateAsync({
        ...target,
        expectedPublishedVersionId: 'v2',
      }),
  }

  it.each(Object.entries(reviewSteps))('%s: the worklist under any filter, the version and the audit', async (_name, run) => {
    const { wrapper, stale } = seeded()

    await run(wrapper)

    await waitFor(() => expect(stale()).toEqual(VERSION_STEP))
  })

  it('a publish refused with stale_pointer: the same, since the refusal is audited and the live version moved', async () => {
    publish.mockRejectedValue(STALE_POINTER())
    const { wrapper, stale } = seeded()
    const { result } = renderHook(() => usePublishCurriculumVersionMutation(), { wrapper })

    await expect(result.current.mutateAsync({ ...target, expectedPublishedVersionId: 'v2' })).rejects.toThrow()

    await waitFor(() => expect(stale()).toEqual(VERSION_STEP))
  })

  it('a migration apply: every curriculum read, nothing outside the console', async () => {
    const { wrapper, stale, accountsStale } = seeded()
    const { result } = renderHook(() => useApplyCurriculumMigrationMutation(), { wrapper })

    await result.current.mutateAsync({ migrationId: 'mig-1', manifest: {}, confirmationToken: 'token-from-dry-run' })

    await waitFor(() => expect(stale()).toEqual(ALL))
    expect(accountsStale()).toBe(false)
  })

  it('a migration apply refused part-way: every curriculum read, as the earlier rows are written', async () => {
    apply.mockRejectedValue(STALE_POINTER())
    const { wrapper, stale } = seeded()
    const { result } = renderHook(() => useApplyCurriculumMigrationMutation(), { wrapper })

    await expect(
      result.current.mutateAsync({ migrationId: 'mig-1', manifest: {}, confirmationToken: 'token-from-dry-run' }),
    ).rejects.toThrow()

    await waitFor(() => expect(stale()).toEqual(ALL))
  })
})

function renderPage() {
  return render(
    <QueryClientProvider client={newQueryClient()}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <AdminCurriculumPage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

async function openVersion(user: ReturnType<typeof userEvent.setup>, versionId: string) {
  await user.click(screen.getByRole('tab', { name: 'Worklist' }))
  const card = (await screen.findByText(new RegExp(`^${versionId} ·`))).closest('div.grid') as HTMLElement
  await user.click(within(card).getByRole('button', { name: 'Open' }))
}

async function openPublishDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('tab', { name: 'Review' }))
  // The live version is read from the worklist, so the button waits for it.
  await waitFor(() => expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled())
  await user.click(screen.getByRole('button', { name: 'Publish' }))
  return screen.findByRole('dialog')
}

async function confirmPublish(user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement) {
  await user.type(within(dialog).getByLabelText('Reason for the audit log'), 'Release')
  await user.click(within(dialog).getByRole('button', { name: 'Publish' }))
}

describe('the page after a write', () => {
  it('after a patch fixes the blocking issue, validation, audit and diff show the new state', async () => {
    const user = userEvent.setup()
    renderPage()
    await openVersion(user, 'v4')

    await user.click(screen.getByRole('tab', { name: 'Review' }))
    await user.click(screen.getByRole('button', { name: 'Run validation' }))
    expect(await screen.findByText('Not ready to publish')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Load audit' }))
    expect(await screen.findByText(/create_draft/)).toBeInTheDocument()
    await user.type(screen.getByLabelText('From version'), 'v2')
    await user.click(screen.getByRole('button', { name: 'Compare' }))
    await waitFor(() => expect(diff).toHaveBeenCalledWith('lesson-1', 'v2', 'v4'))

    await user.click(screen.getByRole('tab', { name: 'Editor' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save draft' })).toBeEnabled())
    fireEvent.change(screen.getByRole('textbox', { name: 'Draft patch' }), {
      target: { value: '{"lesson":{"title":"Fixed title"}}' },
    })
    await user.click(screen.getByRole('button', { name: 'Save draft' }))
    expect(await screen.findByText('Saved v4.')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Review' }))
    expect(await screen.findByText('Valid')).toBeInTheDocument()
    expect(screen.queryByText('Not ready to publish')).not.toBeInTheDocument()
    expect(await screen.findByText(/patch_draft/)).toBeInTheDocument()
    expect(await screen.findByText(/"after": "Fixed title"/)).toBeInTheDocument()
  })

  it('after a migration publishes a lesson, the worklist and the next publish know its new live version', async () => {
    apply.mockImplementation(async () => {
      server.items = [version('m1', 'published', '2026-10-20T08:00:00Z'), ...ITEMS]
      return { ...DRY_RUN, status: 'applied' }
    })
    const user = userEvent.setup()
    renderPage()
    await screen.findByText(/^v3 ·/)

    await user.click(screen.getByRole('tab', { name: 'Migration' }))
    await user.click(screen.getByRole('button', { name: 'Dry-run' }))
    await screen.findByText('Ready')
    await user.click(screen.getByRole('button', { name: 'Apply migration' }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Apply migration' }))
    expect(await screen.findByText('Applied mig-1.')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Worklist' }))
    expect(await screen.findByText(/^m1 ·/)).toBeInTheDocument()
    await openVersion(user, 'v3')
    const dialog = await openPublishDialog(user)
    expect(within(dialog).getByText(/Currently live: m1\./)).toBeInTheDocument()
    await confirmPublish(user, dialog)

    await waitFor(() => expect(publish).toHaveBeenCalledTimes(1))
    expect(publish.mock.calls[0][0].expectedPublishedVersionId).toBe('m1')
  })

  it('after a migration is refused part-way, the worklist shows the rows it wrote', async () => {
    apply.mockImplementation(async () => {
      server.items = [version('m0', 'draft', '2026-10-20T08:00:00Z'), ...ITEMS]
      throw STALE_POINTER()
    })
    const user = userEvent.setup()
    renderPage()
    await screen.findByText(/^v3 ·/)

    await user.click(screen.getByRole('tab', { name: 'Migration' }))
    await user.click(screen.getByRole('button', { name: 'Dry-run' }))
    await screen.findByText('Ready')
    await user.click(screen.getByRole('button', { name: 'Apply migration' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Apply migration' }))
    expect(await within(dialog).findByText(/Someone else published a different version/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    await user.click(screen.getByRole('tab', { name: 'Worklist' }))
    expect(await screen.findByText(/^m0 ·/)).toBeInTheDocument()
  })

  it('after a publish is refused as stale, the audit shows the refusal and a second try sends the version live now', async () => {
    publish.mockImplementationOnce(async () => {
      // Someone else published v5 in the meantime; the backend audits the refusal.
      server.items = [version('v5', 'published', '2026-10-19T08:00:00Z'), ...ITEMS]
      server.events = [event('publish_refused', 'v3'), ...server.events]
      throw STALE_POINTER()
    })
    const user = userEvent.setup()
    renderPage()
    await openVersion(user, 'v3')
    await user.click(screen.getByRole('tab', { name: 'Review' }))
    await user.click(screen.getByRole('button', { name: 'Load audit' }))
    expect(await screen.findByText(/create_draft/)).toBeInTheDocument()

    let dialog = await openPublishDialog(user)
    expect(within(dialog).getByText(/Currently live: v2\./)).toBeInTheDocument()
    await confirmPublish(user, dialog)
    expect(await within(dialog).findByText(/Someone else published a different version/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(await screen.findByText(/publish_refused/)).toBeInTheDocument()
    dialog = await openPublishDialog(user)
    expect(within(dialog).getByText(/Currently live: v5\./)).toBeInTheDocument()
    await confirmPublish(user, dialog)

    await waitFor(() => expect(publish).toHaveBeenCalledTimes(2))
    expect(publish.mock.calls[1][0].expectedPublishedVersionId).toBe('v5')
  })
})
