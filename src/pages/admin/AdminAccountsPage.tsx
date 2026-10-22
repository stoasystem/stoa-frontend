import { Fragment, useMemo, useRef, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Group, Row } from '@/components/base'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  useAdminAccountListQuery,
  useAssignAccountMutation,
  useChangeAccountStatusMutation,
  useInviteAccountMutation,
  useReissueInvitationMutation,
  useResetAccountPasswordMutation,
} from '@/hooks/admin/useAdminAccounts'
import { useDebouncedValue } from '@/hooks/admin/useDebouncedValue'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { toUserFacingError } from '@/lib/userFacingText'
import type { AccountAction } from '@/pages/admin/AccountActionDialog'
import { AccountActionDialog, accountLabel } from '@/pages/admin/AccountActionDialog'
import { AccountDraftFields, BlockedReason } from '@/pages/admin/AccountFormFields'
import { AssignAccountDialog } from '@/pages/admin/AssignAccountDialog'
import { TeacherSupportAllowanceEditor } from '@/pages/admin/TeacherSupportAllowanceEditor'
import type { AccountDraft } from '@/pages/admin/accountFormRules'
import {
  accountDraftIssues,
  accountDraftPayload,
  blockingIssues,
} from '@/pages/admin/accountFormRules'
import { ApiError } from '@/services/api/httpClient'
import type { AccountRole, AccountRow, AccountStatus } from '@/services/admin/accountsApi'
import { formatDateTime } from '@/lib/formatDateTime'

/**
 * The server sends these as ISO timestamps, and the table printed them as such
 * ("2026-09-23T01:56:24.621354+00:00", #162). One it cannot read is shown as sent.
 */
function accountTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : formatDateTime(date)
}

const ROLES: AccountRole[] = ['student', 'teacher', 'parent', 'admin']
const STATUSES: AccountStatus[] = ['invited', 'active', 'suspended', 'archived']

// An archived account is read-only and keeps its number; there is no delete.
const EMPTY_DRAFT: AccountDraft = { role: 'student', email: '', fullName: '', dateOfBirth: '' }

const NEXT_STATUS: Record<string, Exclude<AccountStatus, 'invited'>[]> = {
  invited: ['archived'],
  active: ['suspended', 'archived'],
  suspended: ['active', 'archived'],
  archived: [],
}

export function AdminAccountsPage() {
  const { t } = useTranslation('admin')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [keyword, setKeyword] = useState('')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  // Card 008: a date, not an age. An age goes stale; the date lets the server
  // recompute "is this a minor today" at every decision.
  const [draft, setDraft] = useState<AccountDraft>(EMPTY_DRAFT)
  const [touched, setTouched] = useState<Partial<Record<keyof AccountDraft, boolean>>>({})
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [action, setAction] = useState<AccountAction | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [allowanceFor, setAllowanceFor] = useState<string | null>(null)

  // #335: the list used to be read in full on every key typed. The keyword
  // now waits for a pause, and the previous answer stays up meanwhile.
  const settledKeyword = useDebouncedValue(keyword.trim(), 300)
  const filters = useMemo(
    () => ({ role, status, q: settledKeyword, createdFrom, createdTo }),
    [role, status, settledKeyword, createdFrom, createdTo],
  )
  const accountsQuery = useAdminAccountListQuery(filters)
  const inviteMutation = useInviteAccountMutation()
  const assignMutation = useAssignAccountMutation()
  const reissueMutation = useReissueInvitationMutation()
  const resetMutation = useResetAccountPasswordMutation()
  const statusMutation = useChangeAccountStatusMutation()
  // #259: one row action at a time. A double-clicked reset issued two temporary
  // passwords and the first was dead on arrival; the ref closes the gap before
  // `isPending` reaches the next render.
  const inFlight = useRef(false)
  // #407: a status change takes the button it was confirmed from off the row,
  // so focus goes to the line that says what happened.
  const noticeLine = useRef<HTMLParagraphElement>(null)
  const busy =
    resetMutation.isPending || statusMutation.isPending || reissueMutation.isPending || action !== null

  // #259: a list still being read is not an empty one. On a large tenant the
  // read pages through up to twenty requests, and every group said "no accounts".
  const loading = accountsQuery.isPending
  // #335: the read stops after a budget of requests. A list cut there used to
  // look complete; now it says so and offers to read on.
  const incomplete = Boolean(accountsQuery.data?.nextCursor)
  // #457: only a list never read is replaced by the failure. With
  // `retry: false` a "load more" that failed, or a read again after a change,
  // put the whole query in error, and the accounts on hand went with it.
  const listFailed = accountsQuery.isError && !accountsQuery.data
  const rows = accountsQuery.data?.items ?? []
  const groups = accountsQuery.data?.groups ?? {}
  const grouped = ROLES.map((item) => ({ role: item, rows: rows.filter((row) => row.role === item) }))

  // Card 014: the button that cannot be pressed has to name what is missing.
  const inviteIssues = accountDraftIssues(draft)
  const inviteBlocking = blockingIssues(draft)
  const inviteReasons = inviteBlocking.map((issue) => t(`accounts.fieldIssues.${issue}`))
  // Card 124: an untouched form is not a wrong one. The blocked line used to
  // open under a blank form reading "Not ready to send: Enter an email
  // address.", which tells an administrator who has typed nothing that they
  // already did something wrong. It waits until a field has been touched; the
  // button is disabled until then either way, and its tooltip still says why.
  const inviteTouched = Object.values(touched).some(Boolean)
  const shownInviteReasons = inviteTouched ? inviteReasons : []
  // Blocked: say what is missing. Ready: say what the button will do.
  const inviteTooltip =
    inviteBlocking.length > 0 ? inviteReasons.join(' · ') : t('accounts.inviteExplainer')

  /**
   * #335: after a success the form is emptied. Left filled, a second press
   * invited the same address again, which replaced the invitation and with it
   * the one-time activation code still on screen.
   */
  function clearDraft() {
    setDraft(EMPTY_DRAFT)
    setTouched({})
  }

  function invite() {
    if (inviteBlocking.length > 0 || inviteMutation.isPending) return
    setNotice(null)
    setSecret(null)
    inviteMutation.mutate(accountDraftPayload(draft), {
      onSuccess: (result) => {
        clearDraft()
        setNotice(
          result.invitationDelivered
            ? t('accounts.inviteSent', { accountNumber: result.accountNumber })
            : t('accounts.inviteNotDelivered', { accountNumber: result.accountNumber }),
        )
        if (!result.invitationDelivered) setSecret(result.activationToken)
        // #449: the page holds what it shows now. The mutation's answer, code
        // and all, would otherwise stay in the query client's cache for as
        // long as the page is open; reset, it is collected at once.
        inviteMutation.reset()
      },
      onError: (error) =>
        setNotice(
          refusal(error, t('accounts.inviteFailed'), {
            role: t(`accounts.roleSingular.${draft.role}`),
          }),
        ),
    })
  }

  /**
   * Say which rule refused, when the backend named one.
   *
   * The guards on this page refuse with a code rather than prose — the last
   * active administrator, an administrator's password, an invitation already
   * replaced. Without a phrase for the code every one of them reads as the same
   * generic failure, which tells the operator nothing about what to do next.
   */
  function refusal(error: unknown, fallback: string, params?: Record<string, string>) {
    const code = error instanceof ApiError ? error.code : undefined
    if (!code) return toUserFacingError(error, fallback)
    return t(`accounts.errors.${code}`, {
      defaultValue: toUserFacingError(error, fallback),
      ...params,
    })
  }

  function assign(filled: AccountDraft) {
    if (blockingIssues(filled).length > 0) return
    setNotice(null)
    setSecret(null)
    setAssignError(null)
    assignMutation.mutate(accountDraftPayload(filled), {
      onSuccess: (result) => {
        setAssignOpen(false)
        clearDraft()
        setNotice(t('accounts.assigned', { accountNumber: result.accountNumber }))
        setSecret(result.initialPassword)
        assignMutation.reset()
      },
      // The dialog stays open on a refusal, and it sits over the page, so the
      // answer has to be rendered inside it. Put on the page behind, a real
      // refusal is indistinguishable from a button that did nothing.
      onError: (error) =>
        setAssignError(
          refusal(error, t('accounts.assignFailed'), {
            role: t(`accounts.roleSingular.${filled.role}`),
          }),
        ),
    })
  }

  function resend(row: AccountRow) {
    // The account id is not an invitation id: the reissue command resolves the
    // invitation through its own pointer row, so sending the account id could
    // only ever answer 404. The list hands the live invitation id back instead.
    if (!row.invitationId || inFlight.current) return
    inFlight.current = true
    setNotice(null)
    setSecret(null)
    reissueMutation.mutate(
      { invitationId: row.invitationId },
      {
        onSettled: () => {
          inFlight.current = false
        },
        onSuccess: (result) => {
          setNotice(
            result.invitationDelivered
              ? t('accounts.inviteResent')
              : t('accounts.inviteNotDelivered', { accountNumber: result.accountNumber }),
          )
          // #449: "pass it on yourself" needs something to pass on. The new
          // code is shown as an invitation's is; the old one is dead.
          if (!result.invitationDelivered) setSecret(result.activationToken)
          reissueMutation.reset()
        },
        onError: (error) => setNotice(refusal(error, t('accounts.reissueFailed'))),
      },
    )
  }

  function confirmAction(chosen: AccountAction, reason: string) {
    if (inFlight.current) return
    inFlight.current = true
    setNotice(null)
    setSecret(null)
    setActionError(null)
    const settle = {
      onSettled: () => {
        inFlight.current = false
      },
      // The dialog sits over the page, so a refusal is said inside it, and the
      // reason stays for a retry. Success closes it and the reason goes with it.
      onError: (error: unknown) =>
        setActionError(
          refusal(
            error,
            chosen.kind === 'reset' ? t('accounts.passwordResetFailed') : t('accounts.statusFailed'),
          ),
        ),
    }
    if (chosen.kind === 'reset') {
      resetMutation.mutate(
        { userId: chosen.row.userId, reason },
        {
          ...settle,
          onSuccess: (result) => {
            setAction(null)
            setNotice(t('accounts.passwordReset'))
            setSecret(result.temporaryPassword)
            resetMutation.reset()
          },
        },
      )
      return
    }
    statusMutation.mutate(
      { userId: chosen.row.userId, status: chosen.next, reason },
      {
        ...settle,
        onSuccess: () => {
          setAction(null)
          setNotice(t('accounts.statusChanged', { status: t(`accounts.status.${chosen.next}`) }))
        },
      },
    )
  }

  /**
   * #449: a one-time secret stayed on screen until the next action. It now
   * goes when the administrator says so. Not on a timer: the code or password
   * cannot be read a second time, and one that vanished while being copied
   * or read out over the phone would have to be issued again.
   */
  function hideSecret() {
    // The button goes with the line it sits on; focus goes to the line that
    // says what happened, which stays.
    noticeLine.current?.focus()
    setSecret(null)
  }

  function openAction(chosen: AccountAction) {
    if (busy) return
    setActionError(null)
    setAction(chosen)
  }

  /** "Archive: Lea Muster (S-0001)", so a screen reader hears which row the button acts on. */
  function rowActionName(label: string, row: AccountRow) {
    return t('accounts.actionFor', { action: label, account: accountLabel(row) })
  }

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow={t('accounts.eyebrow')}
          title={t('accounts.title')}
          description={t('accounts.description')}
          actions={
            loading ? null : (
              <Badge variant="secondary">{t('accounts.total', { count: rows.length })}</Badge>
            )
          }
        />

        {/* Users holds account operations too (#13 point 6): the second page of the item. */}
        <Group>
          <Row
            to="/admin/account-operations"
            leading={{ kind: 'icon', icon: ClipboardList }}
            title={t('accounts.operations')}
            subtitle={t('accounts.operationsDescription')}
          />
        </Group>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{t('accounts.createTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-start gap-3">
            <p className="w-full text-xs text-muted-foreground">{t('accounts.requiredLegend')}</p>

            <AccountDraftFields
              idPrefix="create"
              draft={draft}
              issues={inviteIssues}
              touched={touched}
              onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
              onTouch={(field) => setTouched((current) => ({ ...current, [field]: true }))}
            />

            <BlockedReason id="invite-blocked" reasons={shownInviteReasons} />

            <div className="flex w-full flex-wrap items-center gap-3">
              <span title={inviteTooltip}>
                <Button
                  type="button"
                  onClick={invite}
                  title={inviteTooltip}
                  aria-describedby={shownInviteReasons.length > 0 ? 'invite-blocked' : undefined}
                  disabled={inviteBlocking.length > 0 || inviteMutation.isPending}
                >
                  {t('accounts.invite')}
                </Button>
              </span>
            </div>

            <div className="flex w-full flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAssignOpen(true)}
                disabled={assignMutation.isPending}
                title={t('accounts.assignExplainer')}
              >
                {t('accounts.assign')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <AssignAccountDialog
          open={assignOpen}
          initial={draft}
          pending={assignMutation.isPending}
          error={assignError}
          onOpenChange={(open) => {
            setAssignError(null)
            setAssignOpen(open)
          }}
          onSubmit={assign}
        />

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{t('accounts.filterTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              {t('accounts.roleLabel')}
              <select
                className="h-9 rounded-md border px-2"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                <option value="">{t('accounts.allRoles')}</option>
                {ROLES.map((item) => (
                  <option key={item} value={item}>
                    {t(`accounts.role.${item}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t('accounts.statusLabel')}
              <select
                className="h-9 rounded-md border px-2"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="">{t('accounts.allStatuses')}</option>
                {STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {t(`accounts.status.${item}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t('accounts.keywordLabel')}
              <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} />
            </label>
            {/* Card 124: these read `mm/dd/yyyy` for an administrator whose
              * browser is set to English. A native date input takes its
              * display format from the browser's own locale, not from the
              * page's `lang`, not from a placeholder and not from CSS, so
              * nothing here can make it read `dd.mm.yyyy`. Changing that needs
              * a controlled field, which needs copy in all four languages.
              * Until then the value stays ISO and the picker stays native. */}
            <label className="flex flex-col gap-1 text-sm">
              {t('accounts.createdFromLabel')}
              <Input type="date" value={createdFrom} onChange={(event) => setCreatedFrom(event.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t('accounts.createdToLabel')}
              <Input type="date" value={createdTo} onChange={(event) => setCreatedTo(event.target.value)} />
            </label>
          </CardContent>
        </Card>

        <AccountActionDialog
          action={action}
          pending={resetMutation.isPending || statusMutation.isPending}
          error={actionError}
          returnFocusFallback={noticeLine}
          onCancel={() => {
            setActionError(null)
            setAction(null)
          }}
          onConfirm={confirmAction}
        />

        {/* Always mounted: a live region that appears with its text is not announced. */}
        <p ref={noticeLine} tabIndex={-1} role="status" className={notice ? 'mb-3 text-sm' : 'sr-only'}>
          {notice}
        </p>
        {secret ? (
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-md border p-2">
            <p className="min-w-0 flex-1 break-all font-mono text-sm">
              {t('accounts.readOnceHint')} {secret}
            </p>
            <Button type="button" size="sm" variant="outline" onClick={hideSecret}>
              {t('accounts.hideSecret')}
            </Button>
          </div>
        ) : null}
        {/* A list that could not be read is not a list of nothing.
          * The refusal used to print as one grey line above four cards each
          * saying "0" and "no accounts in this group", which reads as an answer:
          * an administrator who lacked the capability to list accounts was told,
          * in effect, that the platform had none. The groups only render once
          * the list has actually been read. */}
        {listFailed ? (
          <p
            role="alert"
            className="mb-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {refusal(accountsQuery.error, t('accounts.loadFailed'))}
          </p>
        ) : null}
        {accountsQuery.isRefetchError ? (
          <p role="alert" className="mb-3 text-sm text-destructive">
            {t('accounts.refreshFailed')}
          </p>
        ) : null}

        {loading ? (
          <p role="status" className="mb-3 text-sm text-muted-foreground">
            {t('accounts.loading')}
          </p>
        ) : null}

        {incomplete ? (
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-md border p-3 text-sm">
            <p>{t('accounts.incomplete', { shown: rows.length })}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={accountsQuery.isFetchingNextPage}
              onClick={() => void accountsQuery.fetchNextPage()}
            >
              {accountsQuery.isFetchingNextPage ? t('accounts.loadingMore') : t('accounts.loadMore')}
            </Button>
            {accountsQuery.isFetchNextPageError ? (
              <p role="alert" className="text-destructive">
                {t('accounts.loadMoreFailed')}
              </p>
            ) : null}
          </div>
        ) : null}

        {listFailed || loading ? null : grouped.map((group) => (
          <Card key={group.role} className="mb-4">
            <CardHeader>
              <CardTitle>
                {t(`accounts.role.${group.role}`)} · {groups[group.role] ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {group.rows.length === 0 ? (
                <p className="text-sm">{t('accounts.empty')}</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th className="p-2">{t('accounts.columnNumber')}</th>
                      <th className="p-2">{t('accounts.columnName')}</th>
                      <th className="p-2">{t('accounts.columnEmail')}</th>
                      <th className="p-2">{t('accounts.columnRole')}</th>
                      <th className="p-2">{t('accounts.columnStatus')}</th>
                      <th className="p-2">{t('accounts.columnMinor')}</th>
                      <th className="p-2">{t('accounts.columnCreatedAt')}</th>
                      <th className="p-2">{t('accounts.columnLastLogin')}</th>
                      <th className="p-2">{t('accounts.columnLinked')}</th>
                      <th className="p-2">{t('accounts.columnActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row) => (
                      <Fragment key={row.userId}>
                      <tr className="border-t">
                        <td className="p-2 font-mono">{row.accountNumber || '—'}</td>
                        <td className="p-2">{row.name || '—'}</td>
                        <td className="p-2">{row.email || '—'}</td>
                        <td className="p-2">{t(`accounts.role.${row.role}`)}</td>
                        <td className="p-2">{t(`accounts.status.${row.accountStatus}`)}</td>
                        <td className="p-2">
                          {row.minorKnown === false ? (
                            // `isMinor` answers "minor" when no birthday is on
                            // file, which is right for a protection decision and
                            // wrong as a statement about the person. Without one
                            // the console says so instead of picking a side.
                            <span className="text-muted-foreground">
                              {t('accounts.minorUnknown')}
                            </span>
                          ) : row.isMinor ? (
                            <Badge variant="secondary">{t('accounts.minorYes')}</Badge>
                          ) : (
                            t('accounts.minorNo')
                          )}
                        </td>
                        <td className="p-2">{accountTime(row.createdAt)}</td>
                        <td className="p-2">{accountTime(row.lastLoginAt)}</td>
                        <td className="p-2">
                          {row.linkedAccounts.length === 0
                            ? '—'
                            : row.linkedAccounts
                                .map((link) => link.accountNumber || link.userId)
                                .join(', ')}
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              aria-label={rowActionName(t('accounts.resetPassword'), row)}
                              onClick={() => openAction({ kind: 'reset', row })}
                            >
                              {t('accounts.resetPassword')}
                            </Button>
                            {row.accountStatus === 'invited' ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={!row.invitationId || busy}
                                aria-label={rowActionName(t('accounts.resendInvite'), row)}
                                onClick={() => resend(row)}
                              >
                                {t('accounts.resendInvite')}
                              </Button>
                            ) : null}
                            {(NEXT_STATUS[row.accountStatus] ?? []).map((next) => (
                              <Button
                                key={next}
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                aria-label={rowActionName(t(`accounts.moveTo.${next}`), row)}
                                onClick={() => openAction({ kind: 'status', row, next })}
                              >
                                {t(`accounts.moveTo.${next}`)}
                              </Button>
                            ))}
                            {row.role === 'student' ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                aria-label={rowActionName(t('accounts.teacherSupport.open'), row)}
                                onClick={() =>
                                  setAllowanceFor(allowanceFor === row.userId ? null : row.userId)
                                }
                              >
                                {t('accounts.teacherSupport.open')}
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                      {/* Under the row it belongs to rather than in a dialog:
                        * the figure is one line of this student's row, and a
                        * dialog over the list hides which student it was
                        * opened for. */}
                      {allowanceFor === row.userId ? (
                        <tr className="border-t bg-muted/30">
                          <td className="p-2" colSpan={10}>
                            <TeacherSupportAllowanceEditor
                              studentId={row.userId}
                              onClose={() => setAllowanceFor(null)}
                            />
                          </td>
                        </tr>
                      ) : null}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        ))}
      </PageContainer>
    </DashboardLayout>
  )
}
