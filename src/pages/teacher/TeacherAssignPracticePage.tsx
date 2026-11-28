import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { Button, ChoiceSelect, Pill, TextField, type PillTone } from '@/components/base'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AssignmentExplanationCard } from '@/features/assignments/AssignmentExplanationCard'
import {
  candidateReason,
  refusalReason,
  resultCreatedWork,
  resultReason,
  resultStatusLabel,
} from '@/features/assignPractice/automationReasons'
import { toExecuteCandidate } from '@/features/assignPractice/executeCandidate'
import { readPracticeId } from '@/features/assignPractice/practicePath'
import {
  useAutomationExecuteMutation,
  useAutomationPreviewMutation,
  useStudentAssignmentsQuery,
} from '@/hooks/learning/useLearningOperationsQueries'
import { useCurriculumCatalogQuery } from '@/hooks/practice/useCurriculumCatalogQuery'
import { useTeacherHelpRequestsQuery } from '@/hooks/teacher/useTeacherHelpRequestsQuery'
import { getSubjectLabel, getTopicLabel } from '@/lib/displayLabels'
import { normalSubjectId } from '@/lib/subjects'
import { toUserFacingError } from '@/lib/userFacingText'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { ApiError } from '@/services/api/httpClient'
import type { AutomationCandidate, AutomationPolicy, AutomationPolicyInput } from '@/types/learningOperations'
import type { CurriculumCatalog } from '@/types/practice'
import type { TeacherHelpRequestSummary } from '@/types/teacher'
import type { ProfileChoice } from '@/types/student'

/*
 * A teacher recommends practice to a student they helped (#703).
 *
 * Who: the backend lets a teacher assign to a student whose human help request
 * they hold, or resolved in the last 14 days (stoa-backend#495), and there is
 * no "my students" list, so the students offered are those of the teacher's
 * own requests. A help request links here with its student (`?studentId=`,
 * `?request=`); nobody types an id.
 *
 * What: subject and topic are chosen by name from the curriculum catalog. The
 * automation's knobs are folded away and left to the backend's defaults; only
 * a knob the teacher moves is sent. The teacher ticks the proposed exercises,
 * confirms, and sees the student's Assignments as the student will.
 */

/** The backend's defaults (`AssignmentAutomationPolicyRequest`), shown in the folded options. */
const BACKEND_DEFAULTS = {
  confidenceThreshold: 'medium',
  dueInDays: 7,
  freshnessDays: 14,
  maxAssignmentsPerStudent: 3,
  sourceTypes: ['curriculum_exercise', 'ai_draft'],
} as const satisfies Partial<AutomationPolicy>

const CONFIDENCE_LEVELS = ['low', 'medium', 'high'] as const
const SOURCE_TYPES = ['curriculum_exercise', 'ai_draft'] as const
type SourceType = (typeof SOURCE_TYPES)[number]

type Overrides = Pick<
  AutomationPolicyInput,
  'confidenceThreshold' | 'dueInDays' | 'freshnessDays' | 'maxAssignmentsPerStudent' | 'sourceTypes'
>

/** Help requests that let this teacher assign: held now, or resolved (the backend checks the 14 days). */
const RELATED_STATUSES = new Set(['in_progress', 'resolved'])

type Student = { id: string; name: string; subject?: string | null }

/** One entry per student, the most recent request first, from the teacher's own requests. */
function studentsOf(requests: readonly TeacherHelpRequestSummary[]): Student[] {
  const byId = new Map<string, Student>()
  const newestFirst = [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  for (const request of newestFirst) {
    const id = readPracticeId(request.studentId)
    if (!id || byId.has(id) || !RELATED_STATUSES.has(request.status)) continue
    byId.set(id, { id, name: request.studentName, subject: request.subject })
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
}

/** The catalog subject a request's subject names, or "". */
function catalogSubjectFor(subject: string | null | undefined, catalog: CurriculumCatalog | undefined) {
  const wanted = normalSubjectId(subject)
  if (!wanted || !catalog) return ''
  return catalog.subjects.find((item) => normalSubjectId(item.id) === wanted)?.id ?? ''
}

function errorKind(error: unknown): 'noRelation' | 'stale' | 'other' {
  if (!(error instanceof ApiError)) return 'other'
  if (error.status === 404) return 'noRelation'
  if (error.code === 'batch_preview_stale' || error.code === 'candidate_not_in_preview') return 'stale'
  return 'other'
}

const resultTones: Record<string, PillTone> = {
  assigned: 'green',
  delivered: 'green',
  created: 'green',
  duplicate: 'gold',
  skipped: 'neutral',
  refused: 'danger',
  failed: 'danger',
}

export function TeacherAssignPracticePage() {
  const { t } = useTranslation('teacher')
  const [searchParams] = useSearchParams()
  const linkedStudentId = readPracticeId(searchParams.get('studentId'))
  const linkedRequestId = readPracticeId(searchParams.get('request'))

  const requestsQuery = useTeacherHelpRequestsQuery()
  const requests = useMemo(() => requestsQuery.data?.items ?? [], [requestsQuery.data])
  const catalog = useCurriculumCatalogQuery().data
  const linkedRequest = linkedRequestId ? requests.find((request) => request.requestId === linkedRequestId) : undefined

  // The students offered: the teacher's own, plus the one a link names, which
  // the backend may still accept (it alone knows the 14 days).
  const students = useMemo(() => {
    const related = studentsOf(requests)
    const linkedId = linkedStudentId || readPracticeId(linkedRequest?.studentId)
    if (linkedId && !related.some((student) => student.id === linkedId)) {
      const named = requests.find((request) => request.studentId === linkedId)
      related.unshift({
        id: linkedId,
        name: named?.studentName || t('assignPractice.student.fromRequest'),
        subject: linkedRequest?.subject ?? named?.subject,
      })
    }
    return related
  }, [linkedRequest, linkedStudentId, requests, t])

  const [chosenStudentId, setChosenStudentId] = useState('')
  const studentId = chosenStudentId || linkedStudentId || readPracticeId(linkedRequest?.studentId)
  const student = students.find((item) => item.id === studentId)
  const studentName = student?.name ?? t('assignPractice.student.fromRequest')

  const [chosenSubject, setChosenSubject] = useState<string | null>(null)
  // Until the teacher picks one, the subject of the request they came from.
  const subject = chosenSubject ?? catalogSubjectFor(linkedRequest?.subject ?? student?.subject, catalog)
  const [topicId, setTopicId] = useState('')
  const [overrides, setOverrides] = useState<Overrides>({})

  const subjectChoices: ProfileChoice[] = useMemo(
    () =>
      [...(catalog?.subjects ?? [])]
        .sort((a, b) => a.order - b.order)
        .map((item) => ({ code: item.id, label: item.name || getSubjectLabel(item.id, t) || item.id })),
    [catalog, t],
  )
  const topicTitles = useMemo(() => new Map((catalog?.topics ?? []).map((topic) => [topic.id, topic.title])), [catalog])
  const topicChoices: ProfileChoice[] = useMemo(() => {
    if (!subject) return []
    const seen = new Set<string>()
    return [...(catalog?.topics ?? [])]
      .filter((topic) => normalSubjectId(topic.subjectId) === normalSubjectId(subject))
      .sort((a, b) => a.order - b.order)
      .filter((topic) => !seen.has(topic.id) && Boolean(seen.add(topic.id)))
      .map((topic) => ({ code: topic.id, label: topic.title || getTopicLabel(topic.id, t) }))
  }, [catalog, subject, t])
  const topicName = (id: string | null | undefined) => (id ? topicTitles.get(id) || getTopicLabel(id, t) : '')
  // A topic-only candidate is labelled with its topic id: say it as words.
  const candidateTitle = (candidate: Pick<AutomationCandidate, 'title' | 'topicId'>) => {
    if (candidate.title && candidate.title !== candidate.topicId) return candidate.title
    return candidate.topicId
      ? t('assignPractice.candidates.untitled', { topic: topicName(candidate.topicId) })
      : t('assignPractice.candidates.untitledPlain')
  }

  const policy = useMemo<AutomationPolicyInput>(
    () => ({
      // The teacher approves this batch, and the work is assigned, not only suggested.
      autonomyLevel: 'teacher_approved_batch',
      deliveryMode: 'assigned',
      ...(topicId ? { topicIds: [topicId] } : {}),
      ...overrides,
    }),
    [overrides, topicId],
  )

  const previewMutation = useAutomationPreviewMutation()
  const executeMutation = useAutomationExecuteMutation()
  const preview = previewMutation.data
  const [unticked, setUnticked] = useState<ReadonlySet<string>>(new Set())
  const executed = Boolean(
    preview && executeMutation.isSuccess && executeMutation.variables?.request.batchId === preview.batchId,
  )
  const results = executed ? executeMutation.data?.results ?? [] : []
  const newAssignmentIds = new Set(
    results.filter((result) => resultCreatedWork(result.status) && result.assignmentId).map((result) => result.assignmentId),
  )
  const tickedCount = preview ? preview.selected.filter((candidate) => !unticked.has(candidate.candidateId)).length : 0

  const seenQuery = useStudentAssignmentsQuery(studentId, { includeArchived: false })

  // Whatever the preview was made from, a change makes it someone else's.
  const startOver = () => {
    previewMutation.reset()
    executeMutation.reset()
    setUnticked(new Set())
  }

  const findExercises = () => {
    if (!studentId || executeMutation.isPending) return
    executeMutation.reset()
    setUnticked(new Set())
    previewMutation.mutate({ studentId, request: { policy, subject: subject || undefined } })
  }

  const assign = () => {
    const sent = previewMutation.variables
    if (!preview || !sent || executed || tickedCount === 0) return
    executeMutation.mutate({
      studentId: sent.studentId,
      request: {
        batchId: preview.batchId,
        approved: true,
        // The batch is previewed again from what the preview was asked with.
        policy: sent.request.policy,
        subject: sent.request.subject,
        candidates: preview.selected.map((candidate) => toExecuteCandidate(candidate, !unticked.has(candidate.candidateId))),
      },
    })
  }

  const toggle = (candidate: AutomationCandidate) =>
    setUnticked((current) => {
      const next = new Set(current)
      if (next.has(candidate.candidateId)) next.delete(candidate.candidateId)
      else next.add(candidate.candidateId)
      return next
    })

  const setOverride = <Key extends keyof Overrides>(key: Key, value: Overrides[Key] | undefined) => {
    startOver()
    setOverrides((current) => {
      const next = { ...current }
      if (value === undefined) delete next[key]
      else next[key] = value
      return next
    })
  }

  const numberOverride = (key: 'dueInDays' | 'freshnessDays' | 'maxAssignmentsPerStudent', raw: string, max: number) => {
    const value = Number.parseInt(raw, 10)
    setOverride(key, Number.isFinite(value) && value >= 1 ? Math.min(value, max) : undefined)
  }

  const sourceTypes = (overrides.sourceTypes ?? BACKEND_DEFAULTS.sourceTypes) as readonly string[]
  const toggleSource = (source: SourceType) => {
    const next = sourceTypes.includes(source) ? sourceTypes.filter((item) => item !== source) : [...sourceTypes, source]
    // The backend refuses an empty list: the last kind stays ticked.
    if (next.length === 0) return
    const isDefault = SOURCE_TYPES.every((item) => next.includes(item))
    setOverride('sourceTypes', isDefault ? undefined : (next as AutomationPolicy['sourceTypes']))
  }

  const previewError = previewMutation.error
  const executeError = executeMutation.error

  return (
    <DashboardLayout>
      <PageContainer size="default" className="p-0">
        <PageHeader eyebrow={t('assignPractice.eyebrow')} title={t('assignPractice.title')} description={t('assignPractice.description')} />

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{t('assignPractice.choose.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {requestsQuery.isLoading && <LoadingState message={t('assignPractice.student.loading')} />}
              {requestsQuery.isError && students.length === 0 && (
                <ErrorState title={t('assignPractice.student.failed')} message={t('assignPractice.student.failedBody')} />
              )}
              {requestsQuery.isSuccess && students.length === 0 && (
                <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">{t('assignPractice.student.none')}</p>
              )}
              {/* Once the requests are read: the subject a link opens on comes from its request. */}
              {!requestsQuery.isLoading && students.length > 0 && (
                <ChoiceSelect
                  label={t('assignPractice.student.label')}
                  placeholder={t('assignPractice.student.placeholder')}
                  hint={t('assignPractice.student.hint')}
                  choices={students.map((item) => ({ code: item.id, label: item.name }))}
                  value={studentId}
                  onChange={(code) => {
                    startOver()
                    setChosenStudentId(code)
                    setChosenSubject(null)
                    setTopicId('')
                  }}
                />
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <ChoiceSelect
                  label={t('assignPractice.subject.label')}
                  placeholder={t('assignPractice.subject.any')}
                  choices={subjectChoices}
                  value={subject}
                  onChange={(code) => {
                    startOver()
                    setChosenSubject(code)
                    setTopicId('')
                  }}
                />
                <ChoiceSelect
                  label={t('assignPractice.topic.label')}
                  placeholder={t('assignPractice.topic.any')}
                  hint={subject ? undefined : t('assignPractice.topic.subjectFirst')}
                  choices={topicChoices}
                  value={topicId}
                  disabled={!subject}
                  onChange={(code) => {
                    startOver()
                    setTopicId(code)
                  }}
                />
              </div>

              <details className="rounded-md border p-3">
                <summary className="cursor-pointer text-sm font-semibold">{t('assignPractice.more.summary')}</summary>
                <div className="mt-3 space-y-4">
                  <p className="text-sm text-muted-foreground">{t('assignPractice.more.hint')}</p>
                  <ChoiceSelect
                    label={t('assignPractice.more.confidence')}
                    placeholder={t('assignPractice.more.confidenceDefault', {
                      level: t(`assignPractice.more.level.${BACKEND_DEFAULTS.confidenceThreshold}`),
                    })}
                    choices={CONFIDENCE_LEVELS.map((level) => ({ code: level, label: t(`assignPractice.more.level.${level}`) }))}
                    value={overrides.confidenceThreshold ?? ''}
                    onChange={(code) =>
                      setOverride('confidenceThreshold', (code || undefined) as AutomationPolicy['confidenceThreshold'] | undefined)
                    }
                  />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <TextField
                      label={t('assignPractice.more.maxAssignments')}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={20}
                      value={overrides.maxAssignmentsPerStudent ?? BACKEND_DEFAULTS.maxAssignmentsPerStudent}
                      onChange={(event) => numberOverride('maxAssignmentsPerStudent', event.target.value, 20)}
                    />
                    <TextField
                      label={t('assignPractice.more.dueInDays')}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={365}
                      value={overrides.dueInDays ?? BACKEND_DEFAULTS.dueInDays}
                      onChange={(event) => numberOverride('dueInDays', event.target.value, 365)}
                    />
                    <TextField
                      label={t('assignPractice.more.freshnessDays')}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={180}
                      value={overrides.freshnessDays ?? BACKEND_DEFAULTS.freshnessDays}
                      onChange={(event) => numberOverride('freshnessDays', event.target.value, 180)}
                    />
                  </div>
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-semibold">{t('assignPractice.more.sources')}</legend>
                    {SOURCE_TYPES.map((source) => (
                      <label key={source} className="flex min-h-11 items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          className="h-5 w-5"
                          checked={sourceTypes.includes(source)}
                          onChange={() => toggleSource(source)}
                        />
                        {t(`assignPractice.more.source.${source}`)}
                      </label>
                    ))}
                  </fieldset>
                  {Object.keys(overrides).length > 0 && (
                    <Button
                      variant="plain"
                      onClick={() => {
                        startOver()
                        setOverrides({})
                      }}
                    >
                      {t('assignPractice.more.reset')}
                    </Button>
                  )}
                </div>
              </details>

              <Button
                fullWidth
                disabled={!studentId || requestsQuery.isLoading || previewMutation.isPending || executeMutation.isPending}
                onClick={findExercises}
              >
                {previewMutation.isPending ? t('assignPractice.finding') : t('assignPractice.find')}
              </Button>
            </CardContent>
          </Card>

          {previewError && (
            <Card className="border-destructive/40">
              <CardContent className="pt-6">
                <ErrorState
                  title={t('assignPractice.errors.previewFailed')}
                  message={
                    errorKind(previewError) === 'noRelation'
                      ? t('assignPractice.errors.noRelation', { name: studentName })
                      : toUserFacingError(previewError, t('assignPractice.errors.tryAgain'))
                  }
                />
              </CardContent>
            </Card>
          )}

          {preview && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{t('assignPractice.candidates.title', { name: studentName })}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {preview.selected.length === 0 ? (
                  <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    {t('assignPractice.candidates.empty', { name: studentName })}
                  </p>
                ) : (
                  <>
                    {!executed && <p className="text-sm text-muted-foreground">{t('assignPractice.candidates.hint')}</p>}
                    <ul className="space-y-3" aria-label={t('assignPractice.candidates.listLabel')}>
                      {preview.selected.map((candidate) => (
                        <li key={candidate.candidateId} className="rounded-md border p-3">
                          <label className="flex cursor-pointer items-start gap-3">
                            <input
                              type="checkbox"
                              className="mt-0.5 h-5 w-5 shrink-0"
                              checked={!unticked.has(candidate.candidateId)}
                              disabled={executed || executeMutation.isPending}
                              onChange={() => toggle(candidate)}
                            />
                            <span className="min-w-0 space-y-1">
                              <span className="block font-medium break-words">{candidateTitle(candidate)}</span>
                              {candidate.topicId && (
                                <span className="block text-sm text-muted-foreground">
                                  {t('assignPractice.candidates.topic', { topic: topicName(candidate.topicId) })}
                                </span>
                              )}
                              <span className="block text-sm leading-6">{candidateReason(candidate, t)}</span>
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                    {!executed && (
                      <Button fullWidth disabled={tickedCount === 0 || executeMutation.isPending} onClick={assign}>
                        {executeMutation.isPending
                          ? t('assignPractice.assigning')
                          : tickedCount === 0
                            ? t('assignPractice.assignNone')
                            : t('assignPractice.assign', { count: tickedCount, name: studentName })}
                      </Button>
                    )}
                  </>
                )}

                {preview.refused.length > 0 && (
                  <details className="rounded-md border p-3">
                    <summary className="cursor-pointer text-sm font-semibold">
                      {t('assignPractice.refused.summary', { count: preview.refused.length })}
                    </summary>
                    <ul className="mt-3 space-y-2">
                      {preview.refused.map((candidate) => (
                        <li key={`refused-${candidate.candidateId}`} className="text-sm">
                          <span className="font-medium break-words">{candidateTitle(candidate)}</span>
                          <span className="block text-muted-foreground">{refusalReason(candidate, t)}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </CardContent>
            </Card>
          )}

          {executeError && (
            <Card className="border-destructive/40">
              <CardContent className="space-y-3 pt-6">
                <ErrorState
                  title={t('assignPractice.errors.assignFailed')}
                  message={
                    errorKind(executeError) === 'stale'
                      ? t('assignPractice.errors.stale')
                      : errorKind(executeError) === 'noRelation'
                        ? t('assignPractice.errors.noRelation', { name: studentName })
                        : toUserFacingError(executeError, t('assignPractice.errors.tryAgain'))
                  }
                />
                {errorKind(executeError) === 'stale' && (
                  <Button variant="tinted" onClick={findExercises}>
                    {t('assignPractice.find')}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{t('assignPractice.results.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3" aria-label={t('assignPractice.results.title')}>
                  {results.map((result) => {
                    const candidate = preview?.selected.find((item) => item.candidateId === result.candidateId)
                    const title = result.assignment?.title || (candidate ? candidateTitle(candidate) : t('assignPractice.candidates.untitledPlain'))
                    return (
                      <li key={`${result.candidateId}-${result.automationKey}`} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-start sm:justify-between">
                        <span className="min-w-0">
                          <span className="block font-medium break-words">{title}</span>
                          <span className="block text-sm text-muted-foreground">{resultReason(result, t)}</span>
                        </span>
                        <Pill tone={resultTones[result.status] ?? 'neutral'}>{resultStatusLabel(result.status, t)}</Pill>
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          {studentId && (
            <section className="space-y-3" aria-labelledby="assign-practice-seen">
              <div>
                <h2 id="assign-practice-seen" className="text-xl font-semibold">
                  {t('assignPractice.seen.title', { name: studentName })}
                </h2>
                <p className="text-sm text-muted-foreground">{t('assignPractice.seen.hint', { name: studentName })}</p>
              </div>
              {seenQuery.isLoading && <LoadingState message={t('assignPractice.seen.loading')} />}
              {seenQuery.error && errorKind(seenQuery.error) === 'noRelation' && (
                <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  {t('assignPractice.errors.noRelation', { name: studentName })}
                </p>
              )}
              {seenQuery.error && errorKind(seenQuery.error) !== 'noRelation' && (
                <ErrorState title={t('assignPractice.seen.failed')} message={toUserFacingError(seenQuery.error, t('assignPractice.errors.tryAgain'))} />
              )}
              {seenQuery.data?.items.length === 0 && (
                <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">{t('assignPractice.seen.empty', { name: studentName })}</p>
              )}
              <div className="grid gap-4">
                {[...(seenQuery.data?.items ?? [])]
                  // What was just assigned comes first.
                  .sort((a, b) => Number(newAssignmentIds.has(b.assignmentId)) - Number(newAssignmentIds.has(a.assignmentId)))
                  .map((assignment) => (
                    <AssignmentExplanationCard
                      key={assignment.assignmentId}
                      assignment={assignment}
                      link={null}
                      marker={newAssignmentIds.has(assignment.assignmentId) ? <Pill tone="accent">{t('assignPractice.seen.new')}</Pill> : undefined}
                    />
                  ))}
              </div>
            </section>
          )}
        </div>
      </PageContainer>
    </DashboardLayout>
  )
}
