/**
 * The curriculum console publishes against the live version the backend's
 * pointer names, not one it guesses (#596).
 *
 * `expectedPublishedVersionId` used to be the worklist's newest `published`
 * row of the lesson. After a rollback that was the wrong version, and when the
 * live version was not among the 100 rows the worklist returns there was none,
 * so the backend refused the publish with `409 stale_pointer`. Since
 * stoa-backend#307 every worklist row and preview carries the lesson's
 * `publishedVersionId`, and a version that was live and was replaced reads
 * `superseded`.
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
import type { CurriculumVersion } from '@/types/curriculumOperations'

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

const copy = enAdmin.curriculum

function version(versionId: string, state: string, updatedAt: string, extra: Partial<CurriculumVersion> = {}): CurriculumVersion {
  return { publicLessonId: 'lesson-1', versionId, state, updatedAt, updatedBy: 'admin-1', ...extra }
}

/** The backend answers the worklist with these rows, and each preview with its row. */
function serve(rows: CurriculumVersion[], previews: CurriculumVersion[] = rows) {
  worklist.mockResolvedValue({ items: rows, count: rows.length })
  preview.mockImplementation(async (_lesson, versionId) => ({
    ...(previews.find((row) => row.versionId === versionId) ?? rows[0]),
    lesson: {},
    exercises: [],
  }))
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  vi.clearAllMocks()
  publish.mockResolvedValue({ status: 'published' })
})
afterAll(async () => {
  await i18n.changeLanguage('en')
})

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
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

/** Opens a version from the worklist, publishes it with a reason, and returns the dialog. */
async function publishVersion(versionId: string) {
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

async function confirm(user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement) {
  await user.click(within(dialog).getByRole('button', { name: copy.confirm.submit.publish }))
  await waitFor(() => expect(publish).toHaveBeenCalledTimes(1))
  return publish.mock.calls[0][0].expectedPublishedVersionId
}

describe('#596: publish sends the live version the pointer names', () => {
  it('after a rollback, sends the version rolled back to, as the backend reads the rows', async () => {
    // v1 went live, v2 replaced it, then v1 was rolled back to. v3 waits.
    serve([
      version('v3', 'approved', '2026-11-03T09:00:00Z', { publishedVersionId: 'v1' }),
      version('v2', 'superseded', '2026-11-02T09:00:00Z', { publishedVersionId: 'v1' }),
      version('v1', 'published', '2026-10-01T09:00:00Z', { publishedVersionId: 'v1' }),
    ])
    const { user, dialog } = await publishVersion('v3')

    expect(within(dialog).getByRole('status')).toHaveTextContent(/^Currently live: v1\./)
    expect(await confirm(user, dialog)).toBe('v1')
  })

  it('after a rollback, sends the pointer and not the newest row that says published', async () => {
    // The rows as they were stored before stoa-backend#307: the rollback left
    // v2, the newest, still marked published. The pointer is what counts.
    serve([
      version('v3', 'approved', '2026-11-03T09:00:00Z', { publishedVersionId: 'v1' }),
      version('v2', 'published', '2026-11-02T09:00:00Z', { publishedVersionId: 'v1' }),
      version('v1', 'published', '2026-10-01T09:00:00Z', { publishedVersionId: 'v1' }),
    ])
    const { user, dialog } = await publishVersion('v3')

    expect(within(dialog).getByRole('status')).toHaveTextContent(/^Currently live: v1\./)
    expect(await confirm(user, dialog)).toBe('v1')
  })

  it('sends the live version when it is not among the 100 rows the worklist returns', async () => {
    // 100 newer versions of the lesson fill the worklist; v0, live, is not in it.
    const rows = [
      version('v3', 'approved', '2026-11-03T09:00:00Z', { publishedVersionId: 'v0' }),
      ...Array.from({ length: 99 }, (_, index) =>
        version(`d${index + 1}`, 'draft', `2026-11-02T09:${String(index % 60).padStart(2, '0')}:00Z`, { publishedVersionId: 'v0' }),
      ),
    ]
    expect(rows).toHaveLength(100)
    expect(rows.some((row) => row.versionId === 'v0' || row.state === 'published')).toBe(false)
    serve(rows)
    const { user, dialog } = await publishVersion('v3')

    expect(within(dialog).getByRole('status')).toHaveTextContent(/^Currently live: v0\./)
    expect(await confirm(user, dialog)).toBe('v0')
  })

  it('sends null for a lesson that was never published, and says nothing is live', async () => {
    serve([version('v1', 'approved', '2026-11-03T09:00:00Z', { publishedVersionId: null })])
    const { user, dialog } = await publishVersion('v1')

    expect(within(dialog).getByRole('status')).toHaveTextContent(copy.confirm.noLiveVersion)
    expect(await confirm(user, dialog)).toBeNull()
  })

  it("takes another lesson's pointer for nothing", async () => {
    serve([
      version('w1', 'published', '2026-11-04T09:00:00Z', { publicLessonId: 'lesson-2', publishedVersionId: 'w1' }),
      version('v3', 'approved', '2026-11-03T09:00:00Z', { publishedVersionId: 'v2' }),
    ])
    const { user, dialog } = await publishVersion('v3')

    expect(await confirm(user, dialog)).toBe('v2')
  })

  it("reads the version's preview when the worklist rows do not carry the pointer", async () => {
    const candidate = version('v3', 'approved', '2026-11-03T09:00:00Z')
    serve([candidate], [{ ...candidate, publishedVersionId: 'v2' }])
    const { user, dialog } = await publishVersion('v3')

    expect(within(dialog).getByRole('status')).toHaveTextContent(/^Currently live: v2\./)
    expect(await confirm(user, dialog)).toBe('v2')
  })
})

describe('#596: a replaced version reads as replaced', () => {
  it.each([
    { language: 'en', admin: enAdmin },
    { language: 'de', admin: deAdmin },
    { language: 'fr', admin: frAdmin },
    { language: 'it', admin: itAdmin },
  ])('in $language', async ({ language, admin }) => {
    await i18n.changeLanguage(language)
    serve([
      version('v2', 'published', '2026-11-02T09:00:00Z', { publishedVersionId: 'v2' }),
      version('v1', 'superseded', '2026-10-01T09:00:00Z', { publishedVersionId: 'v2' }),
    ])
    renderPage()

    const card = (await screen.findByText(/^v1 ·/)).closest('div.grid') as HTMLElement
    const replaced = admin.curriculum.state.superseded
    expect(replaced).toBeTruthy()
    expect(replaced).not.toBe(admin.curriculum.state.published)
    expect(within(card).getByText(replaced)).toBeInTheDocument()
    expect(within(card).queryByText(/superseded/i)).not.toBeInTheDocument()
  })
})
