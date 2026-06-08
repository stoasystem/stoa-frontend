import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock, Flag, MessageSquare, UserCheck } from 'lucide-react'
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
import { DashboardLayout } from '@/layouts/DashboardLayout'
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

export function AdminModerationPage() {
  const [status, setStatus] = useState<ModerationCaseStatus | ''>('')
  const [severity, setSeverity] = useState<ModerationSeverity | ''>('')
  const [reason, setReason] = useState<ModerationReason | ''>('')
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [assignee, setAssignee] = useState('admin-1')
  const [resolutionNote, setResolutionNote] = useState('')
  const [caseNote, setCaseNote] = useState('')

  const filters = useMemo(() => ({ status, severity, reason, limit: 50 }), [reason, severity, status])
  const casesQuery = useAdminModerationCasesQuery(filters)
  const cases = casesQuery.data?.items ?? []

  useEffect(() => {
    if (selectedCaseId || cases.length === 0) return
    setSelectedCaseId(cases[0].case_id)
  }, [cases, selectedCaseId])

  const detailQuery = useAdminModerationCaseQuery(selectedCaseId)
  const selectedCase = detailQuery.data ?? cases.find((item) => item.case_id === selectedCaseId) ?? null
  const updateCase = useUpdateModerationCaseMutation()
  const addNote = useAddModerationCaseNoteMutation()

  return (
    <DashboardLayout>
      <PageContainer size="wide" className="p-0">
        <PageHeader
          eyebrow="Admin operations"
          title="Content moderation"
          description="Review reported learning content, assign cases, and record internal outcomes."
          actions={<Badge variant="secondary">{casesQuery.data?.count ?? 0} cases</Badge>}
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
                <CardTitle className="text-base">Queue</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {casesQuery.isLoading && <p className="text-sm text-muted-foreground">Loading moderation cases...</p>}
                {casesQuery.isError && <p className="text-sm text-destructive">Failed to load moderation cases.</p>}
                {!casesQuery.isLoading && cases.length === 0 && (
                  <p className="text-sm text-muted-foreground">No moderation cases match these filters.</p>
                )}
                {cases.map((item) => (
                  <ModerationQueueItem
                    key={item.case_id}
                    item={item}
                    selected={item.case_id === selectedCaseId}
                    onSelect={() => setSelectedCaseId(item.case_id)}
                  />
                ))}
              </CardContent>
            </Card>
          </section>
          <section>
            {selectedCase ? (
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle className="text-lg">Case {selectedCase.case_id}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatLabel(selectedCase.surface)} - {formatLabel(selectedCase.reason)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={selectedCase.status} />
                      <SeverityBadge severity={selectedCase.severity} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <ModerationContext item={selectedCase} />
                  <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
                    <div className="rounded-md border p-4">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <h2 className="text-sm font-semibold">Assignment</h2>
                      </div>
                      <label className="mt-3 grid gap-2 text-sm">
                        Admin
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
                        disabled={updateCase.isPending}
                        onClick={() =>
                          selectedCaseId &&
                          updateCase.mutate({ caseId: selectedCaseId, assigned_admin_id: assignee })
                        }
                      >
                        Assign case
                      </Button>
                    </div>
                    <div className="rounded-md border p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <h2 className="text-sm font-semibold">Status action</h2>
                      </div>
                      <Textarea
                        value={resolutionNote}
                        onChange={(event) => setResolutionNote(event.target.value)}
                        placeholder="Resolution note"
                        className="mt-3 min-h-20"
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        {actionStatuses.map((nextStatus) => (
                          <Button
                            key={nextStatus}
                            type="button"
                            variant={nextStatus === 'actioned' ? 'default' : 'outline'}
                            size="sm"
                            disabled={updateCase.isPending}
                            onClick={() =>
                              selectedCaseId &&
                              updateCase.mutate({
                                caseId: selectedCaseId,
                                status: nextStatus,
                                resolution_note: resolutionNote.trim() || undefined,
                              })
                            }
                          >
                            {formatLabel(nextStatus)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-md border p-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <h2 className="text-sm font-semibold">Internal note</h2>
                    </div>
                    <Textarea
                      value={caseNote}
                      onChange={(event) => setCaseNote(event.target.value)}
                      placeholder="Add an internal moderation note"
                      className="mt-3 min-h-20"
                    />
                    <Button
                      type="button"
                      className="mt-3"
                      disabled={addNote.isPending || !caseNote.trim()}
                      onClick={() =>
                        selectedCaseId &&
                        addNote.mutate(
                          { caseId: selectedCaseId, note: caseNote.trim() },
                          { onSuccess: () => setCaseNote('') },
                        )
                      }
                    >
                      Add note
                    </Button>
                  </div>
                  <ModerationHistory item={selectedCase} />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Select a moderation case to inspect its context and actions.
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </PageContainer>
    </DashboardLayout>
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Filters</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <FilterSelect label="Status" value={status} values={statusOptions} onChange={onStatusChange} />
        <FilterSelect label="Severity" value={severity} values={severityOptions} onChange={onSeverityChange} />
        <FilterSelect label="Reason" value={reason} values={reasonOptions} onChange={onReasonChange} />
      </CardContent>
    </Card>
  )
}

function FilterSelect<T extends string>({
  label,
  value,
  values,
  onChange,
}: {
  label: string
  value: T
  values: T[]
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
            {option ? formatLabel(option) : `All ${label.toLowerCase()}`}
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
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-md border p-3 text-left transition-colors ${
        selected ? 'border-primary bg-primary/5' : 'hover:bg-secondary/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium">{item.case_id}</span>
        <SeverityBadge severity={item.severity} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {formatLabel(item.surface)} - {formatLabel(item.reason)}
      </p>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
        {item.question_context?.content_preview ?? item.report_note ?? 'No context preview'}
      </p>
    </button>
  )
}

function ModerationContext({ item }: { item: ModerationCase }) {
  const context = item.question_context
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <ContextBlock label="Question" value={context?.content_preview ?? item.report_note ?? 'No question preview'} />
      <ContextBlock label="AI answer" value={context?.ai_answer_preview ?? 'No AI answer snapshot'} />
      <ContextBlock label="Teacher reply" value={context?.teacher_response_preview ?? 'No teacher reply snapshot'} />
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
  const history = item.history ?? []
  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-sm font-semibold">History</h2>
      </div>
      <div className="mt-3 space-y-2">
        {history.length === 0 && <p className="text-sm text-muted-foreground">No history events yet.</p>}
        {history.map((event) => (
          <div key={event.event_id} className="rounded-md bg-secondary/40 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{formatLabel(event.event_type)}</span>
              <span className="text-xs text-muted-foreground">{formatDate(event.created_at)}</span>
            </div>
            {event.note && <p className="mt-1 text-muted-foreground">{event.note}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: ModerationCaseStatus }) {
  return <Badge variant={status === 'open' ? 'destructive' : 'secondary'}>{formatLabel(status)}</Badge>
}

function SeverityBadge({ severity }: { severity: ModerationSeverity }) {
  return (
    <Badge variant={severity === 'high' ? 'destructive' : severity === 'medium' ? 'secondary' : 'outline'}>
      <Flag className="mr-1 h-3 w-3" aria-hidden="true" />
      {formatLabel(severity)}
    </Badge>
  )
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase())
}

function formatDate(value?: string | null) {
  if (!value) return 'Unknown time'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export default AdminModerationPage
