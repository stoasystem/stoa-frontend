import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listAccounts } from '@/services/admin/accountsApi'
import { httpClient } from '@/services/api/httpClient'

// `GET /admin/users` answers from a table scan, so one page is rows read rather
// than accounts found, and it returns a continuation key whenever it stopped
// early. This console has no pagination - it groups whatever it is handed and
// prints a count per group - so reading one page and stopping made both wrong.
//
// Measured on production: five accounts, four on the first page, and the
// administrator's own account alone on the second. The console showed four and
// said so, which is indistinguishable from there being four.

vi.mock('@/services/api/httpClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/api/httpClient')>()),
  httpClient: { get: vi.fn() },
}))

const mockedGet = vi.mocked(httpClient.get)

function row(email: string, role: string) {
  return {
    userId: email,
    accountNumber: '',
    name: email,
    email,
    role,
    accountStatus: 'active',
    createdAt: '2026-09-01T00:00:00+00:00',
    lastLoginAt: '',
    linkedAccounts: [],
    isMinor: false,
  }
}

function page(items: ReturnType<typeof row>[], nextCursor: string | null) {
  const groups: Record<string, number> = {}
  for (const item of items) groups[item.role] = (groups[item.role] ?? 0) + 1
  return { data: { items, count: items.length, groups, nextCursor } }
}

beforeEach(() => {
  mockedGet.mockReset()
})

describe('the account list is every account, not the first page of them', () => {
  it('follows the continuation key and adds the groups up', async () => {
    mockedGet
      .mockResolvedValueOnce(page([row('a@t', 'student'), row('b@t', 'parent')], 'cursor-2'))
      .mockResolvedValueOnce(page([row('c@t', 'student'), row('d@t', 'admin')], 'cursor-3'))
      .mockResolvedValueOnce(page([row('e@t', 'admin')], null))

    const result = await listAccounts()

    expect(result.items.map((item) => item.email)).toEqual(['a@t', 'b@t', 'c@t', 'd@t', 'e@t'])
    expect(result.count).toBe(5)
    expect(result.groups).toEqual({ student: 2, parent: 1, admin: 2 })
    expect(result.nextCursor).toBeNull()
    expect(mockedGet).toHaveBeenCalledTimes(3)
  })

  it('stops after one request when the first page was the whole list', async () => {
    // Negative control: following a key that was never handed back would turn
    // every list into an unbounded walk.
    mockedGet.mockResolvedValueOnce(page([row('a@t', 'student')], null))

    const result = await listAccounts()

    expect(result.items).toHaveLength(1)
    expect(mockedGet).toHaveBeenCalledTimes(1)
  })

  it('honours an explicit cursor as a request for exactly that page', async () => {
    // Second negative control: a caller asking for one page gets one page.
    mockedGet.mockResolvedValueOnce(page([row('a@t', 'student')], 'cursor-2'))

    const result = await listAccounts({ cursor: 'cursor-1' })

    expect(result.nextCursor).toBe('cursor-2')
    expect(mockedGet).toHaveBeenCalledTimes(1)
  })

  it('stops at its own budget rather than walking forever', async () => {
    // A server that always hands back a key must not become an infinite loop.
    mockedGet.mockResolvedValue(page([row('a@t', 'student')], 'always-more'))

    const result = await listAccounts()

    expect(mockedGet.mock.calls.length).toBeLessThanOrEqual(20)
    expect(result.nextCursor).toBe('always-more')
  })
})
