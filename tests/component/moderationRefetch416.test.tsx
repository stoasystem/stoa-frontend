/**
 * #416: a change to a moderation case invalidated every moderation read, the
 * case's detail among them, and then the detail once more on its own; the
 * second refetch cancelled the first and asked again, so the case was read
 * twice for each change. Each read under the moderation key is read once.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useAddModerationCaseNoteMutation,
  useAdminModerationCaseQuery,
  useAdminModerationCasesQuery,
  useUpdateModerationCaseMutation,
} from '@/hooks/admin/useAdminModerationCases'
import {
  addModerationCaseNote,
  getModerationCase,
  getModerationCases,
  updateModerationCase,
  type ModerationCase,
  type ModerationCaseListFilters,
} from '@/services/admin/adminApi'

vi.mock('@/services/admin/adminApi', async (orig) => ({
  ...(await orig<typeof import('@/services/admin/adminApi')>()),
  getModerationCases: vi.fn(),
  getModerationCase: vi.fn(),
  updateModerationCase: vi.fn(),
  addModerationCaseNote: vi.fn(),
}))

const CASE = { case_id: 'case-1', status: 'open' } as ModerationCase
const FILTERS: ModerationCaseListFilters = { status: 'open' }

/** The queue and one case open in it, as the moderation page reads them, and both ways to change the case. */
function openCase() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return renderHook(
    () => ({
      list: useAdminModerationCasesQuery(FILTERS),
      detail: useAdminModerationCaseQuery('case-1'),
      update: useUpdateModerationCaseMutation(),
      note: useAddModerationCaseNoteMutation(),
    }),
    { wrapper },
  )
}

/** Every read the change set off, finished. */
async function readsSettle(result: { current: ReturnType<typeof openCase>['result']['current'] }) {
  await waitFor(() => {
    expect(result.current.list.isFetching).toBe(false)
    expect(result.current.detail.isFetching).toBe(false)
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getModerationCases).mockResolvedValue({ items: [CASE] } as never)
  vi.mocked(getModerationCase).mockResolvedValue(CASE)
  vi.mocked(updateModerationCase).mockResolvedValue({ ...CASE, status: 'actioned' } as ModerationCase)
  vi.mocked(addModerationCaseNote).mockResolvedValue(CASE)
})

describe('a change to a moderation case (#416)', () => {
  it('reads the case once after its status changes, and the queue once', async () => {
    const { result } = openCase()
    await waitFor(() => expect(result.current.detail.data).toEqual(CASE))
    vi.mocked(getModerationCase).mockClear()
    vi.mocked(getModerationCases).mockClear()

    await act(() => result.current.update.mutateAsync({ caseId: 'case-1', status: 'actioned' }))
    await readsSettle(result)

    expect(getModerationCase).toHaveBeenCalledTimes(1)
    expect(getModerationCases).toHaveBeenCalledTimes(1)
  })

  it('reads the case once after a note is added, and the queue once', async () => {
    const { result } = openCase()
    await waitFor(() => expect(result.current.detail.data).toEqual(CASE))
    vi.mocked(getModerationCase).mockClear()
    vi.mocked(getModerationCases).mockClear()

    await act(() => result.current.note.mutateAsync({ caseId: 'case-1', note: 'Checked with the teacher' }))
    await readsSettle(result)

    expect(getModerationCase).toHaveBeenCalledTimes(1)
    expect(getModerationCases).toHaveBeenCalledTimes(1)
  })
})
