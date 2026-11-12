/**
 * #640: at 375 px two admin pages scrolled sideways. A long id is one
 * unbreakable word, and a grid or flex item is as wide as its longest word
 * unless told otherwise: the usage key `student_… / 2026-11-10` pushed its card
 * to 419 px and the "Matched" badge off the edge, and the moderation case id
 * (`mod-…`, 36 characters) widened both columns of the queue page to 531 px.
 *
 * jsdom does no layout, so these pin the classes that let the id wrap or
 * truncate, and that the full value stays readable. The widths were measured
 * in a browser at 375×812; see the PR.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { AdminAccountOperationsPage } from '@/pages/admin/AdminAccountOperationsPage'
import { AdminModerationPage } from '@/pages/admin/AdminModerationPage'
import { listAccounts } from '@/services/admin/accountsApi'
import { getAdminParentAccountOperations, getModerationCase, getModerationCases } from '@/services/admin/adminApi'
import type { ModerationCase } from '@/services/admin/adminApi'
import type { AdminAccountOperations } from '@/types/adminAccountOperations'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/components/parent/VerificationRecoveryEvidence', () => ({
  VerificationRecoveryEvidence: () => null,
}))
vi.mock('@/hooks/admin/useAdminBillingOperation', () => ({
  useAdminBillingOperation: () => ({
    query: { isLoading: false, isError: false, error: null, data: undefined },
    recheck: { mutate: vi.fn(), isPending: false },
  }),
}))
vi.mock('@/services/admin/accountsApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/admin/accountsApi')>('@/services/admin/accountsApi')
  return { ...actual, listAccounts: vi.fn(), assignParentLink: vi.fn() }
})
vi.mock('@/services/admin/adminApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/admin/adminApi')>('@/services/admin/adminApi')
  return {
    ...actual,
    getAdminParentAccountOperations: vi.fn(),
    getModerationCases: vi.fn(),
    getModerationCase: vi.fn(),
  }
})

const STUDENT_ID = 'student_a4e37a64453847fc9108ea35'
const CASE_ID = 'mod-818cd0b08d07488aa419660bf449a519'

function operations(): AdminAccountOperations {
  return {
    parentId: 'parent-1',
    supportState: { state: 'ready', blockers: [], warnings: [] },
    parent: { userId: 'parent-1', role: 'parent', name: 'Rita Vogt', email: 'parent-1@example.ch' },
    billing: { status: 'none', events: [] },
    children: [],
    usage: [
      {
        studentId: STUDENT_ID,
        quotaPeriod: '2026-11-10',
        action: 'question_submission',
        consumed: 1,
        limit: 5,
        remaining: 4,
        unreconciled: false,
      },
    ],
  }
}

const moderationCase: ModerationCase = {
  case_id: CASE_ID,
  status: 'open',
  reason: 'abuse',
  severity: 'high',
  surface: 'question',
  question_id: 'q-1',
  reporter_id: 'teacher-1',
  reporter_role: 'teacher',
  report_note: 'report',
  created_at: '2026-11-10T10:00:00Z',
  updated_at: '2026-11-10T10:00:00Z',
  history: [],
}

function wrap(page: ReactNode, path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={[path]}>{page}</MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

const classesOf = (element: Element | null) => (element?.getAttribute('class') ?? '').split(/\s+/)

beforeEach(async () => {
  await i18n.changeLanguage('en')
  vi.mocked(listAccounts).mockResolvedValue({ items: [], count: 0, groups: {}, nextCursor: null })
  vi.mocked(getAdminParentAccountOperations).mockResolvedValue(operations())
  vi.mocked(getModerationCases).mockResolvedValue({ items: [moderationCase], count: 1, access_pattern: 'scan' })
  vi.mocked(getModerationCase).mockResolvedValue(moderationCase)
})

describe('#640: account support usage card', () => {
  it('wraps the usage key inside its column and keeps the badge whole', async () => {
    wrap(<AdminAccountOperationsPage />, '/admin/account-operations?parentId=parent-1')

    const key = await screen.findByTestId('usage-key')
    expect(key).toHaveTextContent(`${STUDENT_ID} / 2026-11-10`)
    expect(classesOf(key)).toContain('break-all')
    expect(classesOf(key.parentElement)).toContain('min-w-0')

    const badge = screen.getByText(i18n.t('admin:accountOperations.usage.matched'))
    expect(classesOf(badge)).toContain('shrink-0')
  })
})

describe('#640: moderation queue', () => {
  it('lets both columns shrink below the case id', async () => {
    wrap(<AdminModerationPage />, `/admin/moderation?case=${CASE_ID}`)

    const title = await screen.findByTestId('moderation-case-title')
    const columns = title.closest('.grid')?.querySelectorAll(':scope > section') ?? []
    expect(columns).toHaveLength(2)
    columns.forEach((column) => expect(classesOf(column)).toContain('min-w-0'))
  })

  it('truncates the id in the queue and keeps the full value in its title', async () => {
    wrap(<AdminModerationPage />, '/admin/moderation')

    const button = await screen.findByRole('button', { name: new RegExp(`^${CASE_ID}`) })
    const id = button.querySelector('span.truncate')
    expect(id).toHaveTextContent(CASE_ID)
    expect(id).toHaveAttribute('title', CASE_ID)
  })

  it('wraps the id in the case heading', async () => {
    wrap(<AdminModerationPage />, `/admin/moderation?case=${CASE_ID}`)

    const title = await screen.findByTestId('moderation-case-title')
    expect(title).toHaveTextContent(CASE_ID)
    expect(classesOf(title)).toContain('break-all')
    expect(classesOf(title.parentElement)).toContain('min-w-0')
  })

  it('lets the filter selects shrink with their card', async () => {
    wrap(<AdminModerationPage />, '/admin/moderation')

    await screen.findByRole('button', { name: new RegExp(`^${CASE_ID}`) })
    for (const select of screen.getAllByRole('combobox')) {
      expect(classesOf(select)).toEqual(expect.arrayContaining(['w-full', 'min-w-0']))
    }
  })
})
