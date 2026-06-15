import { BookOpenCheck, Clock, Compass } from 'lucide-react'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMyAssignmentsQuery } from '@/hooks/learning/useLearningOperationsQueries'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type { LearningAssignment } from '@/types/learningOperations'

function dueLabel(value?: string | null) {
  if (!value) return 'No due date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function sourceLabel(assignment: LearningAssignment) {
  if (assignment.automation) return 'Automation-created practice'
  if (assignment.sourceType === 'ai_draft') return 'Tutor-reviewed AI practice'
  if (assignment.sourceType === 'curriculum_exercise') return 'Curriculum practice'
  return 'Reviewed practice'
}

function nextAction(status: string) {
  if (status === 'completed') return 'Review feedback'
  if (status === 'started') return 'Continue practice'
  if (status === 'skipped') return 'Ask your tutor what to try next'
  return 'Start practice'
}

function AssignmentExplanationCard({ assignment }: { assignment: LearningAssignment }) {
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
            <p className="flex items-center gap-2 text-sm font-semibold"><Compass className="h-4 w-4" /> Source</p>
            <p className="mt-1 text-sm text-muted-foreground">{sourceLabel(assignment)}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="flex items-center gap-2 text-sm font-semibold"><BookOpenCheck className="h-4 w-4" /> Target</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {assignment.subject || 'Subject pending'} / {assignment.topicIds.join(', ') || 'topic pending'}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="flex items-center gap-2 text-sm font-semibold"><Clock className="h-4 w-4" /> Due</p>
            <p className="mt-1 text-sm text-muted-foreground">{dueLabel(assignment.dueAt)}</p>
          </div>
        </div>
        <div className="rounded-md border bg-muted/30 p-4">
          <p className="text-sm font-semibold">Why this appeared</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {assignment.automation?.explanation
              || assignment.rationale
              || 'This practice was selected from reviewed learning signals so your next work stays focused.'}
          </p>
        </div>
        <p className="text-sm font-semibold text-foreground">{nextAction(assignment.status)}</p>
      </CardContent>
    </Card>
  )
}

export function StudentAssignmentsPage() {
  const assignmentsQuery = useMyAssignmentsQuery()
  const assignments = assignmentsQuery.data?.items ?? []

  return (
    <DashboardLayout>
      <PageContainer size="wide" className="p-0">
        <PageHeader
          eyebrow="Practice"
          title="My assignments"
          description="Understand what practice was assigned, what it targets, and what to do next."
        />

        {assignmentsQuery.isLoading && <LoadingState message="Loading your assignments..." />}
        {assignmentsQuery.error && <ErrorState title="Assignments failed" message={assignmentsQuery.error.message} />}
        {assignments.length === 0 && assignmentsQuery.isSuccess && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">No reviewed assignments are waiting right now.</p>
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
