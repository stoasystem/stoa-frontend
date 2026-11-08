/**
 * The curriculum console publishes against the live version the backend
 * returns, not one it infers (#596).
 *
 * `expectedPublishedVersionId` used to be the newest `published` row of the
 * lesson in the worklist. After a rollback that row is not the live one, and
 * when the live version is not among the worklist's first 100 rows there is no
 * such row at all; either way the backend refused the publish with
 * `409 stale_pointer`. Since stoa-backend#307 every worklist item and preview
 * carries its lesson's pointer, `publishedVersionId`, and a replaced version
 * reads `superseded`.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import deAdmin from '@/i18n/locales/de/admin.json'
import enAdmin from '@/i18n/locales/en/admin.json'
import frAdmin from '@/i18n/locales/fr/admin.json'
import itAdmin from '@/i18n/locales/it/admin.json'
import { AdminCurriculumPage } from '@/pages/admin/AdminCurriculumPage'
import { getCurriculumPreview, getCurriculumWorklist, publishCurriculumVersion } from '@/services/admin/curriculumApi'
import { ApiError } from '@/services/api/httpClient'
import type { CurriculumListedVersion } from '@/types/curriculumOperations'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('@/services/admin/curriculumApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/admin/curriculumApi')>()),
  getCurriculumWorklist: vi.fn(),
  getCurriculumPreview: vi.fn(),
  publishCurriculumVersion: vi.fn(),
}))

const worklist = vi.mocked(getCurriculumWorklist)
const preview = vi.mocked(getCurriculumPreview)
const publish = vi.mocked(publishCurriculumVersion)

function version(
  versionId: string,
  state: string,
  updatedAt: string,
  publishedVersionId: string | null,
  extra: Partial<CurriculumListedVersion> = {},
): CurriculumListedVersion {
  return { publicLessonId: 'lesson-1', versionId, state, updatedAt, updatedBy: 'admin-1', publishedVersionId, ...extra }
}

/** What the backend holds; the worklist and the preview answer from it. */
let items: CurriculumListedVersion[]

beforeEach(async () => {
  await i18n.changeLanguage('en')
  vi.clearAllMocks()
  worklist.mockImplementation(async () => ({ items, count: items.length }))
  preview.mockImplementation(async (_lesson, versionId) => ({
    ...(items.find((item) => item.versionId === versionId) as CurriculumListedVersion),
    lesson: {},
    exercises: [],
  }))
  publish.mockResolvedValue({ status: 'published' })
})
afterAll(async () => {
  await i18n.changeLanguage('en')
})

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <AdminCurriculumPage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

const copy = enAdmin.curriculum

async function openPublishDialog(versionId: string) {
  const user = userEvent.setup()
  renderPage()
  const card = (await screen.findByText(new RegExp(`^${versionId} ·`))).closest('div.grid') as HTMLElement
  await user.click(within(card).getByRole('button', { name: copy.worklist.open }))
  await user.click(screen.getByRole('tab', { name: copy.tabs.review }))
  await waitFor(() => expect(screen.getByRole('button', { name: copy.review.publish })).toBeEnabled())
  await user.click(screen.getByRole('button', { name: copy.review.publish }))
  const dialog = await screen.findByRole('dialog')
  await user.type(within(dialog).getByLabelText(copy.confirm.reason), 'Release')
  return { user, dialog }
}

const confirmButton = (dialog: HTMLElement) => within(dialog).getByRole('button', { name: copy.confirm.submit.publish })

async function publishedWith(user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement) {
  await user.click(confirmButton(dialog))
  await waitFor(() => expect(publish).toHaveBeenCalledTimes(1))
  return publish.mock.calls[0][0].expectedPublishedVersionId
}

describe('#596: a publish sends the live version the backend returned', () => {
  it('after a rollback: the pointer, not the newest row that reads published', async () => {
    // lesson-1 went live at v1, then v2, then was rolled back to v1. v2 is the
    // newest row reading `published` (as rows read before stoa-backend#307);
    // the pointer every version carries says v1. v3 is to be published.
    items = [
      version('v3', 'approved', '2026-10-20T09:00:00Z', 'v1', { reviewState: 'approved' }),
      version('v2', 'published', '2026-10-15T12:00:00Z', 'v1'),
      version('v1', 'published', '2026-10-01T12:00:00Z', 'v1'),
    ]
    const { user, dialog } = await openPublishDialog('v3')

    expect(within(dialog).getByText(/^Currently live: v1\./)).toBeInTheDocument()
    expect(await publishedWith(user, dialog)).toBe('v1')
  })

  it('rolling back: publishing an older version sends the version live now', async () => {
    items = [
      version('v2', 'published', '2026-10-15T12:00:00Z', 'v2'),
      version('v1', 'superseded', '2026-10-01T12:00:00Z', 'v2'),
    ]
    const { user, dialog } = await openPublishDialog('v1')

    expect(within(dialog).getByText(/^Currently live: v2\./)).toBeInTheDocument()
    expect(await publishedWith(user, dialog)).toBe('v2')
  })

  it('when the live version is not among the worklist rows, still sends it', async () => {
    // v6 is live but older than the 100 rows the worklist returns.
    items = [version('v7', 'approved', '2026-10-20T09:00:00Z', 'v6', { reviewState: 'approved' })]
    const { user, dialog } = await openPublishDialog('v7')

    expect(within(dialog).getByText(/^Currently live: v6\./)).toBeInTheDocument()
    expect(await publishedWith(user, dialog)).toBe('v6')
  })

  it('a lesson never published sends null, and the dialog says nothing is live', async () => {
    items = [version('v1', 'approved', '2026-10-20T09:00:00Z', null, { reviewState: 'approved' })]
    const { user, dialog } = await openPublishDialog('v1')

    expect(within(dialog).getByText(copy.confirm.noLiveVersion)).toBeInTheDocument()
    expect(await publishedWith(user, dialog)).toBeNull()
  })

  it('takes the pointer of its own lesson, not of another lesson in the worklist', async () => {
    items = [
      version('w1', 'published', '2026-10-21T09:00:00Z', 'w1', { publicLessonId: 'lesson-2' }),
      version('v3', 'approved', '2026-10-20T09:00:00Z', 'v2', { reviewState: 'approved' }),
    ]
    const { user, dialog } = await openPublishDialog('v3')

    expect(await publishedWith(user, dialog)).toBe('v2')
  })

  it('after a stale_pointer refusal with the lesson gone from the worklist, reads the pointer from the preview', async () => {
    items = [version('v3', 'approved', '2026-10-20T09:00:00Z', 'v2', { reviewState: 'approved' })]
    publish.mockImplementationOnce(async () => {
      // Someone published v5; the worklist read again no longer holds lesson-1.
      const moved = items.map((item) => ({ ...item, publishedVersionId: 'v5' }))
      worklist.mockImplementation(async () => ({ items: [], count: 0 }))
      preview.mockImplementation(async () => ({ ...moved[0], lesson: {}, exercises: [] }))
      throw new ApiError('conflict', { status: 409, detail: 'stale_pointer' })
    })
    const { user, dialog } = await openPublishDialog('v3')

    await user.click(confirmButton(dialog))
    expect(await within(dialog).findByText(/^Currently live: v5\./)).toBeInTheDocument()
    await waitFor(() => expect(confirmButton(dialog)).toBeEnabled())
    await user.click(confirmButton(dialog))
    await waitFor(() => expect(publish).toHaveBeenCalledTimes(2))
    expect(publish.mock.calls.map(([input]) => input.expectedPublishedVersionId)).toEqual(['v2', 'v5'])
  })
})

describe('#596: a superseded version', () => {
  it.each([
    { language: 'en', admin: enAdmin },
    { language: 'de', admin: deAdmin },
    { language: 'fr', admin: frAdmin },
    { language: 'it', admin: itAdmin },
  ])('is shown in words in $language', async ({ language, admin }) => {
    await i18n.changeLanguage(language)
    items = [
      version('v2', 'published', '2026-10-15T12:00:00Z', 'v2'),
      version('v1', 'superseded', '2026-10-01T12:00:00Z', 'v2'),
    ]
    renderPage()

    const label = admin.curriculum.state.superseded
    expect(label).toBeTruthy()
    expect(label).not.toBe('superseded')
    expect(await screen.findByText(label)).toBeInTheDocument()
    expect(screen.getByText(admin.curriculum.state.published)).toBeInTheDocument()
  })
})
