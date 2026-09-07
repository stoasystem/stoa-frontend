import { BookOpenCheck, Clock, Compass } from 'lucide-react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMyAssignmentsQuery } from '@/hooks/learning/useLearningOperationsQueries'
import { formatDayAndMonth } from '@/lib/formatDateTime'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type { LearningAssignment } from '@/types/learningOperations'

function dueLabel(value: string | null | undefined, t: TFunction<'practice'>) {
  if (!value) return t('assignments.noDueDate')
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return formatDayAndMonth(date)
}

function sourceLabel(assignment: LearningAssignment, t: TFunction<'practice'>) {
  if (assignment.automation) return t('assignments.sources.automation')
  if (assignment.sourceType === 'ai_draft') return t('assignments.sources.ai_draft')
  if (assignment.sourceType === 'curriculum_exercise') {
    return t('assignments.sources.curriculum_exercise')
  }
  return t('assignments.sources.reviewed')
}

function nextAction(status: string, t: TFunction<'practice'>) {
  if (status === 'completed') return t('assignments.nextAction.completed')
  if (status === 'started') return t('assignments.nextAction.started')
  if (status === 'skipped') return t('assignments.nextAction.skipped')
  return t('assignments.nextAction.default')
}

function AssignmentExplanationCard({ assignment }: { assignment: LearningAssignment }) {
  const { t } = useTranslation('practice')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-start justify-between gap-3 text-xl">
          <span>{assignment.title || assignment.assignmentId}</span>
          <span className="rounded-full border px-2 py-1 text-xs font-semibold text-muted-foreground">{assignment.status}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border p-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Compass className="h-4 w-4" /> {t('assignments.source')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{sourceLabel(assignment, t)}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <BookOpenCheck className="h-4 w-4" /> {t('assignments.target')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {assignment.subject || t('assignments.subjectPending')}
              {' / '}
              {assignment.topicIds.join(', ') || t('assignments.topicPending')}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4" /> {t('assignments.due')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{dueLabel(assignment.dueAt, t)}</p>
          </div>
        </div>
        <div className="rounded-md border bg-muted/30 p-4">
          <p className="text-sm font-semibold">{t('assignments.whyThisAppeared')}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {assignment.automation?.explanation
              || assignment.rationale
              || t('assignments.defaultRationale')}
          </p>
        </div>
        <p className="text-sm font-semibold text-foreground">
          {nextAction(assignment.status, t)}
        </p>
      </CardContent>
    </Card>
  )
}

export function StudentAssignmentsPage() {
  const { t } = useTranslation('practice')
  const assignmentsQuery = useMyAssignmentsQuery()
  const assignments = assignmentsQuery.data?.items ?? []

  return (
    <DashboardLayout>
      <PageContainer size="wide" className="p-0">
        <PageHeader
          eyebrow={t('assignments.eyebrow')}
          title={t('assignments.title')}
          description={t('assignments.description')}
        />

        {assignmentsQuery.isLoading && <LoadingState message={t('assignments.loading')} />}
        {assignmentsQuery.error && (
          <ErrorState title={t('assignments.failed')} message={assignmentsQuery.error.message} />
        )}
        {assignments.length === 0 && assignmentsQuery.isSuccess && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{t('assignments.empty')}</p>
            </CardContent>
          </Card>
        )}
        <div className="grid gap-4 xl:grid-cols-2">
          {assignments.map((assignment) => (
            <AssignmentExplanationCard key={assignment.assignmentId} assignment={assignment} />
          ))}
        </div>
      </PageContainer>
    </DashboardLayout>
  )
}
