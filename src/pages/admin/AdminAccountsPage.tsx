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
  const [newRole, setNewRole] = useState<AccountRole>('student')
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
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

  function invite() {
    setNotice(null)
    setSecret(null)
    inviteMutation.mutate(
      { role: newRole, email: newEmail.trim(), fullName: newName.trim() },
      {
        onSuccess: (result) => {
          setNotice(
            result.invitationDelivered
              ? t('accounts.inviteSent', { accountNumber: result.accountNumber })
              : t('accounts.inviteNotDelivered', { accountNumber: result.accountNumber }),
          )
          if (!result.invitationDelivered) setSecret(result.activationToken)
        },
        onError: (error) => setNotice(toUserFacingError(error, t('accounts.inviteFailed'))),
      },
    )
  }

  function assign() {
    setNotice(null)
    setSecret(null)
    assignMutation.mutate(
      { role: newRole, email: newEmail.trim(), fullName: newName.trim() },
      {
        onSuccess: (result) => {
          setNotice(t('accounts.assigned', { accountNumber: result.accountNumber }))
          setSecret(result.initialPassword)
        },
        onError: (error) => setNotice(toUserFacingError(error, t('accounts.assignFailed'))),
      },
    )
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
        onError: (error) => setNotice(toUserFacingError(error, t('accounts.reissueFailed'))),
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
        onError: (error) => setNotice(toUserFacingError(error, t('accounts.passwordResetFailed'))),
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
        onError: (error) => setNotice(toUserFacingError(error, t('accounts.statusFailed'))),
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
          <CardContent className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              {t('accounts.roleLabel')}
              <select
                className="h-9 rounded-md border px-2"
                value={newRole}
                onChange={(event) => setNewRole(event.target.value as AccountRole)}
              >
                {ROLES.map((item) => (
                  <option key={item} value={item}>
                    {t(`accounts.role.${item}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t('accounts.emailLabel')}
              <Input value={newEmail} onChange={(event) => setNewEmail(event.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t('accounts.nameLabel')}
              <Input value={newName} onChange={(event) => setNewName(event.target.value)} />
            </label>
            <Button type="button" onClick={invite} disabled={!newEmail.trim() || inviteMutation.isPending}>
              {t('accounts.invite')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={assign}
              disabled={!newEmail.trim() || assignMutation.isPending}
            >
              {t('accounts.assign')}
            </Button>
          </CardContent>
        </Card>

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
        {accountsQuery.isError ? (
          <p className="mb-3 text-sm">{toUserFacingError(accountsQuery.error, t('accounts.loadFailed'))}</p>
        ) : null}

        {grouped.map((group) => (
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
