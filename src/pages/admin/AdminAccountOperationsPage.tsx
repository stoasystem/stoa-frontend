import { type FormEvent, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { TFunction } from 'i18next'
import { AlertTriangle, CheckCircle2, Link2, RefreshCw, Search, ShieldAlert, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { describeIssueCode, formatStatus, supportStateTone } from '@/components/parent/accountOperationsView'
import { VerificationRecoveryEvidence } from '@/components/parent/VerificationRecoveryEvidence'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/services/api/httpClient'
import { useAdminAccountsQuery, useAssignParentLinkMutation } from '@/hooks/admin/useAdminAccounts'
import { useAdminParentAccountOperationsQuery } from '@/hooks/admin/useAdminAccountOperationsQuery'
import { useAdminBillingOperation } from '@/hooks/admin/useAdminBillingOperation'
import { activeLanguage } from '@/i18n/languages'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { formatDayAndTime } from '@/lib/formatDateTime'
import { toUserFacingError } from '@/lib/userFacingText'
import { adminQueryKeys } from '@/services/admin/adminQueryKeys'
import type { AccountRow } from '@/services/admin/accountsApi'
import type { AdminBillingOperationDetail } from '@/services/admin/adminApi'
import type { AdminAccountOperations } from '@/types/adminAccountOperations'
import type { AccountOperationsChild, AccountOperationsUsage } from '@/types/parentAccountOperations'
import type { SubscriptionBillingEvent } from '@/types/subscriptionOperations'

export function AdminAccountOperationsPage() {
  const { t } = useTranslation('admin')
  const [searchParams, setSearchParams] = useSearchParams()
  const parentId = searchParams.get('parentId')?.trim() ?? ''
  const day = searchParams.get('day')?.trim() ?? ''
  const checkoutRef = searchParams.get('checkoutRef')?.trim() ?? ''
  const [draftParentId, setDraftParentId] = useState(parentId)
  const [draftDay, setDraftDay] = useState(day)
  const [draftCheckoutRef, setDraftCheckoutRef] = useState(checkoutRef)
  const query = useAdminParentAccountOperationsQuery(parentId, day || undefined)
  const billingOperation = useAdminBillingOperation(parentId, checkoutRef)

  function submitLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextParentId = draftParentId.trim()
    const nextDay = draftDay.trim()
    const nextCheckoutRef = draftCheckoutRef.trim()
    const next = new URLSearchParams()
    if (nextParentId) next.set('parentId', nextParentId)
    if (nextDay) next.set('day', nextDay)
    if (nextCheckoutRef) next.set('checkoutRef', nextCheckoutRef)
    setSearchParams(next)
  }

  return (
    <DashboardLayout>
      <PageContainer className="space-y-6 p-0">
        {/* Card 007: payments and billing are frozen, so the subscription
            queue is unrouted and its action link is withdrawn:
            actions={<Button asChild variant="outline"><Link to="/admin/subscriptions">Subscription queue</Link></Button>} */}
        <PageHeader
          eyebrow={t('accountOperations.eyebrow')}
          title={t('accountOperations.title')}
          description={t('accountOperations.description')}
        />

        <form onSubmit={submitLookup} className="grid gap-3 rounded-md border border-border/70 bg-card p-4 lg:grid-cols-[minmax(0,0.8fr)_12rem_minmax(0,1.2fr)_auto]">
          <label className="space-y-2 text-sm font-medium text-foreground">
            {t('accountOperations.lookup.parentId')}
            <Input
              value={draftParentId}
              onChange={(event) => setDraftParentId(event.target.value)}
              placeholder="parent-1"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-foreground">
            {t('accountOperations.lookup.usageDay')}
            <Input
              value={draftDay}
              onChange={(event) => setDraftDay(event.target.value)}
              placeholder="2026-07-03"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-foreground">
            {t('accountOperations.lookup.checkoutRef')}
            <Input
              value={draftCheckoutRef}
              onChange={(event) => setDraftCheckoutRef(event.target.value)}
              placeholder="chk_public_…"
            />
          </label>
          <Button type="submit" className="self-end">
            <Search className="mr-2 h-4 w-4" aria-hidden="true" />
            {t('accountOperations.lookup.submit')}
          </Button>
        </form>

        <ParentLinkAssignment parentId={parentId} />

        {!parentId && <EmptyLookup />}
        {parentId && query.isLoading && <LoadingPanel />}
        {parentId && query.isError && <ErrorPanel error={query.error} />}
        {query.data && <AdminAccountOperationsDetail data={query.data} />}

        {parentId && checkoutRef && billingOperation.query.isLoading && <BillingRecoveryLoading />}
        {parentId && checkoutRef && billingOperation.query.isError && (
          <BillingRecoveryError error={billingOperation.query.error} operation="read" />
        )}
        {billingOperation.query.data && (
          <BillingRecoveryDetail
            data={billingOperation.query.data}
            rechecking={billingOperation.recheck.isPending}
            recheckError={billingOperation.recheck.error}
            onRecheck={() => billingOperation.recheck.mutate()}
          />
        )}
      </PageContainer>
    </DashboardLayout>
  )
}

/**
 * Linking a child to a parent, which until now existed only as a backend route.
 *
 * Card 008 settled who may do this: a self-service request is refused the
 * moment either side is a minor - and a date of birth nobody recorded counts
 * as a minor - so on a platform of schoolchildren the administrator's
 * assignment is the only path that ever completes. It needs no confirmation
 * from either account; the link is active as soon as it is made.
 *
 * The two accounts are picked from the same list the accounts console reads,
 * filtered to the active ones: the backend refuses an invited, suspended or
 * archived account as a target, and offering one would only produce a refusal
 * nobody could act on.
 */
function ParentLinkAssignment({ parentId }: { parentId: string }) {
  const { t } = useTranslation('admin')
  const queryClient = useQueryClient()
  const [parentKeyword, setParentKeyword] = useState('')
  const [studentKeyword, setStudentKeyword] = useState('')
  // Null means "follow the account the console is looking at"; once an
  // administrator picks one themselves, their choice stands.
  const [parentChoice, setParentChoice] = useState<string | null>(null)
  const [studentChoice, setStudentChoice] = useState('')
  const [relationship, setRelationship] = useState('child')
  const [notice, setNotice] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)

  const parentFilters = useMemo(
    () => ({ role: 'parent', status: 'active', q: parentKeyword.trim() }),
    [parentKeyword],
  )
  const studentFilters = useMemo(
    () => ({ role: 'student', status: 'active', q: studentKeyword.trim() }),
    [studentKeyword],
  )
  const parents = useAdminAccountsQuery(parentFilters)
  const students = useAdminAccountsQuery(studentFilters)
  const assignment = useAssignParentLinkMutation()

  const parentRows = parents.data?.items ?? []
  const studentRows = students.data?.items ?? []
  const selectedParent = parentChoice ?? parentId
  const ready = Boolean(selectedParent && studentChoice && relationship.trim())

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ready || assignment.isPending) return
    setNotice(null)
    setFailure(null)
    assignment.mutate(
      {
        parentId: selectedParent,
        studentId: studentChoice,
        relationship: relationship.trim(),
      },
      {
        onSuccess: () => {
          setNotice(
            t('parentLinks.assigned', {
              student: accountLabel(studentRows, studentChoice),
              parent: accountLabel(parentRows, selectedParent),
            }),
          )
          setStudentChoice('')
          // The child list on this page is a different query; without this it
          // keeps showing the parent as having no children right under a line
          // saying the link was made.
          void queryClient.invalidateQueries({ queryKey: adminQueryKeys.accountOperations(selectedParent) })
        },
        onError: (error) => setFailure(linkRefusal(error, t)),
      },
    )
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-base">{t('parentLinks.title')}</CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">{t('parentLinks.description')}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
          <AccountPicker
            idPrefix="parent-link-parent"
            label={t('parentLinks.parentLabel')}
            filterLabel={t('parentLinks.filterLabel')}
            placeholder={t('parentLinks.choose')}
            keyword={parentKeyword}
            onKeyword={setParentKeyword}
            value={selectedParent}
            onValue={setParentChoice}
            rows={parentRows}
            loading={parents.isLoading}
            failed={parents.isError}
            emptyLabel={t('parentLinks.noParents')}
            loadingLabel={t('parentLinks.loading')}
            failedLabel={t('parentLinks.loadFailed')}
          />
          <AccountPicker
            idPrefix="parent-link-student"
            label={t('parentLinks.studentLabel')}
            filterLabel={t('parentLinks.filterLabel')}
            placeholder={t('parentLinks.choose')}
            keyword={studentKeyword}
            onKeyword={setStudentKeyword}
            value={studentChoice}
            onValue={setStudentChoice}
            rows={studentRows}
            loading={students.isLoading}
            failed={students.isError}
            emptyLabel={t('parentLinks.noStudents')}
            loadingLabel={t('parentLinks.loading')}
            failedLabel={t('parentLinks.loadFailed')}
          />

          <label className="space-y-2 text-sm font-medium text-foreground" htmlFor="parent-link-relationship">
            {t('parentLinks.relationshipLabel')}
            <Input
              id="parent-link-relationship"
              value={relationship}
              onChange={(event) => setRelationship(event.target.value)}
            />
            <span className="block text-xs font-normal text-muted-foreground">
              {t('parentLinks.relationshipHint')}
            </span>
          </label>

          <div className="flex items-end">
            <Button type="submit" disabled={!ready || assignment.isPending} title={t('parentLinks.submitExplainer')}>
              <Link2 className="mr-2 h-4 w-4" aria-hidden="true" />
              {t('parentLinks.submit')}
            </Button>
          </div>
        </form>

        {notice && (
          <p className="mt-4 text-sm text-foreground" role="status" data-testid="parent-link-notice">
            {notice}
          </p>
        )}
        {failure && (
          <p className="mt-4 text-sm text-destructive" role="alert" data-testid="parent-link-error">
            {failure}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function AccountPicker({
  idPrefix,
  label,
  filterLabel,
  placeholder,
  keyword,
  onKeyword,
  value,
  onValue,
  rows,
  loading,
  failed,
  emptyLabel,
  loadingLabel,
  failedLabel,
}: {
  idPrefix: string
  label: string
  filterLabel: string
  placeholder: string
  keyword: string
  onKeyword: (value: string) => void
  value: string
  onValue: (value: string) => void
  rows: AccountRow[]
  loading: boolean
  failed: boolean
  emptyLabel: string
  loadingLabel: string
  failedLabel: string
}) {
  // A value the list no longer carries would silently blank the select, so the
  // account the console was opened with keeps its own option until it arrives.
  const options = rows.some((row) => row.userId === value) || !value
    ? rows
    : [...rows, { userId: value, accountNumber: '', name: value } as AccountRow]

  return (
    <div className="space-y-2">
      <label className="block space-y-2 text-sm font-medium text-foreground" htmlFor={`${idPrefix}-select`}>
        {label}
        <select
          id={`${idPrefix}-select`}
          className="h-10 w-full rounded-md border border-border/90 bg-card/75 px-2 text-sm"
          value={value}
          onChange={(event) => onValue(event.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((row) => (
            <option key={row.userId} value={row.userId}>
              {accountOptionLabel(row)}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-2 text-xs font-normal text-muted-foreground" htmlFor={`${idPrefix}-filter`}>
        {filterLabel}
        <Input id={`${idPrefix}-filter`} value={keyword} onChange={(event) => onKeyword(event.target.value)} />
      </label>
      {loading && <p className="text-xs text-muted-foreground">{loadingLabel}</p>}
      {failed && (
        <p className="text-xs text-destructive" role="alert">
          {failedLabel}
        </p>
      )}
      {!loading && !failed && rows.length === 0 && (
        <p className="text-xs text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  )
}

function accountOptionLabel(row: AccountRow) {
  return [row.name || row.email || row.userId, row.accountNumber].filter(Boolean).join(' · ')
}

function accountLabel(rows: AccountRow[], userId: string) {
  const row = rows.find((item) => item.userId === userId)
  return row ? accountOptionLabel(row) : userId
}

/**
 * Say which rule refused the link.
 *
 * The route answers with a stable code in `detail.code` and no prose a person
 * could read. Since the user-facing error path only promotes an issue that
 * carries a code it can translate, a code without a phrase here degrades to
 * the caller's fallback - which tells an administrator nothing about whether
 * they picked a suspended account or one that is already linked.
 */
function linkRefusal(error: unknown, t: (key: string, options?: Record<string, unknown>) => string) {
  const fallback = t('parentLinks.failed')
  const code = error instanceof ApiError ? error.code : undefined
  if (!code) return toUserFacingError(error, fallback)
  return t(`accounts.errors.${code}`, { defaultValue: toUserFacingError(error, fallback) })
}

function BillingRecoveryDetail({
  data,
  rechecking,
  recheckError,
  onRecheck,
}: {
  data: AdminBillingOperationDetail
  rechecking: boolean
  recheckError: Error | null
  onRecheck: () => void
}) {
  const { t } = useTranslation('admin')
  const reconciliation = data.reconciliation
  const supportNeeded = reconciliation.lifecycleState === 'support_needed'
  const active = reconciliation.lifecycleState === 'active'
  const effectivePlan = active && Object.keys(data.grantVersion).length > 0
    ? formatStatus(data.targetPlan)
    : t('accountOperations.recovery.pendingConvergence')

  return (
    <section className="space-y-4" aria-labelledby="billing-recovery-title">
      <Card className="brand-rule">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="brand-section-kicker">{t('accountOperations.recovery.kicker')}</p>
              <CardTitle id="billing-recovery-title" className="mt-2 text-xl">
                {t('accountOperations.recovery.title')}
              </CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('accountOperations.recovery.description')}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={rechecking}
              onClick={onRecheck}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${rechecking ? 'animate-spin' : ''}`} aria-hidden="true" />
              {rechecking ? t('accountOperations.recovery.rechecking') : t('accountOperations.recovery.recheck')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div
            className={`rounded-md border p-4 ${
              supportNeeded
                ? 'border-amber-300 bg-amber-50 text-amber-900'
                : active
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  : 'border-border bg-muted/40 text-foreground'
            }`}
            role="status"
          >
            <p className="font-semibold">
              {active
                ? t('accountOperations.recovery.active')
                : supportNeeded
                  ? t('accountOperations.recovery.supportNeeded', { code: formatStatus(reconciliation.failureCode) })
                  : t('accountOperations.recovery.state', { state: formatStatus(reconciliation.lifecycleState) })}
            </p>
            <p className="mt-1 text-sm">
              {t('accountOperations.recovery.safeAction', {
                action: formatStatus(reconciliation.safeAction),
                generation: reconciliation.reconciliationLeaseGeneration,
              })}
            </p>
          </div>

          {recheckError && <BillingRecoveryError error={recheckError} operation="recheck" />}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DetailItem label={t('accountOperations.recovery.parent')} value={data.parentId} />
            <DetailItem label={t('accountOperations.recovery.targetPlan')} value={formatStatus(data.targetPlan)} />
            <DetailItem label={t('accountOperations.recovery.effectivePlan')} value={effectivePlan} />
            <DetailItem
              label={t('accountOperations.recovery.sessionSuffix')}
              value={reconciliation.providerSessionSuffix ? `…${reconciliation.providerSessionSuffix}` : t('accountOperations.recovery.noSession')}
            />
            <DetailItem label={t('accountOperations.recovery.commandState')} value={formatStatus(data.commandLifecycle.state)} />
            <DetailItem label={t('accountOperations.recovery.providerEffect')} value={formatStatus(data.commandLifecycle.providerEffectStatus)} />
            <DetailItem label={t('accountOperations.recovery.created')} value={formatDate(data.commandLifecycle.createdAt)} />
            <DetailItem label={t('accountOperations.recovery.updated')} value={formatDate(data.commandLifecycle.updatedAt)} />
            <DetailItem label={t('accountOperations.recovery.lastRechecked')} value={formatDate(reconciliation.lastRecheckedAt)} />
            <DetailItem label={t('accountOperations.recovery.failureCode')} value={formatStatus(reconciliation.failureCode)} />
          </div>

          <div>
            <h3 className="text-base font-semibold text-foreground">{t('accountOperations.recovery.beneficiaries')}</h3>
            <div className="mt-3 grid gap-3">
              {data.beneficiaryIds.map((beneficiaryId) => (
                <div key={beneficiaryId} className="grid gap-2 rounded-md border border-border/70 p-3 sm:grid-cols-3">
                  <p className="font-medium text-foreground">{beneficiaryId}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('accountOperations.recovery.grantVersion', {
                      version: data.grantVersion[beneficiaryId] ?? t('accountOperations.values.pending'),
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('accountOperations.recovery.allowanceVersion', {
                      version: data.allowanceVersion[beneficiaryId] ?? t('accountOperations.values.pending'),
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <BillingFactEvidence data={data} />
          <ProviderUsageEvidence data={data} />
          <PaymentReminderEvidence data={data} />
        </CardContent>
      </Card>
    </section>
  )
}

function BillingFactEvidence({ data }: { data: AdminBillingOperationDetail }) {
  const { t } = useTranslation('admin')
  return (
    <div>
      <h3 className="text-base font-semibold text-foreground">{t('accountOperations.recovery.facts.title')}</h3>
      {data.factLifecycle.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{t('accountOperations.recovery.facts.empty')}</p>
      ) : (
        <div className="mt-3 grid gap-3">
          {data.factLifecycle.map((fact) => (
            <div key={`${fact.kind}-${fact.factVersion}`} className="rounded-md border border-border/70 p-3 text-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-medium text-foreground">{formatStatus(fact.kind)}</p>
                <p className="text-muted-foreground">{formatDate(fact.observedAt)}</p>
              </div>
              <div className="mt-2 grid gap-1 text-muted-foreground lg:grid-cols-2">
                <p>{t('accountOperations.recovery.facts.version', { version: fact.factVersion })}</p>
                <p>{t('accountOperations.recovery.facts.signed')}</p>
                <p className="break-all">{t('accountOperations.recovery.facts.eventDigest', { digest: fact.providerEventIdDigest })}</p>
                <p className="break-all">{t('accountOperations.recovery.facts.objectDigest', { digest: fact.providerObjectIdDigest })}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProviderUsageEvidence({ data }: { data: AdminBillingOperationDetail }) {
  const { t } = useTranslation('admin')
  const formatCount = (value: number) => new Intl.NumberFormat(activeLanguage()).format(value)
  return (
    <div>
      <h3 className="text-base font-semibold text-foreground">{t('accountOperations.recovery.providerUsage.title')}</h3>
      {data.providerUsageEvidence.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{t('accountOperations.recovery.providerUsage.empty')}</p>
      ) : (
        <div className="mt-3 grid gap-3">
          {data.providerUsageEvidence.map((evidence) => (
            <div
              key={`${evidence.beneficiaryId}-${evidence.correlationDigest}`}
              className="rounded-md border border-border/70 p-3 text-sm"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-medium text-foreground">{evidence.beneficiaryId}</p>
                <p className="text-muted-foreground">{formatDate(evidence.observedAt)}</p>
              </div>
              <p className="mt-2 font-medium text-foreground">
                {t('accountOperations.recovery.providerUsage.tokens', {
                  input: formatCount(evidence.inputTokens),
                  output: formatCount(evidence.outputTokens),
                })}
              </p>
              <div className="mt-2 grid gap-1 break-all text-muted-foreground">
                <p>{t('accountOperations.recovery.providerUsage.modelDigest', { digest: evidence.modelIdDigest })}</p>
                <p>{t('accountOperations.recovery.providerUsage.requestDigest', { digest: evidence.providerRequestIdDigest })}</p>
                <p>{t('accountOperations.recovery.providerUsage.correlationDigest', { digest: evidence.correlationDigest })}</p>
                <p>
                  {t('accountOperations.recovery.providerUsage.costRetained', {
                    value: evidence.providerCostRetained ? t('accountOperations.values.yes') : t('accountOperations.values.no'),
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PaymentReminderEvidence({ data }: { data: AdminBillingOperationDetail }) {
  const { t } = useTranslation('admin')
  const reminder = data.paymentReminder
  return (
    <div>
      <h3 className="text-base font-semibold text-foreground">{t('accountOperations.recovery.reminder.title')}</h3>
      {reminder ? (
        <div className="mt-3 grid gap-3 rounded-md border border-border/70 p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <p className="font-medium text-foreground">
            {t('accountOperations.recovery.reminder.card', { brand: formatStatus(reminder.brand), last4: reminder.last4 })}
          </p>
          <p className="text-muted-foreground">
            {t('accountOperations.recovery.reminder.expires', {
              month: String(reminder.expiryMonth).padStart(2, '0'),
              year: reminder.expiryYear,
            })}
          </p>
          <p className="text-muted-foreground">
            {t('accountOperations.recovery.reminder.status', { status: formatStatus(reminder.status) })}
          </p>
          <p className="text-muted-foreground">{formatDate(reminder.reminderAt)}</p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{t('accountOperations.recovery.reminder.empty')}</p>
      )}
    </div>
  )
}

function BillingRecoveryLoading() {
  const { t } = useTranslation('admin')
  return (
    <Card aria-busy="true" aria-label={t('accountOperations.recovery.loading')}>
      <CardContent className="space-y-3 p-5">
        <div className="h-4 w-48 rounded bg-muted" />
        <div className="h-4 w-full max-w-2xl rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
      </CardContent>
    </Card>
  )
}

function BillingRecoveryError({
  error,
  operation,
}: {
  error: Error | null
  operation: 'read' | 'recheck'
}) {
  const { t } = useTranslation('admin')
  const status = error instanceof ApiError ? error.status : undefined
  let message = operation === 'recheck'
    ? t('accountOperations.recovery.errors.recheck')
    : t('accountOperations.recovery.errors.read')

  if (status === 403) {
    message = t('accountOperations.recovery.errors.denied')
  } else if (status === 409 || status === 423 || status === 429) {
    message = t('accountOperations.recovery.errors.inProgress')
  } else if (status === 503) {
    message = t('accountOperations.recovery.errors.providerUnavailable')
  } else if (status === 404) {
    message = t('accountOperations.recovery.errors.notFound')
  }

  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive" role="alert">
      {message}
    </div>
  )
}

function AdminAccountOperationsDetail({ data }: { data: AdminAccountOperations }) {
  const { t } = useTranslation('admin')
  const state = data.supportState.state
  const Icon = state === 'blocked' ? ShieldAlert : state === 'attention' ? AlertTriangle : CheckCircle2
  const issues = [...data.supportState.blockers, ...data.supportState.warnings]

  return (
    <>
      <section className={`rounded-lg border p-5 ${supportStateTone(state)}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <Icon className="mt-1 h-6 w-6 shrink-0" aria-hidden="true" />
            <div>
              <p className="brand-section-kicker">{t('accountOperations.support.kicker')}</p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">{formatStatus(state)}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {state === 'ready'
                  ? t('accountOperations.support.ready')
                  : t('accountOperations.support.review')}
              </p>
            </div>
          </div>
          <Badge variant={state === 'ready' ? 'secondary' : 'outline'}>{data.parentId}</Badge>
        </div>
        {issues.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {issues.map((issue) => (
              <Badge key={issue} variant={data.supportState.blockers.includes(issue) ? 'destructive' : 'outline'}>
                {describeIssueCode(issue, t)}
              </Badge>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-4">
        <FactCard title={t('accountOperations.facts.parentVerification')} value={formatStatus(data.parent.verification?.emailVerificationStatus)} detail={`${data.parent.name} / ${data.parent.email}`} />
        <FactCard title={t('accountOperations.facts.billing')} value={formatStatus(data.billing.status)} detail={t('accountOperations.facts.plan', { plan: formatStatus(data.billing.subscriptionTier) })} />
        <FactCard title={t('accountOperations.facts.children')} value={String(data.children.length)} detail={t('accountOperations.facts.linkedChildren', { count: data.children.length })} />
        <FactCard title={t('accountOperations.facts.usageRows')} value={String(data.usage.length)} detail={data.usage.some((item) => item.unreconciled) ? t('accountOperations.facts.reconciliationPending') : t('accountOperations.facts.usageMatched')} />
      </div>

      <VerificationRecoveryEvidence parent={data.parent} children={data.children} admin />

      <BillingEvidence data={data} />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">{t('accountOperations.children.title')}</h2>
        {data.children.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground">{t('accountOperations.children.empty')}</CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {data.children.map((child) => (
              <ChildOperationsRow key={child.studentId} child={child} />
            ))}
          </div>
        )}
      </section>

      <UsageSummary usage={data.usage} />
    </>
  )
}

function BillingEvidence({ data }: { data: AdminAccountOperations }) {
  const { t } = useTranslation('admin')
  const billing = data.billing
  const events = billing.events ?? []
  const supportEvidence = billing.supportEvidence
  return (
    <Card className="brand-rule">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">{t('accountOperations.billing.title')}</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('accountOperations.billing.description')}
            </p>
          </div>
          <Badge variant={billing.status === 'active' ? 'secondary' : 'outline'}>{formatStatus(billing.mode)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(24rem,1.05fr)]">
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailItem label={t('accountOperations.billing.provider')} value={billing.provider ?? t('accountOperations.billing.manual')} />
          <DetailItem label={t('accountOperations.billing.requestedTier')} value={formatStatus(billing.requestedTier)} />
          <DetailItem label={t('accountOperations.billing.currentPeriod')} value={formatPeriod(billing.currentPeriodStart, billing.currentPeriodEnd, formatDate, t)} />
          <DetailItem label={t('accountOperations.billing.lastEvent')} value={billing.lastProviderEventType ? formatStatus(billing.lastProviderEventType) : t('accountOperations.values.none')} />
          <DetailItem label={t('accountOperations.billing.manualOverride')} value={billing.manualOverrideSource ?? t('accountOperations.values.none')} />
          <DetailItem label={t('accountOperations.billing.cancelAtPeriodEnd')} value={billing.cancelAtPeriodEnd ? t('accountOperations.values.yes') : t('accountOperations.values.no')} />
          {supportEvidence && <DetailItem label={t('accountOperations.billing.supportAction')} value={evidenceValue(supportEvidence, 'dunning', 'supportAction', t)} />}
          {supportEvidence && <DetailItem label={t('accountOperations.billing.duplicateEvents')} value={evidenceValue(supportEvidence, 'reconciliation', 'duplicateEvents', t)} />}
          {supportEvidence && <DetailItem label={t('accountOperations.billing.staleIgnored')} value={evidenceValue(supportEvidence, 'reconciliation', 'staleIgnoredEvents', t)} />}
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">{t('accountOperations.billing.recentEvents')}</p>
          {events.length === 0 && <p className="text-sm text-muted-foreground">{t('accountOperations.billing.noEvents')}</p>}
          {events.slice(0, 5).map((event) => (
            <BillingEventRow key={event.eventId} event={event} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ChildOperationsRow({ child }: { child: AccountOperationsChild }) {
  const { t } = useTranslation('admin')
  const usage = child.usage
  const usageLabel = usage
    ? t('accountOperations.children.usageUsed', { consumed: usage.consumed, limit: usage.limit })
    : t('accountOperations.children.usageUnavailable')
  return (
    <Card>
      <CardContent className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1.1fr)_repeat(5,minmax(8rem,0.7fr))]">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-primary">
            <UserRound className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{child.profile.name || child.profile.email}</p>
            <p className="truncate text-sm text-muted-foreground">{child.profile.email}</p>
          </div>
        </div>
        <ChildMetric label={t('accountOperations.children.binding')} value={formatStatus(child.binding.status)} />
        <ChildMetric label={t('accountOperations.children.verification')} value={formatStatus(child.profile.verification?.emailVerificationStatus ?? child.verification?.emailVerificationStatus)} />
        <ChildMetric label={t('accountOperations.children.recovery')} value={formatStatus((child.profile.verification ?? child.verification)?.supportAction)} />
        <ChildMetric label={t('accountOperations.children.plan')} value={formatStatus(child.entitlement?.effectivePlan)} />
        <ChildMetric label={t('accountOperations.children.usage')} value={usageLabel} muted={Boolean(usage?.unreconciled)} />
      </CardContent>
    </Card>
  )
}

function UsageSummary({ usage }: { usage: AccountOperationsUsage[] }) {
  const { t } = useTranslation('admin')
  if (usage.length === 0) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">{t('accountOperations.usage.empty')}</CardContent>
      </Card>
    )
  }
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">{t('accountOperations.usage.title')}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {usage.map((item) => (
          <Card key={`${item.studentId}-${item.quotaPeriod}-${item.action}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{formatStatus(item.action)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.studentId} / {item.quotaPeriod}</p>
                </div>
                <Badge variant={item.unreconciled ? 'outline' : 'secondary'}>
                  {item.unreconciled ? t('accountOperations.usage.reconciling') : t('accountOperations.usage.matched')}
                </Badge>
              </div>
              <p className="mt-4 text-2xl font-semibold text-foreground">
                {t('accountOperations.usage.remaining', { count: item.remaining })}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('accountOperations.usage.consumed', { consumed: item.consumed, limit: item.limit })}
              </p>
              {item.supportAction && (
                <p className="mt-3 text-sm font-medium text-foreground">
                  {t('accountOperations.usage.support', { action: formatStatus(item.supportAction) })}
                </p>
              )}
              {item.explanation && (
                <p className="mt-1 text-sm text-muted-foreground">{item.explanation}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function FactCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-background/80 p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function ChildMetric({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-md border border-border/70 bg-background/80 p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${muted ? 'text-amber-700' : 'text-foreground'}`}>{value}</p>
    </div>
  )
}

function BillingEventRow({ event }: { event: SubscriptionBillingEvent }) {
  const { t } = useTranslation('admin')
  return (
    <div className="rounded-md border border-border/70 p-3 text-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-medium text-foreground">{formatStatus(event.eventType)}</span>
        <span className="text-muted-foreground">{formatDate(event.eventAt)}</span>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <p className="text-muted-foreground">
          {t('accountOperations.billing.eventStatus', { status: formatStatus(event.billingStatus) })}
        </p>
        <p className="truncate text-muted-foreground">
          {t('accountOperations.billing.providerEvent', { id: event.providerEventId ?? t('accountOperations.values.none') })}
        </p>
        <p className="text-muted-foreground">
          {t('accountOperations.billing.processing', { result: formatStatus(event.processingResult) })}
        </p>
      </div>
    </div>
  )
}

function EmptyLookup() {
  const { t } = useTranslation('admin')
  return (
    <Card>
      <CardContent className="p-5 text-sm text-muted-foreground">
        {t('accountOperations.lookup.empty')}
      </CardContent>
    </Card>
  )
}

function LoadingPanel() {
  return (
    <Card aria-busy="true">
      <CardContent className="space-y-3 p-5">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="h-4 w-full max-w-xl rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
      </CardContent>
    </Card>
  )
}

function ErrorPanel({ error }: { error: Error | null }) {
  const { t } = useTranslation('admin')
  const isMissingParent = error instanceof ApiError && error.status === 404
  return (
    <Card>
      <CardContent className="p-5 text-sm text-destructive" role="alert">
        {isMissingParent ? t('accountOperations.lookup.notFound') : t('accountOperations.lookup.unavailable')}
      </CardContent>
    </Card>
  )
}

function formatPeriod(
  start: string | null | undefined,
  end: string | null | undefined,
  formatDate: (value: string) => string,
  t: TFunction,
) {
  if (!start && !end) return t('accountOperations.values.none')
  const unknown = t('accountOperations.values.unknown')
  return `${start ? formatDate(start) : unknown} - ${end ? formatDate(end) : unknown}`
}

function evidenceValue(evidence: Record<string, unknown>, section: string, field: string, t: TFunction) {
  const sectionValue = evidence[section]
  if (!sectionValue || typeof sectionValue !== 'object') return t('accountOperations.values.none')
  return formatEvidenceValue((sectionValue as Record<string, unknown>)[field], t)
}

function formatEvidenceValue(value: unknown, t: TFunction) {
  if (value === null || value === undefined || value === '') return t('accountOperations.values.none')
  if (typeof value === 'boolean') return value ? t('accountOperations.values.yes') : t('accountOperations.values.no')
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return formatStatus(value)
  return t('accountOperations.values.available')
}

/** The shared day-and-time format; a value that is not a date shows as sent. */
function formatDate(value: string) {
  return Number.isNaN(new Date(value).getTime()) ? value : formatDayAndTime(value)
}
