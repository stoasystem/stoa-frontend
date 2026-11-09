import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useExtendUsagePeriodMutation,
  useReloadUsagePeriod,
  useSetUsagePeriodEndMutation,
  useUsagePeriodQuery,
} from '@/hooks/admin/useAdminUsagePeriods'
import { formatDate, formatDateTime } from '@/lib/formatDateTime'
import { toUserFacingError } from '@/lib/userFacingText'
import { accountLabel } from '@/pages/admin/AccountActionDialog'
import { BlockedReason } from '@/pages/admin/AccountFormFields'
import {
  type ExtensionDraft,
  MAX_EXTENSION_AMOUNT,
  daysBetween,
  endChangeEffect,
  endChangeIssues,
  extendedEnd,
  extensionAmount,
  extensionIssues,
  zurichToday,
} from '@/pages/admin/usagePeriodRules'
import { ApiError } from '@/services/api/httpClient'
import type { AccountRow } from '@/services/admin/accountsApi'
import type {
  UsagePeriodRecord,
  UsagePeriodSource,
  UsagePeriodState,
  UsagePeriodUnit,
} from '@/services/admin/usagePeriodApi'

const VERSION_CONFLICT = 'usage_period_version_conflict'

const EMPTY_EXTENSION: ExtensionDraft = {
  unit: 'months',
  amount: '',
  source: 'paid',
  paymentReference: '',
  note: '',
}

const STATE_VARIANT: Record<UsagePeriodState, 'secondary' | 'destructive' | 'outline'> = {
  active: 'secondary',
  expired: 'destructive',
  none: 'outline',
}

export function UsagePeriodStateBadge({ state }: { state: UsagePeriodState }) {
  const { t } = useTranslation('admin')
  return <Badge variant={STATE_VARIANT[state]}>{t(`usagePeriod.state.${state}`)}</Badge>
}

/** A Zurich day as the reader's language writes it, or a dash. */
export function periodDay(day: string | null | undefined) {
  return day ? formatDate(day) : '—'
}

/**
 * One student's or parent's usage period (#614): the end date and its state,
 * for a student the period actually in force and whose it is, the two ways to
 * change it, and every change made so far.
 *
 * Both writes send the version the panel read. When somebody else wrote in
 * between, the server refuses (`usage_period_version_conflict`); the panel
 * says so, reads the account again and keeps what was typed for another try.
 */
export function UsagePeriodPanel({
  userId,
  accounts = [],
}: {
  userId: string
  /** Rows to name the people the records and the period in force refer to. */
  accounts?: readonly AccountRow[]
}) {
  const { t } = useTranslation('admin')
  const periodQuery = useUsagePeriodQuery(userId)
  const extendMutation = useExtendUsagePeriodMutation()
  const setMutation = useSetUsagePeriodEndMutation()
  const reload = useReloadUsagePeriod()
  const formId = useId()

  const [extension, setExtension] = useState<ExtensionDraft>(EMPTY_EXTENSION)
  const [extensionTouched, setExtensionTouched] = useState(false)
  const [endDraft, setEndDraft] = useState({ endsOn: '', reason: '' })
  const [endTouched, setEndTouched] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [refusal, setRefusal] = useState<string | null>(null)

  const period = periodQuery.data
  const today = zurichToday()

  function nameOf(id: string | null | undefined) {
    if (!id) return '—'
    const row = accounts.find((item) => item.userId === id)
    return row ? accountLabel(row) : id
  }

  function refusalText(error: unknown, fallback: string) {
    const code = error instanceof ApiError ? error.code : undefined
    if (code === VERSION_CONFLICT) return t('usagePeriod.versionConflict')
    if (!code) return toUserFacingError(error, fallback)
    return t(`accounts.errors.${code}`, { defaultValue: toUserFacingError(error, fallback) })
  }

  function refused(error: unknown, fallback: string) {
    setNotice(null)
    setRefusal(refusalText(error, fallback))
    if (error instanceof ApiError && error.code === VERSION_CONFLICT) {
      setConfirming(false)
      void reload(userId)
    }
  }

  if (periodQuery.isPending) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {t('usagePeriod.loading')}
      </p>
    )
  }
  if (!period) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {refusalText(periodQuery.error, t('usagePeriod.loadFailed'))}
      </p>
    )
  }

  // Writes wait for the read a previous write started, so they carry its version.
  const writing = extendMutation.isPending || setMutation.isPending || periodQuery.isFetching
  const isParent = period.role === 'parent'

  // ---- extend ---------------------------------------------------------------
  const issues = extensionIssues(extension)
  const amount = extensionAmount(extension)
  const preview =
    amount === null || extension.source === 'paid' && extension.unit !== 'months'
      ? null
      : extendedEnd(period.endsOn, today, extension.unit, amount)
  const countsFrom = period.endsOn !== null && period.endsOn > today ? period.endsOn : today
  const extensionReasons = extensionTouched ? issues.map((issue) => t(`usagePeriod.extensionIssues.${issue}`)) : []

  function changeExtension(patch: Partial<ExtensionDraft>) {
    setExtension((current) => {
      const next = { ...current, ...patch }
      // A paid extension is counted in months; switching to paid takes days away.
      if (next.source === 'paid') next.unit = 'months'
      return next
    })
  }

  function extend() {
    setExtensionTouched(true)
    if (issues.length > 0 || amount === null || writing || !period) return
    setRefusal(null)
    setNotice(null)
    extendMutation.mutate(
      {
        userId,
        unit: extension.unit,
        amount,
        source: extension.source,
        paymentReference: extension.paymentReference.trim(),
        note: extension.note.trim(),
        expectedVersion: period.version,
      },
      {
        onSuccess: (result) => {
          setExtension(EMPTY_EXTENSION)
          setExtensionTouched(false)
          setNotice(t('usagePeriod.extended', { date: periodDay(result.endsOn) }))
        },
        onError: (error) => refused(error, t('usagePeriod.extendFailed')),
      },
    )
  }

  // ---- change the end date --------------------------------------------------
  const endIssues = endChangeIssues(endDraft, period.endsOn)
  const endReasons = endTouched ? endIssues.map((issue) => t(`usagePeriod.endIssues.${issue}`)) : []
  const effect = endIssues.includes('date') ? 'none' : endChangeEffect(period.endsOn, endDraft.endsOn, today)

  function askToConfirm() {
    setEndTouched(true)
    if (endIssues.length > 0) return
    setRefusal(null)
    setNotice(null)
    setConfirming(true)
  }

  function changeEnd() {
    if (endIssues.length > 0 || writing || !period) return
    setMutation.mutate(
      { userId, endsOn: endDraft.endsOn, reason: endDraft.reason.trim(), expectedVersion: period.version },
      {
        onSuccess: (result) => {
          setEndDraft({ endsOn: '', reason: '' })
          setEndTouched(false)
          setConfirming(false)
          setNotice(t('usagePeriod.endChanged', { date: periodDay(result.endsOn) }))
        },
        onError: (error) => refused(error, t('usagePeriod.endChangeFailed')),
      },
    )
  }

  const daysLeft = period.endsOn && period.state === 'active' ? daysBetween(today, period.endsOn) : null

  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby={`${formId}-own`} className="flex flex-col gap-1">
        <h3 id={`${formId}-own`} className="text-sm font-semibold">
          {t('usagePeriod.ownTitle')}
        </h3>
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span>{t('usagePeriod.endsOn', { date: periodDay(period.endsOn) })}</span>
          <UsagePeriodStateBadge state={period.state} />
          {daysLeft !== null ? (
            <span className="text-muted-foreground">{t('usagePeriod.daysLeft', { count: daysLeft })}</span>
          ) : null}
        </p>
        {isParent ? <p className="text-xs text-muted-foreground">{t('usagePeriod.parentCovers')}</p> : null}
        {period.effective ? (
          <p className="flex flex-wrap items-center gap-2 text-sm" data-testid="usage-period-effective">
            <span>{t('usagePeriod.effective', { date: periodDay(period.effective.endsOn) })}</span>
            <UsagePeriodStateBadge state={period.effective.state} />
            {period.effective.paidBy === 'parent' ? (
              <span>{t('usagePeriod.fromParent', { parent: nameOf(period.effective.parentId) })}</span>
            ) : period.effective.paidBy === 'self' ? (
              <span>{t('usagePeriod.fromSelf')}</span>
            ) : null}
          </p>
        ) : null}
      </section>

      {/* Always mounted: a live region that appears with its text is not announced. */}
      <p role="status" className={notice ? 'text-sm' : 'sr-only'}>
        {notice}
      </p>
      {refusal ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-sm text-destructive">
          {refusal}
        </p>
      ) : null}
      {periodQuery.isRefetchError ? (
        <p role="alert" className="text-sm text-destructive">
          {t('usagePeriod.refreshFailed')}
        </p>
      ) : null}

      <section aria-labelledby={`${formId}-extend`} className="flex flex-col gap-2 rounded-md border p-3">
        <h3 id={`${formId}-extend`} className="text-sm font-semibold">
          {t('usagePeriod.extendTitle')}
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            {t('usagePeriod.sourceLabel')}
            <select
              className="h-9 rounded-md border px-2"
              value={extension.source}
              onChange={(event) => changeExtension({ source: event.target.value as UsagePeriodSource })}
            >
              <option value="paid">{t('usagePeriod.source.paid')}</option>
              <option value="gifted">{t('usagePeriod.source.gifted')}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('usagePeriod.amountLabel')}
            <Input
              className="w-24"
              inputMode="numeric"
              value={extension.amount}
              onChange={(event) => changeExtension({ amount: event.target.value })}
              onBlur={() => setExtensionTouched(true)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('usagePeriod.unitLabel')}
            <select
              className="h-9 rounded-md border px-2"
              value={extension.unit}
              onChange={(event) => changeExtension({ unit: event.target.value as UsagePeriodUnit })}
            >
              <option value="months">{t('usagePeriod.unit.months')}</option>
              <option value="days" disabled={extension.source === 'paid'}>
                {t('usagePeriod.unit.days')}
              </option>
            </select>
          </label>
          {extension.source === 'paid' ? (
            <label className="flex flex-col gap-1 text-sm">
              {t('usagePeriod.paymentReferenceLabel')}
              <Input
                className="w-72"
                value={extension.paymentReference}
                aria-required
                onChange={(event) => changeExtension({ paymentReference: event.target.value })}
                onBlur={() => setExtensionTouched(true)}
              />
            </label>
          ) : null}
          <label className="flex flex-col gap-1 text-sm">
            {t('usagePeriod.noteLabel')}
            <Input
              className="w-72"
              value={extension.note}
              onChange={(event) => changeExtension({ note: event.target.value })}
            />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          {extension.source === 'paid' ? t('usagePeriod.paidHint') : t('usagePeriod.giftedHint', { max: MAX_EXTENSION_AMOUNT })}
        </p>
        <p className="text-sm" data-testid="usage-period-preview">
          {preview
            ? t('usagePeriod.preview', { date: periodDay(preview), from: periodDay(countsFrom) })
            : t('usagePeriod.previewEmpty', { from: periodDay(countsFrom) })}
        </p>
        <BlockedReason id={`${formId}-extend-blocked`} reasons={extensionReasons} />
        <div>
          <Button
            type="button"
            onClick={extend}
            disabled={writing || (extensionTouched && issues.length > 0)}
            aria-describedby={extensionReasons.length > 0 ? `${formId}-extend-blocked` : undefined}
          >
            {t('usagePeriod.extendSubmit')}
          </Button>
        </div>
      </section>

      <section aria-labelledby={`${formId}-set`} className="flex flex-col gap-2 rounded-md border p-3">
        <h3 id={`${formId}-set`} className="text-sm font-semibold">
          {t('usagePeriod.setTitle')}
        </h3>
        <p className="text-xs text-muted-foreground">{t('usagePeriod.setHint')}</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            {t('usagePeriod.newEndLabel')}
            <Input
              type="date"
              value={endDraft.endsOn}
              disabled={confirming}
              onChange={(event) => setEndDraft((current) => ({ ...current, endsOn: event.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('usagePeriod.reasonLabel')}
            <Input
              className="w-72"
              value={endDraft.reason}
              aria-required
              disabled={confirming}
              onChange={(event) => setEndDraft((current) => ({ ...current, reason: event.target.value }))}
            />
          </label>
        </div>
        <BlockedReason id={`${formId}-set-blocked`} reasons={endReasons} />
        {confirming ? (
          <div role="group" aria-labelledby={`${formId}-confirm`} className="flex flex-col gap-2 rounded-md bg-muted/40 p-3 text-sm">
            <p id={`${formId}-confirm`} className="font-medium">
              {t('usagePeriod.confirmChange', { from: periodDay(period.endsOn), to: periodDay(endDraft.endsOn) })}
            </p>
            {effect === 'endsNow' ? (
              <p className="text-destructive">{t('usagePeriod.endsNowWarning')}</p>
            ) : effect === 'shortens' ? (
              <p className="text-destructive">
                {t('usagePeriod.shortensWarning', { count: daysBetween(endDraft.endsOn, period.endsOn ?? endDraft.endsOn) })}
              </p>
            ) : null}
            {effect !== 'none' && isParent ? <p className="text-destructive">{t('usagePeriod.parentWarning')}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={effect === 'none' ? 'default' : 'destructive'} onClick={changeEnd} disabled={writing}>
                {t('usagePeriod.confirmSubmit')}
              </Button>
              <Button type="button" variant="outline" onClick={() => setConfirming(false)} disabled={setMutation.isPending}>
                {t('usagePeriod.confirmBack')}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={askToConfirm}
              disabled={writing || (endTouched && endIssues.length > 0)}
              aria-describedby={endReasons.length > 0 ? `${formId}-set-blocked` : undefined}
            >
              {t('usagePeriod.setSubmit')}
            </Button>
          </div>
        )}
      </section>

      <section aria-labelledby={`${formId}-records`} className="flex flex-col gap-2">
        <h3 id={`${formId}-records`} className="text-sm font-semibold">
          {t('usagePeriod.recordsTitle')}
        </h3>
        {period.records.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('usagePeriod.noRecords')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="p-2">{t('usagePeriod.columnTime')}</th>
                  <th className="p-2">{t('usagePeriod.columnActor')}</th>
                  <th className="p-2">{t('usagePeriod.columnKind')}</th>
                  <th className="p-2">{t('usagePeriod.columnAmount')}</th>
                  <th className="p-2">{t('usagePeriod.columnEnds')}</th>
                  <th className="p-2">{t('usagePeriod.columnSource')}</th>
                  <th className="p-2">{t('usagePeriod.columnPayment')}</th>
                  <th className="p-2">{t('usagePeriod.columnNote')}</th>
                </tr>
              </thead>
              <tbody>
                {period.records.map((record) => (
                  <RecordRow key={record.recordId} record={record} actor={nameOf(record.actorId)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
        {periodQuery.hasNextPage ? (
          <div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={periodQuery.isFetchingNextPage}
              onClick={() => void periodQuery.fetchNextPage()}
            >
              {periodQuery.isFetchingNextPage ? t('usagePeriod.loadingMore') : t('usagePeriod.loadMore')}
            </Button>
          </div>
        ) : null}
        {periodQuery.isFetchNextPageError ? (
          <p role="alert" className="text-sm text-destructive">
            {t('usagePeriod.loadMoreFailed')}
          </p>
        ) : null}
      </section>
    </div>
  )
}

function RecordRow({ record, actor }: { record: UsagePeriodRecord; actor: string }) {
  const { t } = useTranslation('admin')
  const extension = record.kind === 'extend'
  return (
    <tr className="border-t align-top">
      <td className="p-2 whitespace-nowrap">{formatDateTime(record.recordedAt)}</td>
      <td className="p-2">{actor}</td>
      <td className="p-2">{t(`usagePeriod.kind.${record.kind}`)}</td>
      <td className="p-2 whitespace-nowrap">
        {extension && record.unit && record.amount !== null
          ? t(`usagePeriod.amount.${record.unit}`, { count: record.amount })
          : '—'}
      </td>
      <td className="p-2 whitespace-nowrap">
        {periodDay(record.previousEndsOn)} → {periodDay(record.newEndsOn)}
      </td>
      <td className="p-2">{record.source ? t(`usagePeriod.source.${record.source}`) : '—'}</td>
      <td className="p-2 break-words">{record.paymentReference || '—'}</td>
      <td className="p-2">{(extension ? record.note : record.reason) || '—'}</td>
    </tr>
  )
}
