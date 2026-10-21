/**
 * #418: `apiPath` keeps `/`, `?` and `#` inside a value's segment (#251), but
 * encoding leaves `..` as `..`, and the URL parser resolves it - like `%2e%2e`
 * - to the level above. Three pages put an id from the address or a field
 * into an API path: the account operations console (`?parentId=`,
 * `?checkoutRef=`), the automation console (`?studentId=`, also typed) and the
 * curriculum console's migration evidence (typed). A link or entry holding
 * `..` sent their read one level up the API. Such an id now reads as not
 * valid, and no request leaves for it; a plain id is read exactly as before.
 */
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import deAdmin from '@/i18n/locales/de/admin.json'
import enAdmin from '@/i18n/locales/en/admin.json'
import frAdmin from '@/i18n/locales/fr/admin.json'
import itAdmin from '@/i18n/locales/it/admin.json'
import deTeacher from '@/i18n/locales/de/teacher.json'
import enTeacher from '@/i18n/locales/en/teacher.json'
import frTeacher from '@/i18n/locales/fr/teacher.json'
import itTeacher from '@/i18n/locales/it/teacher.json'
import { AdminAccountOperationsPage } from '@/pages/admin/AdminAccountOperationsPage'
import { AdminCurriculumPage } from '@/pages/admin/AdminCurriculumPage'
import { LearningAutomationConsolePage } from '@/pages/learning/LearningAutomationConsolePage'
import { listAccounts } from '@/services/admin/accountsApi'
import { httpClient } from '@/services/api/httpClient'
import type { AdminAccountOperations } from '@/types/adminAccountOperations'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/components/parent/VerificationRecoveryEvidence', () => ({
  VerificationRecoveryEvidence: () => null,
}))
vi.mock('@/services/admin/accountsApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/admin/accountsApi')>()),
  listAccounts: vi.fn(),
}))
vi.mock('@/services/api/httpClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/api/httpClient')>()),
  httpClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

const languages = [
  { language: 'en', admin: enAdmin, teacher: enTeacher },
  { language: 'de', admin: deAdmin, teacher: deTeacher },
  { language: 'fr', admin: frAdmin, teacher: frTeacher },
  { language: 'it', admin: itAdmin, teacher: itTeacher },
]

/** Every request the pages made, as `METHOD url`. */
const sent: string[] = []

function lookup(userId: string): AdminAccountOperations {
  return {
    parentId: userId,
    supportState: { state: 'ready', blockers: [], warnings: [] },
    parent: { userId, role: 'parent', name: 'Lea Brunner', email: `${userId}@example.ch` },
    billing: { status: 'none', events: [] },
    children: [],
    usage: [],
  }
}

beforeEach(async () => {
  sent.length = 0
  vi.mocked(toast.error).mockClear()
  vi.mocked(listAccounts).mockResolvedValue({ items: [], count: 0, groups: {}, nextCursor: null })
  vi.mocked(httpClient.get).mockImplementation(async (url: string) => {
    sent.push(`GET ${url}`)
    if (url.startsWith('/admin/account-operations/parents/')) return { status: 200, data: lookup(url.split('/').pop()!) }
    // The recovery panel's own answer does not matter here, only that it was asked.
    if (url.startsWith('/admin/billing/')) throw new Error('not under test')
    return { status: 200, data: { items: [], count: 0 } }
  })
  vi.mocked(httpClient.post).mockImplementation(async (url: string) => {
    sent.push(`POST ${url}`)
    return { status: 200, data: {} }
  })
  await i18n.changeLanguage('en')
})

afterEach(async () => {
  await i18n.changeLanguage('en')
})

function renderAt(path: string, page: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>{page}</MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

/** Let the page's reads start, so a request it should not make would be seen. */
async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 20))
}

describe('#418: the account operations console', () => {
  // `%2e%2e` reaches the page decoded, as `..`.
  it.each(['..', '.', '%2e%2e', '%2E.', '%20..%20'])(
    'says ?parentId=%s is not a valid parent ID and reads nothing for it',
    async (value) => {
      renderAt(`/admin/account-operations?parentId=${value}`, <AdminAccountOperationsPage />)

      expect(await screen.findByText(enAdmin.accountOperations.lookup.invalidParentId)).toHaveAttribute('role', 'alert')
      await settle()
      expect(sent.filter((request) => request.includes('/account-operations/'))).toEqual([])
      expect(screen.queryByText(enAdmin.accountOperations.lookup.unavailable)).not.toBeInTheDocument()
      expect(screen.queryByText(enAdmin.accountOperations.lookup.empty)).not.toBeInTheDocument()
    },
  )

  it('says a checkoutRef of .. is not valid, and still looks up the parent', async () => {
    renderAt('/admin/account-operations?parentId=parent-1&checkoutRef=..', <AdminAccountOperationsPage />)

    expect(await screen.findByText(enAdmin.accountOperations.recovery.errors.invalidRef)).toHaveAttribute('role', 'alert')
    await waitFor(() => expect(sent).toContain('GET /admin/account-operations/parents/parent-1'))
    expect(sent.filter((request) => request.includes('/billing/'))).toEqual([])
    expect(screen.queryByText(enAdmin.accountOperations.lookup.invalidParentId)).not.toBeInTheDocument()
  })

  it('reads a plain parent ID and checkout reference exactly as before', async () => {
    renderAt('/admin/account-operations?parentId=parent-1&checkoutRef=chk_1', <AdminAccountOperationsPage />)

    await waitFor(() => expect(sent).toEqual(expect.arrayContaining([
      'GET /admin/account-operations/parents/parent-1',
      'GET /admin/billing/checkouts/chk_1',
    ])))
    expect(screen.queryByText(enAdmin.accountOperations.lookup.invalidParentId)).not.toBeInTheDocument()
    expect(screen.queryByText(enAdmin.accountOperations.recovery.errors.invalidRef)).not.toBeInTheDocument()
  })

  it.each(languages)('says it in $language', async ({ language, admin }) => {
    await i18n.changeLanguage(language)
    renderAt('/admin/account-operations?parentId=..&checkoutRef=.', <AdminAccountOperationsPage />)

    expect(await screen.findByText(admin.accountOperations.lookup.invalidParentId)).toBeInTheDocument()
    expect(screen.getByText(admin.accountOperations.recovery.errors.invalidRef)).toBeInTheDocument()
  })
})

describe('#418: the curriculum console’s migration evidence', () => {
  async function loadEvidence(id: string, admin: typeof enAdmin = enAdmin) {
    const user = userEvent.setup()
    renderAt('/admin/curriculum', <AdminCurriculumPage />)
    await user.click(screen.getByRole('tab', { name: admin.curriculum.tabs.evidence }))
    fireEvent.change(screen.getByLabelText(admin.curriculum.evidence.idLabel), { target: { value: id } })
    await user.click(screen.getByRole('button', { name: admin.curriculum.evidence.load }))
  }

  it.each(['..', '.'])('says a typed migration ID of %s is not valid and reads nothing for it', async (id) => {
    await loadEvidence(id)

    expect(await screen.findByText(enAdmin.curriculum.evidence.invalidId)).toHaveAttribute('role', 'alert')
    await settle()
    expect(sent.filter((request) => request.includes('/migrations'))).toEqual([])
    expect(screen.queryByText(enAdmin.curriculum.requestFailed)).not.toBeInTheDocument()
  })

  it('reads a plain migration ID exactly as before', async () => {
    await loadEvidence('mig-1')

    await waitFor(() => expect(sent).toContain('GET /admin/curriculum/migrations/mig-1'))
    expect(screen.queryByText(enAdmin.curriculum.evidence.invalidId)).not.toBeInTheDocument()
  })

  it.each(languages)('says it in $language', async ({ language, admin }) => {
    await i18n.changeLanguage(language)
    await loadEvidence('..', admin)

    expect(await screen.findByText(admin.curriculum.evidence.invalidId)).toBeInTheDocument()
  })
})

describe('#418: the automation console', () => {
  it.each(['..', '.', '%2e%2e'])(
    'says ?studentId=%s is not a valid student id and reads no history for it',
    async (value) => {
      renderAt(`/teacher/learning-automation?studentId=${value}`, <LearningAutomationConsolePage />)

      expect(await screen.findByText(enTeacher.automationConsole.invalidStudentId)).toBeInTheDocument()
      await settle()
      expect(sent).toEqual([])
      expect(screen.queryByText(enTeacher.automationConsole.historyFailed)).not.toBeInTheDocument()
    },
  )

  it('refuses to preview for a typed .. and sends nothing', async () => {
    renderAt('/teacher/learning-automation', <LearningAutomationConsolePage />)

    fireEvent.change(screen.getByLabelText(enTeacher.automationConsole.studentId), { target: { value: ' .. ' } })
    fireEvent.click(screen.getByRole('button', { name: enTeacher.automationConsole.preview }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(enTeacher.automationConsole.invalidStudentId))
    expect(screen.getByText(enTeacher.automationConsole.invalidStudentId)).toBeInTheDocument()
    expect(screen.queryByText(enTeacher.automationConsole.previewFailed)).not.toBeInTheDocument()
    await settle()
    expect(sent).toEqual([])
  })

  it('reads a plain student id exactly as before', async () => {
    renderAt('/teacher/learning-automation?studentId=student-1', <LearningAutomationConsolePage />)

    await waitFor(() => expect(sent).toEqual(['GET /adaptive/students/student-1/assignments']))
    expect(await screen.findByText(enTeacher.automationConsole.historyEmpty)).toBeInTheDocument()
    expect(screen.queryByText(enTeacher.automationConsole.invalidStudentId)).not.toBeInTheDocument()
  })

  it.each(languages)('says it in $language', async ({ language, teacher }) => {
    await i18n.changeLanguage(language)
    renderAt('/teacher/learning-automation?studentId=..', <LearningAutomationConsolePage />)

    expect(await screen.findByText(teacher.automationConsole.invalidStudentId)).toBeInTheDocument()
  })
})
