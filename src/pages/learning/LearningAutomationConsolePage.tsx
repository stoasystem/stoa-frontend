import { FormEvent, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, CheckCircle2, Play, RefreshCw, Search, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useAutomationExecuteMutation,
  useAutomationPreviewMutation,
  useStudentAssignmentsQuery,
} from '@/hooks/learning/useLearningOperationsQueries'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { ApiError } from '@/services/api/httpClient'
import type { AutomationCandidate, AutomationPolicy } from '@/types/learningOperations'

const defaultPolicy: AutomationPolicy = {
  status: 'active',
  autonomyLevel: 'teacher_approved_batch',
  sourceTypes: ['ai_draft', 'curriculum_exercise'],
  maxAssignmentsPerStudent: 3,
  confidenceThreshold: 'medium',
  freshnessDays: 14,
  dueInDays: 7,
  deliveryMode: 'assigned',
}

const statusClassNames: Record<string, string> = {
  assigned: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  delivered: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  created: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  duplicate: 'border-amber-200 bg-amber-50 text-amber-900',
  refused: 'border-rose-200 bg-rose-50 text-rose-900',
  failed: 'border-rose-200 bg-rose-50 text-rose-900',
  skipped: 'border-slate-200 bg-slate-50 text-slate-700',
}

function splitList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function StatusPill({ value }: { value: string }) {
  const { t } = useTranslation('teacher')
  // A status the backend adds later still shows, as it comes, until it has words.
  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${statusClassNames[value] ?? 'border-border bg-muted text-muted-foreground'}`}>
      {t(`automationConsole.status.${value}`, { defaultValue: value })}
    </span>
  )
}

function CandidateList({
  candidates,
  empty,
  mode,
}: {
  candidates: AutomationCandidate[]
  empty: string
  mode: 'selected' | 'refused'
}) {
  const { t } = useTranslation('teacher')
  if (candidates.length === 0) {
    return <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">{empty}</p>
  }

  return (
    <div className="space-y-3">
      {candidates.map((candidate) => (
        <div key={`${mode}-${candidate.candidateId}`} className="rounded-md border p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{candidate.title || candidate.candidateId}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {candidate.subject || t('automationConsole.subjectPending')} / {candidate.topicId || t('automationConsole.topicPending')} / {candidate.sourceType}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {candidate.confidence && <StatusPill value={candidate.confidence} />}
              {candidate.reviewStatus && <StatusPill value={candidate.reviewStatus} />}
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {mode === 'refused'
              ? candidate.refusalReason || t('automationConsole.refusedDefault')
              : candidate.expectedImpact || candidate.rationale || t('automationConsole.readyDefault')}
          </p>
        </div>
      ))}
    </div>
  )
}

export function LearningAutomationConsolePage() {
  const { t } = useTranslation('teacher')
  // Empty, not a sample id: `useStudentAssignmentsQuery` is enabled by a
  // non-empty id, so a placeholder made every visit open on a red "Assignment
  // history failed" from a student that does not exist (card 124).
  const [studentId, setStudentId] = useState('')
  // The history is read for the id the operator settled on (leaving the
  // field, or previewing), not on every key: half an id is an unknown student,
  // and the panel flashed "could not be loaded" while it was being typed.
  const [shownStudentId, setShownStudentId] = useState('')
  const [subject, setSubject] = useState('')
  const [topicIds, setTopicIds] = useState('')
  const [sourceTypes, setSourceTypes] = useState('ai_draft,curriculum_exercise')
  const [maxAssignments, setMaxAssignments] = useState(3)
  const [confidence, setConfidence] = useState<AutomationPolicy['confidenceThreshold']>('medium')
  const [policyStatus, setPolicyStatus] = useState<AutomationPolicy['status']>('active')
  const [pausedReason, setPausedReason] = useState('')
  // One id for everything the console sends: a pasted space must not make the
  // preview, the policy and the history address different students.
  const trimmedStudentId = studentId.trim()

  const assignmentsQuery = useStudentAssignmentsQuery(shownStudentId)
  // An id that names no student, or one this account may not see, is an
  // answer, not a failure.
  const historyNotFound = assignmentsQuery.error instanceof ApiError && assignmentsQuery.error.status === 404
  const previewMutation = useAutomationPreviewMutation()
  const executeMutation = useAutomationExecuteMutation()
  const preview = previewMutation.data
  // The student and subject the shown preview was made for. Execute uses these,
  // not the fields, which may have moved on since.
  const previewedStudentId = previewMutation.variables?.studentId
  const previewedSubject = previewMutation.variables?.request.subject
  // An execution belongs to the batch it ran: once that batch ran, it is not
  // offered again, and its results are not shown under another preview.
  const executedPreview = Boolean(preview && executeMutation.data?.batchId === preview.batchId)
  const results = executedPreview ? executeMutation.data?.results ?? [] : []
  // The history card shows the student whose id is in the field, or nothing.
  const historyStale = trimmedStudentId !== shownStudentId

  const policy = useMemo<AutomationPolicy>(() => ({
    ...defaultPolicy,
    policyId: `policy-${trimmedStudentId || 'student'}`,
    // The policy's name and pause reason are stored with it, so they stay in
    // one language whatever the console is shown in.
    name: 'Teacher approved assignment automation',
    status: policyStatus,
    studentIds: trimmedStudentId ? [trimmedStudentId] : [],
    subjectIds: subject ? [subject] : [],
    topicIds: splitList(topicIds),
    sourceTypes: splitList(sourceTypes) as AutomationPolicy['sourceTypes'],
    maxAssignmentsPerStudent: maxAssignments,
    confidenceThreshold: confidence,
    pausedReason: policyStatus === 'paused' ? pausedReason || 'Paused from console.' : undefined,
  }), [confidence, maxAssignments, pausedReason, policyStatus, sourceTypes, trimmedStudentId, subject, topicIds])

  const handlePreview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!trimmedStudentId) {
      toast.error(t('automationConsole.needStudentId'))
      return
    }
    setShownStudentId(trimmedStudentId)
    executeMutation.reset()
    previewMutation.mutate({ studentId: trimmedStudentId, request: { policy, subject: subject || undefined } })
  }

  const handleExecute = () => {
    if (!preview || !previewedStudentId || executedPreview) return
    executeMutation.mutate({
      studentId: previewedStudentId,
      request: {
        batchId: preview.batchId,
        approved: true,
        policy: preview.policy,
        candidates: preview.selected.map((candidate) => ({ ...candidate, approved: true })),
        subject: previewedSubject,
      },
    }, {
      onSuccess: (data) => toast.success(t('automationConsole.executed', { count: data.results.length })),
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <DashboardLayout>
      <PageContainer size="wide" className="p-0">
        <PageHeader
          eyebrow={t('automationConsole.eyebrow')}
          title={t('automationConsole.title')}
          description={t('automationConsole.description')}
        />

        <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <SlidersHorizontal className="h-5 w-5" />
                {t('automationConsole.policyControls')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handlePreview}>
                <div className="space-y-2">
                  <Label htmlFor="student-id">{t('automationConsole.studentId')}</Label>
                  <Input
                    id="student-id"
                    value={studentId}
                    placeholder={t('automationConsole.studentIdPlaceholder')}
                    onChange={(event) => setStudentId(event.target.value)}
                    onBlur={() => setShownStudentId(trimmedStudentId)}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="space-y-2">
                    <Label htmlFor="subject">{t('automationConsole.subjectFilter')}</Label>
                    <Input id="subject" value={subject} placeholder="math" onChange={(event) => setSubject(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="topics">{t('automationConsole.topicIds')}</Label>
                    <Input id="topics" value={topicIds} placeholder="fractions,linear-equations" onChange={(event) => setTopicIds(event.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sources">{t('automationConsole.sourceTypes')}</Label>
                  <Input id="sources" value={sourceTypes} onChange={(event) => setSourceTypes(event.target.value)} />
                </div>
                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <div className="space-y-2">
                    <Label htmlFor="max">{t('automationConsole.maxAssignments')}</Label>
                    <Input id="max" type="number" min={1} max={20} value={maxAssignments} onChange={(event) => setMaxAssignments(Number(event.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confidence">{t('automationConsole.confidence')}</Label>
                    <select
                      id="confidence"
                      className="min-h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={confidence}
                      onChange={(event) => setConfidence(event.target.value as AutomationPolicy['confidenceThreshold'])}
                    >
                      <option value="low">{t('automationConsole.option.low')}</option>
                      <option value="medium">{t('automationConsole.option.medium')}</option>
                      <option value="high">{t('automationConsole.option.high')}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="policy-status">{t('automationConsole.policyStatus')}</Label>
                    <select
                      id="policy-status"
                      className="min-h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={policyStatus}
                      onChange={(event) => setPolicyStatus(event.target.value as AutomationPolicy['status'])}
                    >
                      <option value="active">{t('automationConsole.option.active')}</option>
                      <option value="paused">{t('automationConsole.option.paused')}</option>
                      <option value="off">{t('automationConsole.option.off')}</option>
                    </select>
                  </div>
                </div>
                {policyStatus === 'paused' && (
                  <div className="space-y-2">
                    <Label htmlFor="paused-reason">{t('automationConsole.pausedReason')}</Label>
                    <Input id="paused-reason" value={pausedReason} onChange={(event) => setPausedReason(event.target.value)} />
                  </div>
                )}
                <Button className="w-full" type="submit" disabled={previewMutation.isPending}>
                  {previewMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  {t('automationConsole.preview')}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {previewMutation.error && (
              <Card className="border-destructive/40">
                <CardContent className="pt-6">
                  <ErrorState title={t('automationConsole.previewFailed')} message={previewMutation.error.message} />
                </CardContent>
              </Card>
            )}

            {preview && (
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-2xl font-semibold">{preview.summary.selectedCount}</p>
                    <p className="text-sm text-muted-foreground">{t('automationConsole.summary.selected')}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-2xl font-semibold">{preview.summary.refusedCount}</p>
                    <p className="text-sm text-muted-foreground">{t('automationConsole.summary.refused')}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-2xl font-semibold">{preview.summary.duplicateCount}</p>
                    <p className="text-sm text-muted-foreground">{t('automationConsole.summary.duplicates')}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-2xl font-semibold">{preview.summary.reviewRequiredCount}</p>
                    <p className="text-sm text-muted-foreground">{t('automationConsole.summary.needReview')}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <CheckCircle2 className="h-5 w-5" />
                    {t('automationConsole.selectedTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!preview && <p className="text-sm text-muted-foreground">{t('automationConsole.selectedBefore')}</p>}
                  {preview && (
                    <CandidateList
                      candidates={preview.selected}
                      empty={t('automationConsole.selectedEmpty')}
                      mode="selected"
                    />
                  )}
                  {preview && preview.selected.length > 0 && (
                    <Button className="mt-4" onClick={handleExecute} disabled={executeMutation.isPending || executedPreview}>
                      {executeMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      {t('automationConsole.execute')}
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <AlertTriangle className="h-5 w-5" />
                    {t('automationConsole.refusedTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!preview && <p className="text-sm text-muted-foreground">{t('automationConsole.refusedBefore')}</p>}
                  {preview && (
                    <CandidateList
                      candidates={preview.refused}
                      empty={t('automationConsole.refusedEmpty')}
                      mode="refused"
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {executeMutation.error && (
              <Card className="border-destructive/40">
                <CardContent className="pt-6">
                  <ErrorState title={t('automationConsole.executeFailed')} message={executeMutation.error.message} />
                </CardContent>
              </Card>
            )}

            {results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">{t('automationConsole.resultsTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {results.map((result) => (
                    <div key={`${result.candidateId}-${result.automationKey}`} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium">{result.assignment?.title || result.candidateId}</p>
                        <p className="text-sm text-muted-foreground">{result.reason}</p>
                      </div>
                      <StatusPill value={result.status} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{t('automationConsole.historyTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                {!trimmedStudentId && (historyStale || !shownStudentId) && (
                  <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    {t('automationConsole.historyNeedStudent')}
                  </p>
                )}
                {/* An id is typed but not read yet: say how to read it, not to type one. */}
                {trimmedStudentId && historyStale && (
                  <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    {t('automationConsole.historyNotLoaded', { action: t('automationConsole.preview') })}
                  </p>
                )}
                {/* What is read belongs to the id last read; while the field names
                    someone else, none of it is shown, so it cannot pass for theirs. */}
                {!historyStale && (
                  <>
                    {assignmentsQuery.isLoading && <LoadingState message={t('automationConsole.historyLoading')} />}
                    {historyNotFound && (
                      <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                        {t('automationConsole.historyNotFound')}
                      </p>
                    )}
                    {assignmentsQuery.error && !historyNotFound && (
                      <ErrorState title={t('automationConsole.historyFailed')} message={assignmentsQuery.error.message} />
                    )}
                    {assignmentsQuery.data?.items.length === 0 && (
                      <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                        {t('automationConsole.historyEmpty')}
                      </p>
                    )}
                    <div className="space-y-3">
                      {assignmentsQuery.data?.items.map((assignment) => (
                        <div key={assignment.assignmentId} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-medium">{assignment.title || assignment.assignmentId}</p>
                            <p className="text-sm text-muted-foreground">
                              {assignment.subject || t('automationConsole.subjectPending')} / {assignment.topicIds.join(', ') || t('automationConsole.topicPending')}
                              {assignment.automation?.explanation ? ` - ${assignment.automation.explanation}` : ''}
                            </p>
                          </div>
                          <StatusPill value={assignment.status} />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  )
}
