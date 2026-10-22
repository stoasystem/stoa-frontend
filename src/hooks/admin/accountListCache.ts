import type { InfiniteData, Query, QueryClient, QueryKey } from '@tanstack/react-query'
import type {
  AccountInvitationResponse,
  AccountLink,
  AccountListFilters,
  AccountListResponse,
  AccountRow,
  AccountStatus,
  AccountStatusResponse,
} from '@/services/admin/accountsApi'
import { adminQueryKeys } from '@/services/admin/adminQueryKeys'

/**
 * What an account command does to the account reads already in the cache (#372).
 *
 * Two kinds of read sit under `accountsAll()`: the pickers' (one answer each)
 * and the accounts page's list (one page per "load more"); both keys end with
 * the filters they were read with. Every command used to invalidate them all,
 * and the list then read every page it had loaded again, in sequence, each
 * page itself up to twenty requests: two "load more" and one archive meant up
 * to sixty requests before the list settled.
 *
 * Now a command whose response says what changed rewrites the rows in place
 * and asks nothing of the server; the list keeps the pages it has. Only a
 * change nobody can place - a new account, whose position in the server's
 * order is the server's - costs a read, of each list's first page.
 */

type AccountPages = InfiniteData<AccountListResponse, string | undefined>
type AccountRead = AccountListResponse | AccountPages
type RowChange = (row: AccountRow) => AccountRow

function isPages(data: AccountRead): data is AccountPages {
  return 'pages' in data
}

function accountReads(queryClient: QueryClient, which?: (query: Query) => boolean) {
  return queryClient.getQueryCache().findAll({ queryKey: adminQueryKeys.accountsAll(), predicate: which })
}

function readFilters(queryKey: QueryKey): AccountListFilters {
  const last = queryKey[queryKey.length - 1]
  return last && typeof last === 'object' ? (last as AccountListFilters) : {}
}

function inFlight(query: Query) {
  return query.state.fetchStatus === 'fetching'
}

/**
 * A read in flight when a change lands may answer from before it. A refetch
 * would only join it - a first read has no answer yet for one to replace - so
 * it is stopped and started again, from its first page.
 */
function restart(queryClient: QueryClient, query: Query) {
  const only = { queryKey: query.queryKey, exact: true }
  void queryClient.cancelQueries(only).then(() => {
    // Cancelling puts back every page the list had loaded, and a refetch
    // would read each of them again.
    keepFirstPage(queryClient, query)
    return queryClient.invalidateQueries({ ...only, refetchType: 'all' })
  })
}

/** A list keeps its first page only; "load more" starts over from there. */
function keepFirstPage(queryClient: QueryClient, query: Query) {
  const data = query.state.data as AccountRead | undefined
  if (data === undefined || !isPages(data) || data.pages.length < 2) return
  queryClient.setQueryData<AccountPages>(query.queryKey, {
    pages: data.pages.slice(0, 1),
    pageParams: data.pageParams.slice(0, 1),
  })
}

/** One answer with `change` applied to each row, or null when no row changed. */
function rewriteAnswer(answer: AccountListResponse, filters: AccountListFilters, change: RowChange) {
  let changed = false
  const groups = { ...answer.groups }
  const items: AccountRow[] = []
  for (const row of answer.items) {
    const next = change(row)
    if (next === row) {
      items.push(row)
      continue
    }
    changed = true
    // A row the read's status filter no longer admits leaves it, as it would
    // on a re-read. `groups` counts the rows of this answer by role.
    if (filters.status && next.accountStatus !== filters.status) {
      groups[row.role] = Math.max(0, (groups[row.role] ?? 1) - 1)
      continue
    }
    items.push(next)
  }
  return changed ? { ...answer, items, count: items.length, groups } : null
}

function rewriteRead(data: AccountRead, filters: AccountListFilters, change: RowChange): AccountRead | null {
  if (!isPages(data)) return rewriteAnswer(data, filters, change)
  let changed = false
  const pages = data.pages.map((page) => {
    const next = rewriteAnswer(page, filters, change)
    if (!next) return page
    changed = true
    return next
  })
  return changed ? { ...data, pages } : null
}

function answersOf(query: Query) {
  const data = query.state.data as AccountRead | undefined
  return data === undefined ? [] : isPages(data) ? data.pages : [data]
}

function findRow(queryClient: QueryClient, userId: string) {
  for (const query of accountReads(queryClient)) {
    for (const answer of answersOf(query)) {
      const row = answer.items.find((item) => item.userId === userId)
      if (row) return row
    }
  }
  return undefined
}

function holds(query: Query, userId: string) {
  return answersOf(query).some((answer) => answer.items.some((item) => item.userId === userId))
}

/**
 * Each read matching `which` keeps only its first page and is read again:
 * now if it is on screen, otherwise the next time it is shown. One walk of
 * the list instead of one per page loaded, and "load more" starts over.
 */
export function rereadFirstPages(queryClient: QueryClient, which: (query: Query) => boolean = () => true) {
  const settled: Query[] = []
  for (const query of accountReads(queryClient, which)) {
    if (inFlight(query)) {
      restart(queryClient, query)
      continue
    }
    settled.push(query)
    keepFirstPage(queryClient, query)
  }
  void queryClient.invalidateQueries({
    queryKey: adminQueryKeys.accountsAll(),
    predicate: (query) => settled.includes(query),
  })
}

/**
 * Applies `change` to the rows of every read not in flight, and nothing more:
 * which reads go to the server again is the caller's to say. A read in flight
 * is left to it too: its answer, or cancelling it, would replace the rows.
 */
function writeRows(queryClient: QueryClient, change: RowChange) {
  for (const query of accountReads(queryClient, (query) => !inFlight(query))) {
    const data = query.state.data as AccountRead | undefined
    const next = data === undefined ? null : rewriteRead(data, readFilters(query.queryKey), change)
    if (next) queryClient.setQueryData(query.queryKey, next)
  }
}

/**
 * Applies `change` to every cached row. A read the change did not touch is
 * left alone, unless `stale` says it may still be wrong - its filters may now
 * admit an account it does not hold, or it holds a row the change could not
 * write - and that one is read again from its first page. A read in flight is
 * started again whatever it holds.
 */
function changeRows(
  queryClient: QueryClient,
  change: RowChange,
  stale: (filters: AccountListFilters, query: Query) => boolean = () => false,
) {
  const reread = new Set<Query>()
  for (const query of accountReads(queryClient)) {
    if (inFlight(query)) {
      restart(queryClient, query)
      continue
    }
    const data = query.state.data as AccountRead | undefined
    const filters = readFilters(query.queryKey)
    const next = data === undefined ? null : rewriteRead(data, filters, change)
    if (next) queryClient.setQueryData(query.queryKey, next)
    else if (stale(filters, query)) reread.add(query)
  }
  if (reread.size > 0) rereadFirstPages(queryClient, (query) => reread.has(query))
}

/**
 * Suspend, reactivate, archive. The response names the new status; the rest
 * follows the list's own rules (stoa-backend `GET /admin/users`): an
 * invitation is listed only for an invited account, and a parent's row lists
 * the children linked while both accounts are active. A student who leaves
 * active drops off its parents' rows, and a parent who does has none on its
 * own. Back to active, those links return, and which ones is the server's to
 * say, so a parent or student coming back costs a first-page read. Its own
 * row says "active" before that read is sent (#449): the row's buttons follow
 * its status, and the "Reactivate" its dialog was opened from has to be gone
 * by the time the dialog closes, or focus goes back to it and then, when the
 * read lands, to nowhere.
 *
 * The role comes from a cached row. With none, a list filtered to any role
 * may admit the account, so every list filtered to the new status is read
 * again.
 */
export function afterStatusChange(
  queryClient: QueryClient,
  input: { userId: string; status: Exclude<AccountStatus, 'invited'> },
  result?: AccountStatusResponse,
) {
  const status = result?.accountStatus ?? input.status
  const role = findRow(queryClient, input.userId)?.role
  if (status === 'active' && role !== 'teacher' && role !== 'admin') {
    writeRows(queryClient, (row) =>
      row.userId === input.userId ? { ...row, accountStatus: status, invitationId: undefined } : row,
    )
    rereadFirstPages(queryClient)
    return
  }
  const leaving = status !== 'active'
  changeRows(
    queryClient,
    (row) => {
      if (row.userId === input.userId) {
        return {
          ...row,
          accountStatus: status,
          invitationId: undefined,
          linkedAccounts: leaving && row.role === 'parent' ? [] : row.linkedAccounts,
        }
      }
      if (leaving && row.role === 'parent' && row.linkedAccounts.some((link) => link.userId === input.userId)) {
        return { ...row, linkedAccounts: row.linkedAccounts.filter((link) => link.userId !== input.userId) }
      }
      return row
    },
    (filters) => filters.status === status && (!filters.role || !role || filters.role === role),
  )
}

/** A reissued invitation replaces the one the row carried; the status stays `invited`. */
export function afterReissue(
  queryClient: QueryClient,
  input: { invitationId: string },
  result?: AccountInvitationResponse,
) {
  if (!result?.invitationId) {
    rereadFirstPages(queryClient)
    return
  }
  changeRows(queryClient, (row) =>
    row.invitationId === input.invitationId ? { ...row, invitationId: result.invitationId } : row,
  )
}

/** A revoked invitation leaves the account invited, with nothing to resend. */
export function afterRevoke(queryClient: QueryClient, invitationId: string) {
  changeRows(queryClient, (row) => (row.invitationId === invitationId ? { ...row, invitationId: undefined } : row))
}

/**
 * An administrator's link is active at once, and both rows list it under the
 * other account's number. That number comes from a cached row; a row whose
 * counterpart no cached read holds gets no link without one, and the reads
 * holding it are read again instead.
 */
export function afterParentLink(queryClient: QueryClient, input: { parentId: string; studentId: string }) {
  const parent = findRow(queryClient, input.parentId)
  const student = findRow(queryClient, input.studentId)
  changeRows(
    queryClient,
    (row) => {
      const other = row.userId === input.parentId ? student : row.userId === input.studentId ? parent : undefined
      if (!other || row.linkedAccounts.some((held) => held.userId === other.userId)) return row
      const link: AccountLink = { userId: other.userId, accountNumber: other.accountNumber, status: 'active' }
      return { ...row, linkedAccounts: [...row.linkedAccounts, link] }
    },
    (_, query) => (!student && holds(query, input.parentId)) || (!parent && holds(query, input.studentId)),
  )
}
