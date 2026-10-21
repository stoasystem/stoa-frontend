/**
 * #416: the accounts list merges the pages it has loaded into one list in a
 * `select` that was written inline, a new function at every render, so
 * TanStack ran it again at every render: each key typed on the page walked
 * every loaded page and compared what came out with the last list, deep. The
 * pages are merged again only when one comes in.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useAdminAccountListQuery } from '@/hooks/admin/useAdminAccounts'
import { listAccounts, type AccountListResponse, type AccountRow } from '@/services/admin/accountsApi'

vi.mock('@/services/admin/accountsApi', async () => ({
  ...(await vi.importActual<typeof import('@/services/admin/accountsApi')>('@/services/admin/accountsApi')),
  listAccounts: vi.fn(),
}))

/** How often a page's rows were read, by anyone. */
let reads = 0

/** A page whose rows count each time they are read. */
function page(ids: string[], nextCursor: string | null): AccountListResponse {
  const items = ids.map((id) => ({ userId: id, name: id, role: 'student' }) as AccountRow)
  return {
    get items() {
      reads += 1
      return items
    },
    count: ids.length,
    groups: { student: ids.length },
    nextCursor,
  }
}

const FILTERS = { role: 'student' }

function Accounts() {
  const [note, setNote] = useState('')
  const list = useAdminAccountListQuery(FILTERS)
  return (
    <>
      <input aria-label="Note" value={note} onChange={(event) => setNote(event.target.value)} />
      <p data-testid="rows">{list.data?.items.map((row) => row.userId).join(',')}</p>
      {list.hasNextPage && (
        <button type="button" onClick={() => void list.fetchNextPage()}>
          More
        </button>
      )}
    </>
  )
}

describe('the accounts list (#416)', () => {
  it('does not walk the loaded pages again at a render that brings none', async () => {
    vi.mocked(listAccounts)
      .mockResolvedValueOnce(page(['a', 'b'], 'after-b'))
      .mockResolvedValueOnce(page(['c'], null))
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <Accounts />
      </QueryClientProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('rows')).toHaveTextContent('a,b'))
    await userEvent.click(screen.getByRole('button', { name: 'More' }))
    await waitFor(() => expect(screen.getByTestId('rows')).toHaveTextContent('a,b,c'))
    expect(screen.queryByRole('button', { name: 'More' })).not.toBeInTheDocument()
    reads = 0

    await userEvent.type(screen.getByRole('textbox', { name: 'Note' }), 'pending')

    expect(screen.getByRole('textbox', { name: 'Note' })).toHaveValue('pending')
    expect(reads).toBe(0)
    expect(screen.getByTestId('rows')).toHaveTextContent('a,b,c')
  })
})
