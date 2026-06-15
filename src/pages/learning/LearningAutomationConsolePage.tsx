import { FormEvent, useMemo, useState } from 'react'
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
import type { AutomationCandidate, AutomationPolicy } from '@/types/learningOperations'

const defaultPolicy: AutomationPolicy = {
  status: 'active',
  autonomyLevel: 'tutor_approved_batch',
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
  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${statusClassNames[value] ?? 'border-border bg-muted text-muted-foreground'}`}>
      {value}
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
                {candidate.subject || 'Subject pending'} / {candidate.topicId || 'topic pending'} / {candidate.sourceType}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {candidate.confidence && <StatusPill value={candidate.confidence} />}
              {candidate.reviewStatus && <StatusPill value={candidate.reviewStatus} />}
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {mode === 'refused'
              ? candidate.refusalReason || 'Candidate was refused by policy.'
              : candidate.expectedImpact || candidate.rationale || 'Candidate is ready for tutor approval.'}
          </p>
        </div>
      ))}
    </div>
  )
}

export function LearningAutomationConsolePage() {
  const [studentId, setStudentId] = useState('student-1')
  const [subject, setSubject] = useState('')
  const [topicIds, setTopicIds] = useState('')
  const [sourceTypes, setSourceTypes] = useState('ai_draft,curriculum_exercise')
  const [maxAssignments, setMaxAssignments] = useState(3)
  const [confidence, setConfidence] = useState<AutomationPolicy['confidenceThreshold']>('medium')
  const [policyStatus, setPolicyStatus] = useState<AutomationPolicy['status']>('active')
  const [pausedReason, setPausedReason] = useState('')

  const assignmentsQuery = useStudentAssignmentsQuery(studentId)
  const previewMutation = useAutomationPreviewMutation(studentId)
  const executeMutation = useAutomationExecuteMutation(studentId)
  const preview = previewMutation.data
  const results = executeMutation.data?.results ?? []

  const policy = useMemo<AutomationPolicy>(() => ({
    ...defaultPolicy,
    policyId: `policy-${studentId || 'student'}`,
    name: 'Tutor approved assignment automation',
    status: policyStatus,
    studentIds: studentId ? [studentId] : [],
    subjectIds: subject ? [subject] : [],
    topicIds: splitList(topicIds),
    sourceTypes: splitList(sourceTypes) as AutomationPolicy['sourceTypes'],
    maxAssignmentsPerStudent: maxAssignments,
    confidenceThreshold: confidence,
    pausedReason: policyStatus === 'paused' ? pausedReason || 'Paused from console.' : undefined,
  }), [confidence, maxAssignments, pausedReason, policyStatus, sourceTypes, studentId, subject, topicIds])

  const handlePreview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!studentId.trim()) {
      toast.error('Enter a student id before previewing automation.')
      return
    }
    previewMutation.mutate({ policy, subject: subject || undefined })
  }

  const handleExecute = () => {
    if (!preview) return
    executeMutation.mutate({
      batchId: preview.batchId,
      approved: true,
      policy: preview.policy,
      candidates: preview.selected.map((candidate) => ({ ...candidate, approved: true })),
      subject: subject || undefined,
    }, {
      onSuccess: (data) => toast.success(`Automation batch returned ${data.results.length} result(s).`),
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <DashboardLayout>
      <PageContainer size="wide" className="p-0">
        <PageHeader
          eyebrow="Learning operations"
          title="Automation review console"
          description="Preview and approve controlled practice assignment batches from reviewed sources without hiding backend failures behind demo fallback."
        />

        <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <SlidersHorizontal className="h-5 w-5" />
                Policy controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handlePreview}>
                <div className="space-y-2">
                  <Label htmlFor="student-id">Student id</Label>
                  <Input id="student-id" value={studentId} onChange={(event) => setStudentId(event.target.value)} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject filter</Label>
                    <Input id="subject" value={subject} placeholder="math" onChange={(event) => setSubject(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="topics">Topic ids</Label>
                    <Input id="topics" value={topicIds} placeholder="fractions,linear-equations" onChange={(event) => setTopicIds(event.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sources">Source types</Label>
                  <Input id="sources" value={sourceTypes} onChange={(event) => setSourceTypes(event.target.value)} />
                </div>
                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <div className="space-y-2">
                    <Label htmlFor="max">Max assignments</Label>
                    <Input id="max" type="number" min={1} max={20} value={maxAssignments} onChange={(event) => setMaxAssignments(Number(event.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confidence">Confidence</Label>
                    <select
                      id="confidence"
                      className="min-h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={confidence}
                      onChange={(event) => setConfidence(event.target.value as AutomationPolicy['confidenceThreshold'])}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="policy-status">Policy status</Label>
                    <select
                      id="policy-status"
                      className="min-h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={policyStatus}
                      onChange={(event) => setPolicyStatus(event.target.value as AutomationPolicy['status'])}
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="off">Off</option>
                    </select>
                  </div>
                </div>
                {policyStatus === 'paused' && (
                  <div className="space-y-2">
                    <Label htmlFor="paused-reason">Paused reason</Label>
                    <Input id="paused-reason" value={pausedReason} onChange={(event) => setPausedReason(event.target.value)} />
                  </div>
                )}
                <Button className="w-full" type="submit" disabled={previewMutation.isPending}>
                  {previewMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Preview candidates
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {previewMutation.error && (
              <Card className="border-destructive/40">
                <CardContent className="pt-6">
                  <ErrorState title="Preview failed" message={previewMutation.error.message} />
                </CardContent>
              </Card>
            )}

            {preview && (
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-2xl font-semibold">{preview.summary.selectedCount}</p>
                    <p className="text-sm text-muted-foreground">Selected</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-2xl font-semibold">{preview.summary.refusedCount}</p>
                    <p className="text-sm text-muted-foreground">Refused</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-2xl font-semibold">{preview.summary.duplicateCount}</p>
                    <p className="text-sm text-muted-foreground">Duplicates</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-2xl font-semibold">{preview.summary.reviewRequiredCount}</p>
                    <p className="text-sm text-muted-foreground">Need review</p>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <CheckCircle2 className="h-5 w-5" />
                    Selected candidates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!preview && <p className="text-sm text-muted-foreground">Run preview to inspect selected candidates.</p>}
                  {preview && (
                    <CandidateList
                      candidates={preview.selected}
                      empty="No candidate passed policy. Check refused reasons before changing thresholds."
                      mode="selected"
                    />
                  )}
                  {preview && preview.selected.length > 0 && (
                    <Button className="mt-4" onClick={handleExecute} disabled={executeMutation.isPending}>
                      {executeMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      Execute approved batch
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <AlertTriangle className="h-5 w-5" />
                    Refused candidates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!preview && <p className="text-sm text-muted-foreground">Policy refusals appear after preview.</p>}
                  {preview && (
                    <CandidateList
                      candidates={preview.refused}
                      empty="No refusals for this preview."
                      mode="refused"
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {executeMutation.error && (
              <Card className="border-destructive/40">
                <CardContent className="pt-6">
                  <ErrorState title="Execute failed" message={executeMutation.error.message} />
                </CardContent>
              </Card>
            )}

            {results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Execution results</CardTitle>
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
                <CardTitle className="text-xl">Assignment history</CardTitle>
              </CardHeader>
              <CardContent>
                {assignmentsQuery.isLoading && <LoadingState message="Loading assignment history..." />}
                {assignmentsQuery.error && <ErrorState title="Assignment history failed" message={assignmentsQuery.error.message} />}
                {assignmentsQuery.data?.items.length === 0 && (
                  <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    No assignment history returned for this student.
                  </p>
                )}
                <div className="space-y-3">
                  {assignmentsQuery.data?.items.map((assignment) => (
                    <div key={assignment.assignmentId} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium">{assignment.title || assignment.assignmentId}</p>
                        <p className="text-sm text-muted-foreground">
                          {assignment.subject || 'Subject pending'} / {assignment.topicIds.join(', ') || 'topic pending'}
                          {assignment.automation?.explanation ? ` - ${assignment.automation.explanation}` : ''}
                        </p>
                      </div>
                      <StatusPill value={assignment.status} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  )
}
