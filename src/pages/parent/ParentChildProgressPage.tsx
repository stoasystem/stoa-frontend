import { useParams } from 'react-router-dom'
import { BookMarked, CheckCircle2, Target } from 'lucide-react'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useParentChildProgressQuery } from '@/hooks/learning/useLearningOperationsQueries'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type { LearningAssignment } from '@/types/learningOperations'

function familyExplanation(assignment: LearningAssignment) {
  return assignment.automation?.explanation
    || assignment.rationale
    || 'This practice appears because current learning signals show it may help reinforce the next topic.'
}

function FamilyAssignmentRow({ assignment }: { assignment: LearningAssignment }) {
  return (
    <div className="rounded-md border p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold">{assignment.title || assignment.assignmentId}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {assignment.subject || 'Subject pending'} / {assignment.topicIds.join(', ') || 'topic pending'}
          </p>
        </div>
        <span className="rounded-full border px-2 py-1 text-xs font-semibold text-muted-foreground">{assignment.status}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{familyExplanation(assignment)}</p>
    </div>
  )
}

export function ParentChildProgressPage() {
  const { childId } = useParams()
  const progressQuery = useParentChildProgressQuery(childId ?? '')
  const progress = progressQuery.data

  return (
    <DashboardLayout>
      <PageContainer size="wide" className="p-0">
        <PageHeader
          eyebrow="Parent progress"
          title="Assignment explanations"
          description="See what practice was assigned, why it appeared, and what learning target it supports."
        />

        {!childId && <ErrorState title="Missing child" message="Open this page from a child profile." />}
        {progressQuery.isLoading && <LoadingState message="Loading child progress..." />}
        {progressQuery.error && <ErrorState title="Child progress failed" message={progressQuery.error.message} />}

        {progress && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <p className="flex items-center gap-2 text-2xl font-semibold"><BookMarked className="h-5 w-5" /> {progress.assignedPracticeCount}</p>
                  <p className="text-sm text-muted-foreground">Assigned practice</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="flex items-center gap-2 text-2xl font-semibold"><CheckCircle2 className="h-5 w-5" /> {progress.completedPracticeCount}</p>
                  <p className="text-sm text-muted-foreground">Completed practice</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="flex items-center gap-2 text-2xl font-semibold"><Target className="h-5 w-5" /> {progress.weakAreas.length}</p>
                  <p className="text-sm text-muted-foreground">Current focus areas</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Active assignments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {progress.assignments.length === 0 && (
                  <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    No active assignments are waiting.
                  </p>
                )}
                {progress.assignments.map((assignment) => (
                  <FamilyAssignmentRow key={assignment.assignmentId} assignment={assignment} />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Recently completed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {progress.completedAssignments.length === 0 && (
                  <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    No completed automated practice is visible yet.
                  </p>
                )}
                {progress.completedAssignments.map((assignment) => (
                  <FamilyAssignmentRow key={assignment.assignmentId} assignment={assignment} />
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
