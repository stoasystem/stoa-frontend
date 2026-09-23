import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  useAdminAccountsQuery,
  useAssignAccountMutation,
  useChangeAccountStatusMutation,
  useInviteAccountMutation,
  useReissueInvitationMutation,
  useResetAccountPasswordMutation,
} from '@/hooks/admin/useAdminAccounts'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { toUserFacingError } from '@/lib/userFacingText'
import { AccountDraftFields, BlockedReason } from '@/pages/admin/AccountFormFields'
import { AssignAccountDialog } from '@/pages/admin/AssignAccountDialog'
import type { AccountDraft } from '@/pages/admin/accountFormRules'
import {
  accountDraftIssues,
  accountDraftPayload,
  blockingIssues,
} from '@/pages/admin/accountFormRules'
import { ApiError } from '@/services/api/httpClient'
import type { AccountRole, AccountRow, AccountStatus } from '@/services/admin/accountsApi'

const ROLES: AccountRole[] = ['student', 'teacher', 'parent', 'admin']
const STATUSES: AccountStatus[] = ['invited', 'active', 'suspended', 'archived']

// An archived account is read-only and keeps its number; there is no delete.
const NEXT_STATUS: Record<string, AccountStatus[]> = {
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
  const [draft, setDraft] = useState<AccountDraft>({
    role: 'student',
    email: '',
    fullName: '',
    dateOfBirth: '',
  })
  const [touched, setTouched] = useState<Partial<Record<keyof AccountDraft, boolean>>>({})
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)

  const filters = useMemo(
    () => ({ role, status, q: keyword, createdFrom, createdTo }),
    [role, status, keyword, createdFrom, createdTo],
  )
  const accountsQuery = useAdminAccountsQuery(filters)
  const inviteMutation = useInviteAccountMutation()
  const assignMutation = useAssignAccountMutation()
  const reissueMutation = useReissueInvitationMutation()
  const resetMutation = useResetAccountPasswordMutation()
  const statusMutation = useChangeAccountStatusMutation()

  const rows = accountsQuery.data?.items ?? []
  const groups = accountsQuery.data?.groups ?? {}
  const grouped = ROLES.map((item) => ({ role: item, rows: rows.filter((row) => row.role === item) }))

  // Card 014: the button that cannot be pressed has to name what is missing.
  const inviteIssues = accountDraftIssues(draft)
  const inviteBlocking = blockingIssues(draft)
  const inviteReasons = inviteBlocking.map((issue) => t(`accounts.fieldIssues.${issue}`))
  // Blocked: say what is missing. Ready: say what the button will do.
  const inviteTooltip =
    inviteBlocking.length > 0 ? inviteReasons.join(' · ') : t('accounts.inviteExplainer')

  function invite() {
    if (inviteBlocking.length > 0) return
    setNotice(null)
    setSecret(null)
    inviteMutation.mutate(accountDraftPayload(draft), {
      onSuccess: (result) => {
        setNotice(
          result.invitationDelivered
            ? t('accounts.inviteSent', { accountNumber: result.accountNumber })
            : t('accounts.inviteNotDelivered', { accountNumber: result.accountNumber }),
        )
        if (!result.invitationDelivered) setSecret(result.activationToken)
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
        setDraft(filled)
        setNotice(t('accounts.assigned', { accountNumber: result.accountNumber }))
        setSecret(result.initialPassword)
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
    if (!row.invitationId) return
    setNotice(null)
    setSecret(null)
    reissueMutation.mutate(
      { invitationId: row.invitationId },
      {
        onSuccess: (result) => {
          setNotice(
            result.invitationDelivered
              ? t('accounts.inviteResent')
              : t('accounts.inviteNotDelivered', { accountNumber: result.accountNumber }),
          )
        },
        onError: (error) => setNotice(refusal(error, t('accounts.reissueFailed'))),
      },
    )
  }

  function resetPassword(row: AccountRow) {
    if (!reason.trim()) {
      setNotice(t('accounts.reasonRequired'))
      return
    }
    setNotice(null)
    setSecret(null)
    resetMutation.mutate(
      { userId: row.userId, reason: reason.trim() },
      {
        onSuccess: (result) => {
          setNotice(t('accounts.passwordReset'))
          setSecret(result.temporaryPassword)
        },
        onError: (error) => setNotice(refusal(error, t('accounts.passwordResetFailed'))),
      },
    )
  }

  function moveStatus(row: AccountRow, next: AccountStatus) {
    if (!reason.trim()) {
      setNotice(t('accounts.reasonRequired'))
      return
    }
    setNotice(null)
    setSecret(null)
    statusMutation.mutate(
      { userId: row.userId, status: next as Exclude<AccountStatus, 'invited'>, reason: reason.trim() },
      {
        onSuccess: () => setNotice(t('accounts.statusChanged', { status: t(`accounts.status.${next}`) })),
        onError: (error) => setNotice(refusal(error, t('accounts.statusFailed'))),
      },
    )
  }

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow={t('accounts.eyebrow')}
          title={t('accounts.title')}
          description={t('accounts.description')}
          actions={<Badge variant="secondary">{t('accounts.total', { count: rows.length })}</Badge>}
        />

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

            <BlockedReason id="invite-blocked" reasons={inviteReasons} />

            <div className="flex w-full flex-wrap items-center gap-3">
              <span title={inviteTooltip}>
                <Button
                  type="button"
                  onClick={invite}
                  title={inviteTooltip}
                  aria-describedby={inviteBlocking.length > 0 ? 'invite-blocked' : undefined}
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

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{t('accounts.reasonTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex flex-col gap-1 text-sm">
              {t('accounts.reasonPrompt')}
              <Input value={reason} onChange={(event) => setReason(event.target.value)} />
            </label>
          </CardContent>
        </Card>

        {notice ? <p className="mb-3 text-sm">{notice}</p> : null}
        {secret ? (
          <p className="mb-3 break-all rounded-md border p-2 font-mono text-sm">
            {t('accounts.readOnceHint')} {secret}
          </p>
        ) : null}
        {/* A list that could not be read is not a list of nothing.
          * The refusal used to print as one grey line above four cards each
          * saying "0" and "no accounts in this group", which reads as an answer:
          * an administrator who lacked the capability to list accounts was told,
          * in effect, that the platform had none. The groups only render once
          * the list has actually been read. */}
        {accountsQuery.isError ? (
          <p
            role="alert"
            className="mb-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {refusal(accountsQuery.error, t('accounts.loadFailed'))}
          </p>
        ) : null}

        {accountsQuery.isError ? null : grouped.map((group) => (
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
                      <tr key={row.userId} className="border-t">
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
                        <td className="p-2">{row.createdAt || '—'}</td>
                        <td className="p-2">{row.lastLoginAt || '—'}</td>
                        <td className="p-2">
                          {row.linkedAccounts.length === 0
                            ? '—'
                            : row.linkedAccounts
                                .map((link) => link.accountNumber || link.userId)
                                .join(', ')}
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => resetPassword(row)}>
                              {t('accounts.resetPassword')}
                            </Button>
                            {row.accountStatus === 'invited' ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={!row.invitationId}
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
                                onClick={() => moveStatus(row, next)}
                              >
                                {t(`accounts.moveTo.${next}`)}
                              </Button>
                            ))}
                          </div>
                        </td>
                      </tr>
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
