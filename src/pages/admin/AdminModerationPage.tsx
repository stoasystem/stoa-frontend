import { useEffect, useId, useMemo, useState } from 'react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Check, CheckCircle2, Clock, Flag, MessageSquare, UserCheck } from 'lucide-react'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  useAddModerationCaseNoteMutation,
  useAdminModerationCaseQuery,
  useAdminModerationCasesQuery,
  useUpdateModerationCaseMutation,
} from '@/hooks/admin/useAdminModerationCases'
import { formatDayAndTime } from '@/lib/formatDateTime'
import { toUserFacingError } from '@/lib/userFacingText'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { ApiError } from '@/services/api/httpClient'
import type {
  ModerationCase,
  ModerationCaseStatus,
  ModerationReason,
  ModerationSeverity,
} from '@/services/admin/adminApi'

const statusOptions: (ModerationCaseStatus | '')[] = ['', 'open', 'in_review', 'actioned', 'dismissed', 'closed']
const severityOptions: (ModerationSeverity | '')[] = ['', 'low', 'medium', 'high']
const reasonOptions: (ModerationReason | '')[] = ['', 'incorrect_answer', 'unsafe_content', 'abuse', 'privacy', 'other']
const actionStatuses: ModerationCaseStatus[] = ['in_review', 'actioned', 'dismissed', 'closed']
const QUEUE_LIMIT = 50

export function AdminModerationPage() {
  const { t } = useTranslation('admin')
  const [status, setStatus] = useState<ModerationCaseStatus | ''>('')
  const [severity, setSeverity] = useState<ModerationSeverity | ''>('')
  const [reason, setReason] = useState<ModerationReason | ''>('')
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)

  const filters = useMemo(() => ({ status, severity, reason, limit: QUEUE_LIMIT }), [reason, severity, status])
  const casesQuery = useAdminModerationCasesQuery(filters)
  const cases = casesQuery.data?.items ?? []
  // The backend has no cursor or offset, and its `count` is the length of
  // this page. A full page means there may be more cases nobody can reach yet.
  const mayHaveMore = cases.length >= QUEUE_LIMIT

  useEffect(() => {
    if (selectedCaseId || cases.length === 0) return
    setSelectedCaseId(cases[0].case_id)
  }, [cases, selectedCaseId])

  const detailQuery = useAdminModerationCaseQuery(selectedCaseId)
  const selectedCase = detailQuery.data ?? cases.find((item) => item.case_id === selectedCaseId) ?? null

  // The writes and what became of them live here, not in the case's detail:
  // an admin who opens another case while one is on its way still learns how
  // it ended when they come back, and cannot start a second write meanwhile.
  const updateCase = useUpdateModerationCaseMutation()
  const addNote = useAddModerationCaseNoteMutation()
  const [feedback, setFeedback] = useState<CaseFeedback | null>(null)
  const writes: CaseWrites = {
    updateCase,
    addNote,
    busy: updateCase.isPending || addNote.isPending,
    setFeedback,
  }

  return (
    <DashboardLayout>
      <PageContainer size="wide" className="p-0">
        <PageHeader
          eyebrow={t('moderation.eyebrow')}
          title={t('moderation.title')}
          description={t('moderation.description')}
          actions={
            casesQuery.isSuccess && (
              <Badge variant="secondary">
                {mayHaveMore
                  ? t('moderation.caseCountMore', { count: cases.length })
                  : t('moderation.caseCount', { count: cases.length })}
              </Badge>
            )
          }
        />
        <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
          <section className="space-y-4">
            <ModerationFilters
              status={status}
              severity={severity}
              reason={reason}
              onStatusChange={setStatus}
              onSeverityChange={setSeverity}
              onReasonChange={setReason}
            />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('moderation.queue')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {casesQuery.isLoading && <p className="text-sm text-muted-foreground">{t('moderation.loading')}</p>}
                {casesQuery.isError && (
                  <p role="alert" className="text-sm text-destructive">
                    {casesQuery.error instanceof ApiError && casesQuery.error.status === 403
                      ? t('moderation.forbidden')
                      : t('moderation.loadFailed')}
                  </p>
                )}
                {casesQuery.isSuccess && cases.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t('moderation.empty')}</p>
                )}
                {cases.map((item) => (
                  <ModerationQueueItem
                    key={item.case_id}
                    item={item}
                    selected={item.case_id === selectedCaseId}
                    onSelect={() => setSelectedCaseId(item.case_id)}
                  />
                ))}
                {casesQuery.isSuccess && mayHaveMore && (
                  <p className="text-sm text-muted-foreground">{t('moderation.moreCases', { count: cases.length })}</p>
                )}
              </CardContent>
            </Card>
          </section>
          <section>
            {selectedCase ? (
              // Keyed by case: the note, the assignee and the outcome of the
              // last action belong to one case and must not follow the admin
              // to the next one (#261).
              <ModerationCaseDetail
                key={selectedCase.case_id}
                item={selectedCase}
                writes={writes}
                feedback={feedback?.caseId === selectedCase.case_id ? feedback : null}
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  {t('moderation.selectCase')}
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </PageContainer>
    </DashboardLayout>
  )
}

type CaseFeedback = { caseId: string; kind: 'success' | 'error'; message: string }

type CaseWrites = {
  updateCase: ReturnType<typeof useUpdateModerationCaseMutation>
  addNote: ReturnType<typeof useAddModerationCaseNoteMutation>
  /** A write is on its way, for this case or another. */
  busy: boolean
  setFeedback: (feedback: CaseFeedback | null) => void
}

function ModerationCaseDetail({
  item,
  writes,
  feedback,
}: {
  item: ModerationCase
  writes: CaseWrites
  feedback: CaseFeedback | null
}) {
  const { t } = useTranslation('admin')
  // An empty assignee, not a placeholder account: the backend stores whatever
  // string it is sent, so a default here assigned cases to "admin-1" (#261).
  const [assignee, setAssignee] = useState(item.assigned_admin_id ?? '')
  const [resolutionNote, setResolutionNote] = useState('')
  const [caseNote, setCaseNote] = useState('')
  const noteHeading = useId()
  const { updateCase, addNote, busy } = writes
  const caseId = item.case_id
  const setFeedback = (kind: CaseFeedback['kind'], message: string) => writes.setFeedback({ caseId, kind, message })
  const trimmedAssignee = assignee.trim()
  const success = feedback?.kind === 'success' ? feedback.message : null
  const failure = feedback?.kind === 'error' ? feedback.message : null

  const fail = (error: unknown, fallbackKey: string) => setFeedback('error', toUserFacingError(error, t(fallbackKey)))

  const assign = () => {
    writes.setFeedback(null)
    updateCase.mutate(
      { caseId, assigned_admin_id: trimmedAssignee },
      {
        onSuccess: () => setFeedback('success', t('moderation.assigned', { admin: trimmedAssignee })),
        onError: (error) => fail(error, 'moderation.updateFailed'),
      },
    )
  }

  const transition = (nextStatus: ModerationCaseStatus) => {
    writes.setFeedback(null)
    updateCase.mutate(
      { caseId, status: nextStatus, resolution_note: resolutionNote.trim() || undefined },
      {
        onSuccess: () => {
          setResolutionNote('')
          setFeedback('success', t('moderation.statusChanged', { status: statusLabel(nextStatus, t) }))
        },
        onError: (error) => fail(error, 'moderation.updateFailed'),
      },
    )
  }

  const saveNote = () => {
    writes.setFeedback(null)
    addNote.mutate(
      { caseId, note: caseNote.trim() },
      {
        onSuccess: () => {
          setCaseNote('')
          setFeedback('success', t('moderation.noteAdded'))
        },
        onError: (error) => fail(error, 'moderation.noteFailed'),
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="text-lg">{t('moderation.caseTitle', { id: item.case_id })}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {surfaceLabel(item.surface, t)} - {reasonLabel(item.reason, t)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={item.status} />
            <SeverityBadge severity={item.severity} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Always mounted, only its text changes: a live region added together
            with its words is not announced (#410). A failure is an alert, which
            is read out as it appears. */}
        <p role="status" className={success ? 'rounded-md border bg-secondary/40 p-3 text-sm' : 'sr-only'}>
          {success}
        </p>
        {failure && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {failure}
          </p>
        )}
        <ModerationContext item={item} />
        <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
          <div className="rounded-md border p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-sm font-semibold">{t('moderation.assignment')}</h2>
            </div>
            <label className="mt-3 grid gap-2 text-sm">
              {t('moderation.assignee')}
              <input
                value={assignee}
                onChange={(event) => setAssignee(event.target.value)}
                className="h-10 rounded-md border bg-background px-3"
              />
            </label>
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full"
              disabled={busy || !trimmedAssignee || trimmedAssignee === item.assigned_admin_id}
              onClick={assign}
            >
              {t('moderation.assign')}
            </Button>
          </div>
          <div className="rounded-md border p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-sm font-semibold">{t('moderation.statusAction')}</h2>
            </div>
            {/* Named by a placeholder alone, the field lost its name as soon
                as anything was typed in it (#410). */}
            <label className="mt-3 grid gap-2 text-sm">
              {t('moderation.resolutionNote')}
              <Textarea
                value={resolutionNote}
                onChange={(event) => setResolutionNote(event.target.value)}
                className="min-h-20"
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              {actionStatuses.map((nextStatus) => (
                <Button
                  key={nextStatus}
                  type="button"
                  variant={nextStatus === 'actioned' ? 'default' : 'outline'}
                  size="sm"
                  // The case's own status is not a change: the backend keeps the
                  // case as it is, and "set to …" would be a claim (#337).
                  disabled={busy || nextStatus === item.status}
                  onClick={() => transition(nextStatus)}
                >
                  {statusLabel(nextStatus, t)}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-md border p-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <h2 id={noteHeading} className="text-sm font-semibold">{t('moderation.internalNote')}</h2>
          </div>
          <Textarea
            aria-labelledby={noteHeading}
            value={caseNote}
            onChange={(event) => setCaseNote(event.target.value)}
            placeholder={t('moderation.notePlaceholder')}
            className="mt-3 min-h-20"
          />
          <Button type="button" className="mt-3" disabled={busy || !caseNote.trim()} onClick={saveNote}>
            {t('moderation.addNote')}
          </Button>
        </div>
        <ModerationHistory item={item} />
      </CardContent>
    </Card>
  )
}

function ModerationFilters({
  status,
  severity,
  reason,
  onStatusChange,
  onSeverityChange,
  onReasonChange,
}: {
  status: ModerationCaseStatus | ''
  severity: ModerationSeverity | ''
  reason: ModerationReason | ''
  onStatusChange: (value: ModerationCaseStatus | '') => void
  onSeverityChange: (value: ModerationSeverity | '') => void
  onReasonChange: (value: ModerationReason | '') => void
}) {
  const { t } = useTranslation('admin')
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('moderation.filters')}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <FilterSelect
          label={t('moderation.filterStatus')}
          allLabel={t('moderation.allStatus')}
          value={status}
          values={statusOptions}
          formatOption={(value) => statusLabel(value, t)}
          onChange={onStatusChange}
        />
        <FilterSelect
          label={t('moderation.filterSeverity')}
          allLabel={t('moderation.allSeverity')}
          value={severity}
          values={severityOptions}
          formatOption={(value) => severityLabel(value, t)}
          onChange={onSeverityChange}
        />
        <FilterSelect
          label={t('moderation.filterReason')}
          allLabel={t('moderation.allReason')}
          value={reason}
          values={reasonOptions}
          formatOption={(value) => reasonLabel(value, t)}
          onChange={onReasonChange}
        />
      </CardContent>
    </Card>
  )
}

function FilterSelect<T extends string>({
  label,
  allLabel,
  value,
  values,
  formatOption,
  onChange,
}: {
  label: string
  allLabel: string
  value: T
  values: T[]
  formatOption: (value: T) => string
  onChange: (value: T) => void
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-10 rounded-md border bg-background px-3 text-sm"
      >
        {values.map((option) => (
          <option key={option || 'all'} value={option}>
            {option ? formatOption(option) : allLabel}
          </option>
        ))}
      </select>
    </label>
  )
}

function ModerationQueueItem({
  item,
  selected,
  onSelect,
}: {
  item: ModerationCase
  selected: boolean
  onSelect: () => void
}) {
  const { t } = useTranslation('admin')
  return (
    // The case open on the right is told by more than its colour (#410): a tick
    // on screen, and aria-current for a screen reader.
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected || undefined}
      className={`w-full rounded-md border p-3 text-left transition-colors ${
        selected ? 'border-primary bg-primary/5' : 'hover:bg-secondary/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
          {selected && <Check data-selected-mark className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
          <span className="truncate">{item.case_id}</span>
        </span>
        <SeverityBadge severity={item.severity} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {surfaceLabel(item.surface, t)} - {reasonLabel(item.reason, t)}
      </p>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
        {item.question_context?.content_preview ?? item.report_note ?? t('moderation.noPreview')}
      </p>
    </button>
  )
}

function ModerationContext({ item }: { item: ModerationCase }) {
  const { t } = useTranslation('admin')
  const context = item.question_context
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {/* The reporter's note is not the student's question; it shows in the
          history under "Reported" (#337). */}
      <ContextBlock label={t('moderation.question')} value={context?.content_preview ?? t('moderation.noQuestion')} />
      <ContextBlock label={t('moderation.aiAnswer')} value={context?.ai_answer_preview ?? t('moderation.noAiAnswer')} />
      <ContextBlock
        label={t('moderation.teacherReply')}
        value={context?.teacher_response_preview ?? t('moderation.noTeacherReply')}
      />
    </div>
  )
}

function ContextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-32 rounded-md border bg-secondary/30 p-4">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6">{value}</p>
    </div>
  )
}

function ModerationHistory({ item }: { item: ModerationCase }) {
  const { t } = useTranslation('admin')
  const history = item.history ?? []
  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-sm font-semibold">{t('moderation.history')}</h2>
      </div>
      <div className="mt-3 space-y-2">
        {history.length === 0 && <p className="text-sm text-muted-foreground">{t('moderation.noHistory')}</p>}
        {history.map((event) => (
          <div key={event.event_id} className="rounded-md bg-secondary/40 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{t(`moderation.events.${event.event_type}`, { defaultValue: formatLabel(event.event_type) })}</span>
              <span className="text-xs text-muted-foreground">{formatDate(event.created_at, t)}</span>
            </div>
            {historyChanges(event.changes, t).map((line) => (
              <p key={line} className="mt-1">
                {line}
              </p>
            ))}
            {event.note && <p className="mt-1 text-muted-foreground">{event.note}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

/*
 * "Updated" alone does not say what changed. The backend records a field in
 * `changes` only when its value moved; the resolution note is the event's note.
 */
function historyChanges(changes: Record<string, unknown> | null | undefined, t: TFunction) {
  const lines: string[] = []
  if (typeof changes?.status === 'string') {
    lines.push(t('admin:moderation.historyChanges.status', { status: statusLabel(changes.status, t) }))
  }
  if (typeof changes?.assigned_admin_id === 'string') {
    lines.push(t('admin:moderation.historyChanges.assigned', { admin: changes.assigned_admin_id }))
  }
  return lines
}

function StatusBadge({ status }: { status: ModerationCaseStatus }) {
  const { t } = useTranslation('admin')
  return <Badge variant={status === 'open' ? 'destructive' : 'secondary'}>{statusLabel(status, t)}</Badge>
}

function SeverityBadge({ severity }: { severity: ModerationSeverity }) {
  const { t } = useTranslation('admin')
  return (
    <Badge variant={severity === 'high' ? 'destructive' : severity === 'medium' ? 'secondary' : 'outline'}>
      <Flag className="mr-1 h-3 w-3" aria-hidden="true" />
      {severityLabel(severity, t)}
    </Badge>
  )
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase())
}

/*
 * The enum codes are the API's; the words are the reader's. A code the backend
 * adds later still shows, title-cased, rather than disappearing.
 */
function statusLabel(value: string, t: TFunction) {
  return t(`admin:moderation.status.${value}`, { defaultValue: formatLabel(value) })
}

function severityLabel(value: string, t: TFunction) {
  return t(`admin:moderation.severity.${value}`, { defaultValue: formatLabel(value) })
}

function reasonLabel(value: string, t: TFunction) {
  return t(`admin:moderation.reason.${value}`, { defaultValue: formatLabel(value) })
}

function surfaceLabel(value: string, t: TFunction) {
  return t(`admin:moderation.surface.${value}`, { defaultValue: formatLabel(value) })
}

function formatDate(value: string | null | undefined, t: TFunction) {
  if (!value) return t('admin:moderation.unknownTime')
  return formatDayAndTime(value)
}

export default AdminModerationPage
